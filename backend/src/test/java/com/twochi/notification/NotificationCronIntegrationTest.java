package com.twochi.notification;

import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationCronIntegrationTest {

    @Autowired UserRepository userRepository;
    @Autowired JobPostingRepository jobPostingRepository;
    @Autowired NotificationGenerator generator;
    @Autowired NotificationRepository notificationRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        jobPostingRepository.deleteAll();
        userRepository.deleteAll();
        userId = userRepository.save(User.createEmailUser(
            "noti-cron-it@example.com",
            "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123",
            "cron-it"
        )).getId();
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        jobPostingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void cron_2회_실행해도_같은_공고_D1_알림은_1건만() {
        LocalDate today = LocalDate.now();
        // D-1 마감 공고 1건. deadline-d1 설정 defaultOn=true → row 없어도 알림 대상.
        jobPostingRepository.saveAndFlush(JobPosting.create(
            userId, JobPosting.Source.MANUAL, "카카오", "백엔드",
            null, null, null, null,
            today.plusDays(1), null, new String[0], Instant.now()
        ));

        generator.generatePostingDeadline(today);
        long after1 = notificationRepository.count();
        generator.generatePostingDeadline(today);
        long after2 = notificationRepository.count();

        assertThat(after1).isEqualTo(1);
        assertThat(after2).isEqualTo(1);  // 멱등: dedup_key 로 2회차 skip
    }
}
