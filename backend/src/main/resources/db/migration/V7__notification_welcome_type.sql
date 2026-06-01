-- notification.type CHECK 에 WELCOME 추가 (PR B3 가입 축하 event-triggered 알림)
ALTER TABLE notification DROP CONSTRAINT ck_notification_type;
ALTER TABLE notification ADD CONSTRAINT ck_notification_type
    CHECK (type IN (
        'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
        'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
        'EMAIL_VERIFY', 'PASSWORD_RESET', 'WELCOME'
    ));
