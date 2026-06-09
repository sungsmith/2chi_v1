-- V9__activity_log.sql — 통합 활동 로그 (5.8 작성 이력)
CREATE TABLE activity_log (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    type        VARCHAR(40)  NOT NULL,
    icon        VARCHAR(20)  NOT NULL,
    tone        VARCHAR(10),
    actor       VARCHAR(60)  NOT NULL,
    subject     VARCHAR(200),
    from_label  VARCHAR(40),
    to_label    VARCHAR(40),
    suffix      VARCHAR(300) NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_activity_type CHECK (type IN (
        'APPLICATION_CREATED', 'STAGE_CHANGED', 'COVER_LETTER_SAVED',
        'AI_DRAFT_GENERATED', 'NOTIFICATION'
    ))
);

CREATE INDEX idx_activity_user_time ON activity_log (user_id, occurred_at DESC);
