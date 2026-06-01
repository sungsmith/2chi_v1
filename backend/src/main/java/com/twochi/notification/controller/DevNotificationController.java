package com.twochi.notification.controller;

import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** cron 로직 수동 트리거(개발·QA). prod 에선 빈 등록 안 됨. */
@RestController
@RequestMapping("/api/v1/dev/notifications")
@Profile("!prod")
public class DevNotificationController {

    private final NotificationGenerator generator;
    private final NotificationService service;

    public DevNotificationController(NotificationGenerator generator, NotificationService service) {
        this.generator = generator;
        this.service = service;
    }

    @PostMapping("/run-cron")
    public ResponseEntity<Void> runCron(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now(ZoneId.of("Asia/Seoul"));
        generator.runDaily(target);
        service.cleanup(Instant.now());
        return ResponseEntity.ok().build();
    }
}
