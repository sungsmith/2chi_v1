-- 1. app_user.password_changed_at 추가 (NULLABLE) + 기존 사용자 backfill
ALTER TABLE app_user ADD COLUMN password_changed_at TIMESTAMPTZ;
COMMENT ON COLUMN app_user.password_changed_at IS
    '마지막 비밀번호 변경 시각. NULL 이면 가입 후 한 번도 변경 안 함 (가입 시각이 기준)';
UPDATE app_user SET password_changed_at = created_at WHERE password_changed_at IS NULL;

-- 2. user_noti_setting (sparse override 테이블)
CREATE TABLE user_noti_setting (
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    setting_id  VARCHAR(40)  NOT NULL,
    enabled     BOOLEAN      NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, setting_id)
);
COMMENT ON TABLE  user_noti_setting IS '알림 설정 per-user override. default 와 다른 항목만 row 로 저장(sparse)';
COMMENT ON COLUMN user_noti_setting.setting_id IS 'NotiSettingDef enum 의 키 (deadline-d3 등)';
