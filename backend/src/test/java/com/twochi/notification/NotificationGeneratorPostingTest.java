package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorPostingTest {

    @Mock JobPostingRepository jobPostingRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    private JobPosting postingWithId(Long id, Long userId, LocalDate deadline) {
        JobPosting p = JobPosting.create(
            userId, JobPosting.Source.MANUAL, "카카오", "백엔드",
            null, null, null, null,
            deadline, null, new String[0], Instant.now()
        );
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    @Test
    void D1_마감_공고_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(jobPostingRepository.findByDeadline(today.plusDays(1)))
            .thenReturn(List.of(postingWithId(42L, 1L, today.plusDays(1))));
        when(jobPostingRepository.findByDeadline(today.plusDays(3)))
            .thenReturn(List.of());
        when(settingResolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1))
            .thenReturn(true);

        generator.generatePostingDeadline(today);

        verify(producer).publishDeduped(
            eq(1L), eq(NotificationType.POSTING_DEADLINE_D1),
            contains("마감이 내일"), eq("PD_D1:42"));
    }

    @Test
    void 설정OFF_면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(jobPostingRepository.findByDeadline(today.plusDays(1)))
            .thenReturn(List.of(postingWithId(42L, 1L, today.plusDays(1))));
        when(jobPostingRepository.findByDeadline(today.plusDays(3)))
            .thenReturn(List.of());
        when(settingResolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1))
            .thenReturn(false);

        generator.generatePostingDeadline(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
