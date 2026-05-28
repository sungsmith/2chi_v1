DROP INDEX IF EXISTS uq_notification_user_dedup;
ALTER TABLE notification DROP COLUMN IF EXISTS dedup_key;
