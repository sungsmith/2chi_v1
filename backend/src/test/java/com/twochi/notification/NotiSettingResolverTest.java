package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotiSettingResolverTest {

    @Mock UserNotiSettingRepository repository;
    @InjectMocks NotiSettingResolver resolver;

    @Test
    void row_없으면_defaultOn_따름() {
        when(repository.findByUserIdAndSettingId(1L, "deadline-d1")).thenReturn(Optional.empty());
        when(repository.findByUserIdAndSettingId(1L, "cl-unsubmitted")).thenReturn(Optional.empty());

        assertThat(resolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1)).isTrue();   // deadline-d1 defaultOn=true
        assertThat(resolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).isFalse(); // cl-unsubmitted defaultOn=false
    }

    @Test
    void row_있으면_저장된_enabled_사용() {
        when(repository.findByUserIdAndSettingId(1L, "cl-unsubmitted"))
            .thenReturn(Optional.of(UserNotiSetting.of(1L, "cl-unsubmitted", true, Instant.now())));

        assertThat(resolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).isTrue();
    }
}
