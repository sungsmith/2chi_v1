package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class NotificationRepositoryTest {

    @Autowired NotificationRepository repository;
    @Autowired UserRepository userRepository;

    private Long userId1;
    private Long userId2;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        userRepository.deleteAll();
        String hash = "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";
        userId1 = userRepository.save(User.createEmailUser("noti-repo-u1@example.com", hash, "u1")).getId();
        userId2 = userRepository.save(User.createEmailUser("noti-repo-u2@example.com", hash, "u2")).getId();
    }

    @AfterEach
    void tearDown() {
        repository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void dedupKey_중복_insert_는_unique_위반() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInboxDeduped(userId1, NotificationType.POSTING_DEADLINE_D1, "t", null, now, "PD_D1:42"));
        assertThatThrownBy(() ->
            repository.saveAndFlush(Notification.forInboxDeduped(userId1, NotificationType.POSTING_DEADLINE_D1, "t2", null, now, "PD_D1:42"))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void existsByUserIdAndDedupKey_정확히_매칭() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInboxDeduped(userId1, NotificationType.POSTING_DEADLINE_D1, "t", null, now, "PD_D1:42"));
        assertThat(repository.existsByUserIdAndDedupKey(userId1, "PD_D1:42")).isTrue();
        assertThat(repository.existsByUserIdAndDedupKey(userId1, "PD_D1:99")).isFalse();
        assertThat(repository.existsByUserIdAndDedupKey(userId2, "PD_D1:42")).isFalse();
    }

    @Test
    @Transactional  // @Modifying bulk delete 는 활성 트랜잭션 필요. count() 는 aggregate 쿼리라 1차 캐시 안 거쳐 stale 없음.
    void cleanup_은_cutoff_이전_INBOX_만_삭제() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInbox(userId1, NotificationType.WEEKLY_SUMMARY, "old", null, now.minus(Duration.ofDays(31))));
        repository.saveAndFlush(Notification.forInbox(userId1, NotificationType.WEEKLY_SUMMARY, "fresh", null, now.minus(Duration.ofDays(29))));
        int deleted = repository.deleteByChannelAndCreatedAtBefore(NotificationChannel.INBOX, now.minus(Duration.ofDays(30)));
        assertThat(deleted).isEqualTo(1);
        assertThat(repository.count()).isEqualTo(1);
    }
}
