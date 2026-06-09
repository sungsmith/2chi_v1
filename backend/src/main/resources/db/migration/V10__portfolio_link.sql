-- V10__portfolio_link.sql — 내 정보 포트폴리오 외부 링크
-- V1 이 portfolio_link 를 리치 스키마(link_type/file_url/tags/contribution)로 선‑정의해 두었으나
-- v1 설계에서 폐기(외부 링크 모음으로 단순화). 미사용·빈 테이블이므로 안전하게 교체한다.
DROP TABLE IF EXISTS portfolio_link CASCADE;
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
