package com.twochi.notification;

import com.twochi.application.repository.EventRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository.UnsubmittedRow;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.posting.repository.JobPostingRepository;
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
class NotificationGeneratorCoverLetterTest {

    @Mock JobPostingRepository jobPostingRepository;
    @Mock EventRepository eventRepository;
    @Mock CoverLetterVariantRepository variantRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    private UnsubmittedRow row(Long id, Long userId, String company) {
        return new UnsubmittedRow() {
            public Long getVariantId() { return id; }
            public Long getUserId() { return userId; }
            public String getCompany() { return company; }
        };
    }

    @Test
    void 마감전_방치_DRAFT_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(variantRepository.findUnsubmittedBefore(eq(today), any()))
            .thenReturn(List.of(row(15L, 1L, "네이버")));
        when(settingResolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).thenReturn(true);

        generator.generateCoverLetterUnsubmitted(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.COVER_LETTER_UNSUBMITTED_7D),
            eq("네이버 자소서가 아직 작성 중이에요. 마감 전에 마무리해볼까요?"), eq("CL7:15"));
    }

    @Test
    void 설정OFF_면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(variantRepository.findUnsubmittedBefore(eq(today), any()))
            .thenReturn(List.of(row(15L, 1L, "네이버")));
        when(settingResolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).thenReturn(false);

        generator.generateCoverLetterUnsubmitted(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
