package com.twochi.notification;

import com.twochi.application.domain.EventType;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.application.repository.EventRepository.ScheduleRow;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.posting.repository.JobPostingRepository;
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
class NotificationGeneratorScheduleTest {

    @Mock JobPostingRepository jobPostingRepository;
    @Mock EventRepository eventRepository;
    @Mock CoverLetterVariantRepository variantRepository;
    @Mock ProfileRepository profileRepository;
    @Mock ApplicationRepository applicationRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    private ScheduleRow row(Long eventId, EventType type, Long userId, String company) {
        return new ScheduleRow() {
            public Long getEventId() { return eventId; }
            public EventType getType() { return type; }
            public Long getUserId() { return userId; }
            public String getCompany() { return company; }
        };
    }

    @Test
    void 내일_면접일정_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(eventRepository.findScheduleEventsByDate(today.plusDays(1)))
            .thenReturn(List.of(row(7L, EventType.FIRST_INTERVIEW, 1L, "테크컴퍼니")));
        when(settingResolver.isEnabled(1L, NotificationType.SCHEDULE_D1)).thenReturn(true);

        generator.generateScheduleD1(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.SCHEDULE_D1),
            eq("테크컴퍼니 1차 면접 일정이 내일이에요"), eq("SCH_D1:7"));
    }

    @Test
    void 설정OFF_면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(eventRepository.findScheduleEventsByDate(today.plusDays(1)))
            .thenReturn(List.of(row(7L, EventType.FIRST_INTERVIEW, 1L, "테크컴퍼니")));
        when(settingResolver.isEnabled(1L, NotificationType.SCHEDULE_D1)).thenReturn(false);

        generator.generateScheduleD1(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
