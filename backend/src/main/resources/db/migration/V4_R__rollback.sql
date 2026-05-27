-- V4 rollback (manual). 사용 시: Flyway repair 후 이 스크립트 직접 실행
DROP TABLE IF EXISTS user_noti_setting;
ALTER TABLE app_user DROP COLUMN IF EXISTS password_changed_at;
