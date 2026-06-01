package com.twochi.notification;

import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.coverletter.domain.CoverLetterVariant.Status;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorWeeklyTest {

    @Mock JobPostingRepository jobPostingRepository;
    @Mock EventRepository eventRepository;
    @Mock CoverLetterVariantRepository variantRepository;
    @Mock ProfileRepository profileRepository;
    @Mock ApplicationRepository applicationRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    @Test
    void 지난주_활동있고_설정ON_이면_수치_title_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        Profile p = mock(Profile.class);
        when(p.getUserId()).thenReturn(1L);
        when(profileRepository.findByOnboardingCompletedTrue()).thenReturn(List.of(p));
        when(applicationRepository.countByUserIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(2L);
        when(variantRepository.countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
            eq(1L), eq(Status.DRAFT), any(), any())).thenReturn(3L);
        when(settingResolver.isEnabled(1L, NotificationType.WEEKLY_SUMMARY)).thenReturn(true);

        generator.generateWeeklySummary(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.WEEKLY_SUMMARY),
            eq("이번 주 지원 2건·자소서 초안 3건을 정리했어요"),
            eq("WK:1:2026-W22"));
    }

    @Test
    void 지난주_활동0건_이면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        Profile p = mock(Profile.class);
        when(p.getUserId()).thenReturn(1L);
        when(profileRepository.findByOnboardingCompletedTrue()).thenReturn(List.of(p));
        when(applicationRepository.countByUserIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(0L);
        when(variantRepository.countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
            eq(1L), eq(Status.DRAFT), any(), any())).thenReturn(0L);

        generator.generateWeeklySummary(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
