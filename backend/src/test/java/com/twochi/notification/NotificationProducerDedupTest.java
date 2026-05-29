package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationProducerDedupTest {

    @Autowired NotificationProducer producer;
    @Autowired NotificationRepository repository;
    @Autowired UserRepository userRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        userRepository.deleteAll();
        String hash = "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";
        userId = userRepository.save(User.createEmailUser("noti-dedup-u1@example.com", hash, "u1")).getId();
    }

    @AfterEach
    void tearDown() {
        repository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void 같은_dedupKey_두번_publish_해도_한건만() {
        producer.publishDeduped(userId, NotificationType.POSTING_DEADLINE_D1, "마감 내일", "PD_D1:42");
        producer.publishDeduped(userId, NotificationType.POSTING_DEADLINE_D1, "마감 내일", "PD_D1:42");

        assertThat(repository.count()).isEqualTo(1);
    }
}
