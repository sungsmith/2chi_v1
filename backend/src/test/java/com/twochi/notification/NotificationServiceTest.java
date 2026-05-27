package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationService;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationServiceTest {

    @Autowired private NotificationService service;
    @Autowired private NotificationRepository repository;
    @Autowired private UserRepository userRepository;

    private Long USER_ID;
    private Long OTHER_USER;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        userRepository.deleteAll();
        String hash = "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";
        USER_ID = userRepository.save(User.createEmailUser("noti-svc-user@example.com", hash, "u-self")).getId();
        OTHER_USER = userRepository.save(User.createEmailUser("noti-svc-other@example.com", hash, "u-other")).getId();
    }

    @AfterEach
    void tearDown() {
        repository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void list_filtersOut30DaysAgo() {
        Instant now = Instant.now();
        repository.save(Notification.forInbox(USER_ID, NotificationType.POSTING_DEADLINE_D3, "최근", null, now.minus(Duration.ofDays(5))));
        repository.save(Notification.forInbox(USER_ID, NotificationType.POSTING_DEADLINE_D3, "31일전", null, now.minus(Duration.ofDays(31))));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(1);
        assertThat(result.notifications().get(0).title()).isEqualTo("최근");
    }

    @Test
    void list_orderedByCreatedAtDesc() {
        Instant now = Instant.now();
        repository.save(Notification.forInbox(USER_ID, NotificationType.WEEKLY_SUMMARY, "오래된", null, now.minus(Duration.ofHours(10))));
        repository.save(Notification.forInbox(USER_ID, NotificationType.WEEKLY_SUMMARY, "최신", null, now.minus(Duration.ofHours(1))));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(2);
        assertThat(result.notifications().get(0).title()).isEqualTo("최신");
        assertThat(result.notifications().get(1).title()).isEqualTo("오래된");
    }

    @Test
    void list_otherUsersExcluded() {
        Instant now = Instant.now();
        repository.save(Notification.forInbox(USER_ID,    NotificationType.WEEKLY_SUMMARY, "내것", null, now));
        repository.save(Notification.forInbox(OTHER_USER, NotificationType.WEEKLY_SUMMARY, "남것", null, now));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(1);
        assertThat(result.notifications().get(0).title()).isEqualTo("내것");
    }

    @Test
    void markAllRead_setsReadAtForUnreadOnly() {
        Instant now = Instant.now();
        Notification unread = repository.save(Notification.forInbox(USER_ID, NotificationType.WEEKLY_SUMMARY, "unread", null, now));
        Notification read = Notification.forInbox(USER_ID, NotificationType.WEEKLY_SUMMARY, "already-read", null, now);
        read.markRead(now.minus(Duration.ofMinutes(10)));
        Instant priorReadAt = read.getReadAt();
        repository.save(read);

        service.markAllRead(USER_ID);

        var refreshedUnread = repository.findById(unread.getId()).orElseThrow();
        var refreshedRead = repository.findById(read.getId()).orElseThrow();
        assertThat(refreshedUnread.getReadAt()).isNotNull();
        assertThat(refreshedRead.getReadAt()).isEqualTo(priorReadAt);
    }

    @Test
    void deleteAll_removesAllForUserOnly() {
        Instant now = Instant.now();
        repository.save(Notification.forInbox(USER_ID,    NotificationType.WEEKLY_SUMMARY, "내것1", null, now));
        repository.save(Notification.forInbox(USER_ID,    NotificationType.WEEKLY_SUMMARY, "내것2", null, now));
        repository.save(Notification.forInbox(OTHER_USER, NotificationType.WEEKLY_SUMMARY, "남것", null, now));

        service.deleteAll(USER_ID);

        Instant cutoff = now.minus(Duration.ofDays(30));
        assertThat(repository.findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(USER_ID, NotificationChannel.INBOX, cutoff)).isEmpty();
        assertThat(repository.findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(OTHER_USER, NotificationChannel.INBOX, cutoff)).hasSize(1);
    }
}
