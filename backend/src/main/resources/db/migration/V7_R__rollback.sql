-- V7 rollback (manual). Flyway 자동 실행 안 함. 사용 시: Flyway repair 후 이 스크립트 직접 실행.
ALTER TABLE notification DROP CONSTRAINT IF EXISTS ck_notification_type;
ALTER TABLE notification ADD CONSTRAINT ck_notification_type
    CHECK (type IN (
        'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
        'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
        'EMAIL_VERIFY', 'PASSWORD_RESET'
    ));
