package com.twochi.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

/** cron 은 운영(prod)에서만 자동 실행. local/dev/test 는 DevNotificationController 로 수동 트리거(Task 9). */
@Configuration
@Profile("prod")
@EnableScheduling
public class SchedulingConfig {
}
