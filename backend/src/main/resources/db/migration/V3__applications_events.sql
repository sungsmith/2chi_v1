-- 5.8 지원 현황: Application + Event 도메인.
-- V1 schema 가 이미 application + application_history 테이블을 사전 정의해두었으나
-- (DOCUMENT/INTERVIEW_1/...; dates_json JSONB), brainstorming 단계에서
-- Application + Event 1:N 모델 + 새 stage naming 으로 결정했으므로 V1 의
-- 두 테이블을 제거하고 새 schema 로 교체한다.
-- FK 참조: app_user, job_posting (V1 의 실제 테이블명, singular).

DROP TABLE IF EXISTS application_history;
DROP TABLE IF EXISTS application;

CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    posting_id      BIGINT       NOT NULL REFERENCES job_posting(id) ON DELETE CASCADE,
    company         VARCHAR(120) NOT NULL,
    role            VARCHAR(120) NOT NULL,
    current_stage   VARCHAR(30)  NOT NULL,
    current_result  VARCHAR(20)  NOT NULL,
    memo            TEXT,
    created_at      TIMESTAMP    NOT NULL,
    updated_at      TIMESTAMP    NOT NULL
);

CREATE UNIQUE INDEX uq_application_user_posting
    ON applications (user_id, posting_id);

CREATE INDEX ix_application_user_updated
    ON applications (user_id, updated_at DESC);

CREATE TABLE events (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL,
    event_date      DATE        NOT NULL,
    event_time      TIME,
    memo            TEXT,
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL
);

CREATE INDEX ix_event_application ON events (application_id);
CREATE INDEX ix_event_date ON events (event_date);
