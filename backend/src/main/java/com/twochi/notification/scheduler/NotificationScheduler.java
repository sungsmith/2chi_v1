package com.twochi.notification.scheduler;

import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Component
@Profile("prod")
public class NotificationScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final NotificationGenerator generator;
    private final NotificationService service;

    public NotificationScheduler(NotificationGenerator generator, NotificationService service) {
        this.generator = generator;
        this.service = service;
    }

    /** 매일 09:00 KST — 일별 알림(+월요일 주간) 생성 후 30일 cleanup. */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void runDailyCron() {
        generator.runDaily(LocalDate.now(KST));
        service.cleanup(Instant.now());
    }
}
