ALTER TABLE notification ADD COLUMN dedup_key VARCHAR(120);

CREATE UNIQUE INDEX uq_notification_user_dedup
    ON notification (user_id, dedup_key)
    WHERE dedup_key IS NOT NULL;

COMMENT ON COLUMN notification.dedup_key IS
    'cron 멱등 키. type+참조ID(예 PD_D1:42). NULL=dedup 비대상(이벤트/수동/seeder). PR B2.';
