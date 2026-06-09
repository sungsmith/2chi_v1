-- V10_R__rollback.sql (수동 실행 전용 — Flyway 자동 실행 안 함)
-- V10 을 되돌려 V1 의 원래 portfolio_link(리치 스키마)를 복원한다.
DROP TABLE IF EXISTS portfolio_link CASCADE;

CREATE TABLE portfolio_link (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title           VARCHAR(200)    NOT NULL,
    description     VARCHAR(500),
    link_type       VARCHAR(30)     NOT NULL,
    url             VARCHAR(1000),
    file_url        VARCHAR(500),
    tags            TEXT[]          NOT NULL DEFAULT '{}',
    contribution    TEXT,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_portfolio_link_type
        CHECK (link_type IN ('GITHUB', 'NOTION', 'BEHANCE', 'DRIBBBLE', 'FIGMA', 'PDF', 'OTHER')),
    CONSTRAINT ck_portfolio_at_least_one_link
        CHECK (url IS NOT NULL OR file_url IS NOT NULL)
);
CREATE INDEX idx_portfolio_user ON portfolio_link (user_id, order_index);
CREATE TRIGGER trg_portfolio_updated_at BEFORE UPDATE ON portfolio_link FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
