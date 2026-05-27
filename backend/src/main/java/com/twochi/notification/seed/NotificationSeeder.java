package com.twochi.notification.seed;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Dev profile only. Application 시작 시 첫 사용자에게 sample 6개 insert (INBOX 채널).
 * Idempotent: notification 테이블에 이미 row 가 있으면 skip.
 * Prod 영향 0 (Bean 미등록).
 * V1 type CHECK 의 7 값 안의 type 만 사용.
 */
@Component
@Profile("dev")
public class NotificationSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationSeeder.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationSeeder(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            log.info("[NotificationSeeder] notification 테이블이 비어있지 않아 seeding skip");
            return;
        }

        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            log.info("[NotificationSeeder] 사용자 없음. seeding skip");
            return;
        }

        Instant now = Instant.now();
        notificationRepository.saveAll(List.of(
            Notification.forInbox(user.getId(), NotificationType.POSTING_DEADLINE_D1,         "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요", null, now.minus(Duration.ofHours(3))),
            Notification.forInbox(user.getId(), NotificationType.SCHEDULE_D1,                  "(주)테크컴퍼니 1차면접 일정이 등록됐어요",        null, now.minus(Duration.ofHours(5))),
            Notification.forInbox(user.getId(), NotificationType.WEEKLY_SUMMARY,               "이번 주 자소서·지원 현황 요약을 정리했어요",      null, now.minus(Duration.ofHours(8))),
            Notification.forInbox(user.getId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D,  "네이버 신입 백엔드 자소서를 저장하고 제출하지 않은 지 7일이에요", null, now.minus(Duration.ofDays(1))),
            Notification.forInbox(user.getId(), NotificationType.POSTING_DEADLINE_D3,          "쿠팡 백엔드 (라스트마일) 마감 D-3",              null, now.minus(Duration.ofDays(2))),
            Notification.forInbox(user.getId(), NotificationType.EMAIL_VERIFY,                  "회원가입 인증 메일을 발송했어요",                 null, now.minus(Duration.ofDays(3)))
        ));
        log.info("[NotificationSeeder] 사용자 {} 에게 sample 6개 insert (INBOX channel)", user.getId());
    }
}
