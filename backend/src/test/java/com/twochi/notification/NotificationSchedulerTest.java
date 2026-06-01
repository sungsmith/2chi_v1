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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock NotificationGenerator generator;
    @Mock NotificationService service;
    @InjectMocks NotificationScheduler scheduler;

    @Test
    void runDailyCron_은_runDaily_와_cleanup_을_호출() {
        scheduler.runDailyCron();

        verify(generator).runDaily(any(LocalDate.class));
        verify(service).cleanup(any(Instant.class));
    }
}
