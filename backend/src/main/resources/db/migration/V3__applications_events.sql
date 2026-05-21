-- 5.8 지원 현황: Application + Event 도메인.
-- Application 은 JobPosting 1:1 UNIQUE (한 공고 = 0 또는 1 지원).
-- Event 는 Application 1:N (CASCADE).

CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id),
    posting_id      BIGINT       NOT NULL REFERENCES job_postings(id),
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
