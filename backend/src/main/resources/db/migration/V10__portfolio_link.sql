-- V10__portfolio_link.sql — 내 정보 포트폴리오 외부 링크
CREATE TABLE portfolio_link (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    kind        VARCHAR(20)  NOT NULL,
    title       VARCHAR(100) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    order_index INT          NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_portfolio_kind CHECK (kind IN ('GITHUB','BLOG','NOTION','OTHER'))
);
CREATE INDEX idx_portfolio_user ON portfolio_link (user_id, order_index);
