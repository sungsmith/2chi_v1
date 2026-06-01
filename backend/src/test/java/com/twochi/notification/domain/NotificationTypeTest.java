package com.twochi.notification.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NotificationTypeTest {

    @Test
    void WELCOME_은_ungated_settingId_호출시_throw() {
        assertThatThrownBy(() -> NotificationType.WELCOME.settingId())
            .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void gated_타입은_settingId_반환() {
        assertThat(NotificationType.POSTING_DEADLINE_D1.settingId()).isEqualTo("deadline-d1");
        assertThat(NotificationType.WEEKLY_SUMMARY.settingId()).isEqualTo("weekly-summary");
    }
}
