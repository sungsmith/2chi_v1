-- 1. legacy notification_preference 제거 (V4 user_noti_setting 이 대체)
DROP TABLE IF EXISTS notification_preference CASCADE;

-- 2. notification.channel CHECK 에 INBOX 추가 — in-app inbox 전용
ALTER TABLE notification DROP CONSTRAINT ck_notification_channel;
ALTER TABLE notification ADD CONSTRAINT ck_notification_channel
    CHECK (channel IN ('EMAIL', 'WEB_PUSH', 'INBOX'));

COMMENT ON TABLE notification IS '알림. INBOX: in-app inbox (PR B1+). EMAIL/WEB_PUSH: 발송 워커 채널 (v2)';
