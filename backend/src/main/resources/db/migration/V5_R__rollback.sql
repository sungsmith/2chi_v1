-- V5 rollback (manual). Flyway 자동 실행 안 함.
-- 1. INBOX 채널 row 정리 + CHECK 복원
DELETE FROM notification WHERE channel = 'INBOX';
ALTER TABLE notification DROP CONSTRAINT ck_notification_channel;
ALTER TABLE notification ADD CONSTRAINT ck_notification_channel
    CHECK (channel IN ('EMAIL', 'WEB_PUSH'));

-- 2. notification_preference 복원 (스키마만 — 데이터 복구 불가)
CREATE TABLE IF NOT EXISTS notification_preference (
    user_id         BIGINT          PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    email_enabled   BOOLEAN         NOT NULL DEFAULT TRUE,
    push_enabled    BOOLEAN         NOT NULL DEFAULT FALSE,
    prefs_json      JSONB           NOT NULL DEFAULT '{}'::jsonb,
    push_endpoint   VARCHAR(1000),
    push_p256dh     VARCHAR(255),
    push_auth       VARCHAR(255),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
