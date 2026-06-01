package com.twochi.notification.domain;

/**
 * V1 notification.type CHECK 와 매핑. PR B1 은 read-only — PR B2/B3 가 새 type 추가 시 CHECK migration 같이.
 * NotiSettingDef (V4) 와 의미 매칭:
 * - POSTING_DEADLINE_D3, D1 → deadline-d3, deadline-d1
 * - SCHEDULE_D1 → interview-d1
 * - COVER_LETTER_UNSUBMITTED_7D → cl-unsubmitted
 * - WEEKLY_SUMMARY → weekly-summary
 * - EMAIL_VERIFY → signup-verify (locked)
 * - PASSWORD_RESET → pw-reset (locked)
 */
public enum NotificationType {
    POSTING_DEADLINE_D3,
    POSTING_DEADLINE_D1,
    SCHEDULE_D1,
    COVER_LETTER_UNSUBMITTED_7D,
    WEEKLY_SUMMARY,
    EMAIL_VERIFY,
    PASSWORD_RESET;

    /** NotiSettingDef.id 와 매핑. cron/이벤트가 사용자 설정을 조회할 때 사용. */
    public String settingId() {
        return switch (this) {
            case POSTING_DEADLINE_D3 -> "deadline-d3";
            case POSTING_DEADLINE_D1 -> "deadline-d1";
            case SCHEDULE_D1 -> "interview-d1";
            case COVER_LETTER_UNSUBMITTED_7D -> "cl-unsubmitted";
            case WEEKLY_SUMMARY -> "weekly-summary";
            case EMAIL_VERIFY -> "signup-verify";
            case PASSWORD_RESET -> "pw-reset";
        };
    }
}
