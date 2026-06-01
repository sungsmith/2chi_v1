package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class WelcomeTypeMigrationTest {

    private static final String HASH =
        "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";

    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
        userId = userRepository.save(
            User.createEmailUser("welcome-type@example.com", HASH, "wtype")).getId();
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void WELCOME_타입_알림_저장_성공() {
        Notification saved = notificationRepository.save(
            Notification.forInboxDeduped(
                userId, NotificationType.WELCOME, "환영", null, Instant.now(), "WELCOME"));

        assertThat(saved.getId()).isNotNull();
        assertThat(notificationRepository.findById(saved.getId()).orElseThrow().getType())
            .isEqualTo(NotificationType.WELCOME);
    }
}
