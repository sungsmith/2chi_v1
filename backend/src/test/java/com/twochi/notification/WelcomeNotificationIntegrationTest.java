package com.twochi.notification;

import com.twochi.auth.dto.SignupRequest;
import com.twochi.auth.service.SignupService;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class WelcomeNotificationIntegrationTest {

    private static final String HASH =
        "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";

    @Autowired SignupService signupService;
    @Autowired NotificationProducer producer;
    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired ConsentLogRepository consentLogRepository;

    @BeforeEach
    @AfterEach
    void clean() {
        notificationRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    private SignupRequest validReq() {
        return new SignupRequest(
            "welcome-it@example.com", "Pass1234!", "wcomeit", true,
            new SignupRequest.Consents(true, true, false));
    }

    @Test
    void 회원가입_완료시_환영알림_1건_생성() {
        signupService.signup(validReq(), "127.0.0.1", "test-agent");

        List<Notification> all = notificationRepository.findAll();
        assertThat(all).hasSize(1);
        Notification n = all.get(0);
        assertThat(n.getType()).isEqualTo(NotificationType.WELCOME);
        assertThat(n.getChannel()).isEqualTo(NotificationChannel.INBOX);
        assertThat(n.getDedupKey()).isEqualTo("WELCOME");
        assertThat(n.getTitle()).contains("축하");
    }

    @Test
    void 환영알림_같은_user_중복발행시_1건() {
        Long userId = userRepository.save(
            User.createEmailUser("dup-welcome@example.com", HASH, "dupw")).getId();

        producer.publishDeduped(userId, NotificationType.WELCOME, "환영", "WELCOME");
        producer.publishDeduped(userId, NotificationType.WELCOME, "환영", "WELCOME");

        assertThat(notificationRepository.count()).isEqualTo(1);
    }
}
