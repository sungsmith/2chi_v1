package com.twochi.notification;

import com.twochi.notification.scheduler.NotificationScheduler;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;

import org.mockito.InOrder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock NotificationGenerator generator;
    @Mock NotificationService service;
    @InjectMocks NotificationScheduler scheduler;

    @Test
    void runDailyCron_은_generator_runDaily_먼저_그_다음_service_cleanup_호출() {
        scheduler.runDailyCron();

        // 순서 보장: 알림 생성 → cleanup. 역순이면 같은 cron 실행 중 생성된 신규 알림이 삭제될 위험.
        InOrder order = inOrder(generator, service);
        order.verify(generator).runDaily(any(LocalDate.class));
        order.verify(service).cleanup(any(Instant.class));
    }
}
