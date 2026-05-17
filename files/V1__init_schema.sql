-- ============================================================================
-- 2chi v1 초기 스키마 (Flyway V1__init_schema.sql)
-- ----------------------------------------------------------------------------
-- 작성일       : 2026-05-08
-- 대상 DB      : PostgreSQL 15+
-- 작성자       : 김소미
-- 참조 문서    : 2chi v1 ERD v0.1
-- ----------------------------------------------------------------------------
-- 적용 방법    : Spring Boot의 Flyway 자동 마이그레이션으로 적용
--                또는 psql -U postgres -d twochi -f V1__init_schema.sql
-- 후속 마이그레이션:
--    V2__{snake_case_설명}.sql 로 단일 변경 단위로 분리하여 추가
--    한 번 적용된 파일은 절대 수정하지 않는다 (Flyway checksum 보호)
-- ============================================================================

-- ============================================================================
-- 0. 공통 함수 / 트리거
-- ============================================================================

-- updated_at 컬럼 자동 갱신 함수
-- JPA의 @PreUpdate / @LastModifiedDate가 적용되어도 안전망으로 트리거 보유
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. 사용자 & 인증
-- ============================================================================

-- 1-1. 사용자 (app_user — "user"는 PostgreSQL 예약어이므로 app_user 사용)
CREATE TABLE app_user (
    id                  BIGSERIAL       PRIMARY KEY,
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(60),
    nickname            VARCHAR(20)     NOT NULL,
    role                VARCHAR(20)     NOT NULL DEFAULT 'USER',
    email_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    failed_login_count  INTEGER         NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT ck_user_role CHECK (role IN ('USER', 'ADMIN'))
);
COMMENT ON TABLE  app_user                   IS '사용자 계정 (이메일+비밀번호 또는 소셜). soft delete 적용 (30일 유예)';
COMMENT ON COLUMN app_user.password_hash     IS 'bcrypt 해시 (cost 12+). 소셜 전용 가입자는 NULL';
COMMENT ON COLUMN app_user.deleted_at        IS '탈퇴 시각. NULL이면 alive 사용자. 30일 경과 시 배치 영구 삭제';
COMMENT ON COLUMN app_user.failed_login_count IS '연속 실패 횟수. 5회 도달 시 locked_until = NOW + 10분';

CREATE UNIQUE INDEX uq_user_email_alive    ON app_user (email)    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_nickname_alive ON app_user (nickname) WHERE deleted_at IS NULL;
CREATE        INDEX idx_user_deleted_at    ON app_user (deleted_at);

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 1-2. 소셜 계정 연결
CREATE TABLE social_account (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider            VARCHAR(20)     NOT NULL,
    provider_user_id    VARCHAR(255)    NOT NULL,
    email               VARCHAR(255),
    linked_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_social_provider CHECK (provider IN ('kakao', 'naver', 'google')),
    CONSTRAINT uq_social_provider_pid UNIQUE (provider, provider_user_id)
);
COMMENT ON TABLE  social_account IS '소셜 계정 연결 (카카오/네이버/구글). 한 User에 다중 연결 가능';
CREATE INDEX idx_social_user_id ON social_account (user_id);


-- 1-3. 동의 로그 (약관·개인정보·마케팅)
CREATE TABLE consent_log (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    consent_type    VARCHAR(50)     NOT NULL,
    agreed          BOOLEAN         NOT NULL,
    version         VARCHAR(20)     NOT NULL,
    ip              VARCHAR(45),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_consent_type CHECK (consent_type IN ('TERMS', 'PRIVACY', 'MARKETING', 'AI_DATA_USAGE'))
);
COMMENT ON TABLE  consent_log IS '동의/철회 이력 영구 보관 (법적 분쟁 대비). 최신 동의 상태는 (user_id, consent_type)별 최근 행으로 판정';
CREATE INDEX idx_consent_user_type ON consent_log (user_id, consent_type, created_at DESC);


-- 1-4. 감사 로그
CREATE TABLE audit_log (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT                  REFERENCES app_user(id) ON DELETE SET NULL,
    action          VARCHAR(50)     NOT NULL,
    target_type     VARCHAR(50),
    target_id       VARCHAR(100),
    ip              VARCHAR(45),
    user_agent      VARCHAR(500),
    metadata        JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  audit_log IS '보안·운영 액션 감사 로그 (로그인·비밀번호 변경·관리자 액션 등). 보관 90일';
COMMENT ON COLUMN audit_log.metadata IS '추가 컨텍스트. PII 마스킹 후 저장 필수';
CREATE INDEX idx_audit_user_created   ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_action_created ON audit_log (action,  created_at DESC);


-- ============================================================================
-- 2. 프로필 & 기본 정보
-- ============================================================================

-- 2-1. 프로필 (User와 1:1)
CREATE TABLE profile (
    user_id                 BIGINT          PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    target                  VARCHAR(20)     NOT NULL,
    career_year             SMALLINT        NOT NULL DEFAULT 0,
    target_jobs             TEXT[]          NOT NULL DEFAULT '{}',
    onboarding_completed    BOOLEAN         NOT NULL DEFAULT FALSE,
    name                    VARCHAR(50),
    birth_date              DATE,
    gender                  VARCHAR(10),
    phone                   VARCHAR(20),
    region                  VARCHAR(50),
    introduction            TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_profile_target CHECK (target IN ('JOB_CHANGE', 'EMPLOYMENT')),
    CONSTRAINT ck_profile_gender CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'NONE')),
    CONSTRAINT ck_profile_career_year CHECK (career_year >= 0)
);
COMMENT ON TABLE  profile             IS 'User와 1:1. 온보딩 선택값과 기초 정보. 이름·전화는 AES-256 컬럼 암호화';
COMMENT ON COLUMN profile.target_jobs IS '희망 직군 배열: BACKEND / FRONTEND / INFRA_CLOUD / INFRA_OPS / UI_UX';
COMMENT ON COLUMN profile.name        IS '암호화 컬럼. 애플리케이션 레이어 AES-256';
COMMENT ON COLUMN profile.phone       IS '암호화 컬럼. 애플리케이션 레이어 AES-256';

CREATE TRIGGER trg_profile_updated_at
    BEFORE UPDATE ON profile
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 2-2. 학력
CREATE TABLE education (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    level           VARCHAR(20)     NOT NULL,
    school          VARCHAR(100)    NOT NULL,
    major           VARCHAR(100),
    start_date      DATE,
    end_date        DATE,
    gpa             NUMERIC(3,2),
    gpa_max         NUMERIC(3,2),
    status          VARCHAR(20)     NOT NULL,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_education_level  CHECK (level  IN ('HIGH_SCHOOL', 'UNIVERSITY', 'GRADUATE')),
    CONSTRAINT ck_education_status CHECK (status IN ('GRADUATED', 'ATTENDING', 'LEAVE', 'DROP'))
);
COMMENT ON TABLE  education         IS '학력. 사용자별 다중 입력 가능';
COMMENT ON COLUMN education.gpa_max IS '만점 기준 (4.5 / 4.3 / 100)';
CREATE INDEX idx_education_user ON education (user_id, order_index);
CREATE TRIGGER trg_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 2-3. 자격증
CREATE TABLE certificate (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(100)    NOT NULL,
    issuer          VARCHAR(100),
    acquired_at     DATE,
    score           VARCHAR(50),
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  certificate IS '자격증';
CREATE INDEX idx_certificate_user ON certificate (user_id, order_index);
CREATE TRIGGER trg_certificate_updated_at BEFORE UPDATE ON certificate FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 2-4. 경험 / 대외활동
CREATE TABLE experience (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    type            VARCHAR(30)     NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    organization    VARCHAR(200),
    start_date      DATE,
    end_date        DATE,
    role            VARCHAR(200),
    summary         TEXT,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_experience_type CHECK (type IN ('INTERN', 'CLUB', 'CONTEST', 'VOLUNTEER', 'SIDE_PROJECT', 'OTHER'))
);
COMMENT ON TABLE experience IS '경험·대외활동 (인턴/동아리/공모전/봉사/사이드 프로젝트). 경력은 별도 career_history에';
CREATE INDEX idx_experience_user ON experience (user_id, order_index);
CREATE TRIGGER trg_experience_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================================
-- 3. 이력서 · 경력 · 프로젝트
-- ============================================================================

-- 3-1. 이력서 (User와 1:1)
CREATE TABLE resume (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    mode            VARCHAR(20)     NOT NULL,
    content_json    JSONB,
    file_url        VARCHAR(500),
    file_name       VARCHAR(255),
    file_size       INTEGER,
    parsed_json     JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_resume_mode CHECK (mode IN ('FORM', 'FILE'))
);
COMMENT ON TABLE  resume              IS '이력서. user_id UNIQUE로 1:1 보장. v1은 단일 최신본만 저장';
COMMENT ON COLUMN resume.content_json IS '폼 작성 데이터. 애플리케이션 레이어 AES-256 암호화';
COMMENT ON COLUMN resume.parsed_json  IS 'FILE 모드의 파싱 결과 (사용자 확인 후 저장)';
CREATE TRIGGER trg_resume_updated_at BEFORE UPDATE ON resume FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 3-2. 경력 (회사 단위)
CREATE TABLE career_history (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    company         VARCHAR(200)    NOT NULL,
    position        VARCHAR(100),
    start_date      DATE            NOT NULL,
    end_date        DATE,
    is_current      BOOLEAN         NOT NULL DEFAULT FALSE,
    summary         TEXT,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE career_history IS '경력. 회사 단위로 한 행. 회사 내 프로젝트는 project 테이블';
CREATE INDEX idx_career_user ON career_history (user_id, order_index);
CREATE TRIGGER trg_career_updated_at BEFORE UPDATE ON career_history FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 3-3. 프로젝트 (경력 내 또는 사이드)
CREATE TABLE project (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    career_history_id   BIGINT                  REFERENCES career_history(id) ON DELETE CASCADE,
    title               VARCHAR(200)    NOT NULL,
    period_start        DATE,
    period_end          DATE,
    role                VARCHAR(200),
    tech_stack          TEXT[]          NOT NULL DEFAULT '{}',
    structure_type      VARCHAR(30)     NOT NULL,
    structure_data      JSONB           NOT NULL DEFAULT '{}'::jsonb,
    metrics             JSONB,
    order_index         INTEGER         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_project_structure_type
        CHECK (structure_type IN ('PRAR', 'UX_DRIVEN', 'OPS_RESULT', 'DESIGN_THINKING'))
);
COMMENT ON TABLE  project                 IS '프로젝트. 직군별 권장 구조(5.6.0)에 따른 4단 필드를 JSONB로 저장';
COMMENT ON COLUMN project.career_history_id IS 'NULL이면 사이드 프로젝트 (회사 무관)';
COMMENT ON COLUMN project.structure_data  IS '구조별 4단 필드: PRAR={problem,root_cause,approach,result} 등';
COMMENT ON COLUMN project.metrics         IS '정량 성과: {"tps":"500->2000","cost_saved_krw":2000000} 등';

CREATE INDEX idx_project_user   ON project (user_id, order_index);
CREATE INDEX idx_project_career ON project (career_history_id);
CREATE INDEX idx_project_tech   ON project USING GIN (tech_stack);
CREATE TRIGGER trg_project_updated_at BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================================
-- 4. 포트폴리오
-- ============================================================================

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
COMMENT ON TABLE portfolio_link IS 'v1 외부 링크 모음. PDF 직접 업로드 시 file_url 사용';
CREATE INDEX idx_portfolio_user ON portfolio_link (user_id, order_index);
CREATE TRIGGER trg_portfolio_updated_at BEFORE UPDATE ON portfolio_link FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================================
-- 5. 채용공고 & 기업분석
-- ============================================================================

-- 5-1. 채용공고
CREATE TABLE job_posting (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    source          VARCHAR(20)     NOT NULL,
    company         VARCHAR(200)    NOT NULL,
    title           VARCHAR(300)    NOT NULL,
    job_role        VARCHAR(100),
    requirements    TEXT,
    preferred       TEXT,
    main_tasks      TEXT,
    deadline        DATE,
    source_url      VARCHAR(1000),
    keywords        TEXT[]          NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_posting_source CHECK (source IN ('URL', 'MANUAL', 'SARAMIN'))  -- SARAMIN은 v2 진입 시 활성화
);
COMMENT ON TABLE  job_posting          IS '채용공고. v1은 URL 입력 + 직접 작성. 사람인 OpenAPI 검색은 v2';
COMMENT ON COLUMN job_posting.keywords IS 'JD 핵심 키워드 (LLM 추출). JD 매칭에 사용';
CREATE INDEX idx_posting_user_deadline ON job_posting (user_id, deadline);
CREATE INDEX idx_posting_keywords      ON job_posting USING GIN (keywords);
CREATE TRIGGER trg_posting_updated_at BEFORE UPDATE ON job_posting FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 5-2. 기업분석
CREATE TABLE company_analysis (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    company         VARCHAR(200)    NOT NULL,
    summary_json    JSONB           NOT NULL,
    news_keywords   TEXT[]          NOT NULL DEFAULT '{}',
    dart_corp_code  VARCHAR(20),
    source_urls     TEXT[]          NOT NULL DEFAULT '{}',
    generated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    generated_by    VARCHAR(50)     NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  company_analysis              IS 'DART + 뉴스 + 회사 홈페이지 기반 기업분석. 30일 캐시';
COMMENT ON COLUMN company_analysis.summary_json IS '{overview, recent_news[], talent_profile, hiring_process[], action_points[]}';
COMMENT ON COLUMN company_analysis.generated_by IS 'LLM 모델명 (예: gpt-4o-mini-2024-07-18)';
CREATE INDEX idx_analysis_user_company    ON company_analysis (user_id, company);
CREATE INDEX idx_analysis_generated_at    ON company_analysis (generated_at DESC);


-- ============================================================================
-- 6. 자소서 & 경력기술서
-- ============================================================================

-- 6-1. 마스터 자소서
CREATE TABLE cover_letter_master (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    item_type           VARCHAR(50)     NOT NULL,
    title               VARCHAR(200),
    master_answer       TEXT            NOT NULL,
    char_limit_hint     INTEGER,
    is_default          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_cover_master_item_type
        CHECK (item_type IN (
            'MOTIVATION', 'FUTURE_PLAN', 'TEAMWORK', 'CONFLICT',
            'ACHIEVEMENT', 'PROBLEM_SOLVING', 'STRENGTH', 'WEAKNESS', 'OTHER'
        ))
);
COMMENT ON TABLE  cover_letter_master              IS '마스터 자소서. 항목 유형별 사용자 마스터 답변. 회사 지원 시 AI 변형의 베이스';
COMMENT ON COLUMN cover_letter_master.master_answer IS '암호화 컬럼. 애플리케이션 레이어 AES-256';

CREATE INDEX idx_master_user_type ON cover_letter_master (user_id, item_type);
-- 같은 (user_id, item_type)에는 is_default=TRUE 마스터가 최대 1개
CREATE UNIQUE INDEX uq_master_default
    ON cover_letter_master (user_id, item_type)
    WHERE is_default = TRUE;

CREATE TRIGGER trg_cover_master_updated_at BEFORE UPDATE ON cover_letter_master FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 6-2. 회사별 자소서 변형본
CREATE TABLE cover_letter_variant (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    posting_id          BIGINT                  REFERENCES job_posting(id)        ON DELETE SET NULL,
    analysis_id         BIGINT                  REFERENCES company_analysis(id)   ON DELETE SET NULL,
    master_id           BIGINT                  REFERENCES cover_letter_master(id) ON DELETE SET NULL,
    item_type           VARCHAR(50)     NOT NULL,
    question            VARCHAR(500)    NOT NULL,
    char_limit          INTEGER         NOT NULL,
    ai_draft            TEXT,
    user_edit           TEXT,
    user_request        TEXT,
    validation_json     JSONB,
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    ai_model            VARCHAR(50),
    ai_tokens_used      INTEGER,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_variant_item_type
        CHECK (item_type IN (
            'MOTIVATION', 'FUTURE_PLAN', 'TEAMWORK', 'CONFLICT',
            'ACHIEVEMENT', 'PROBLEM_SOLVING', 'STRENGTH', 'WEAKNESS', 'OTHER'
        )),
    CONSTRAINT ck_variant_status CHECK (status IN ('DRAFT', 'COMPLETED')),
    CONSTRAINT ck_variant_char_limit CHECK (char_limit > 0)
);
COMMENT ON TABLE  cover_letter_variant                  IS '회사별 자소서 변형본. AI 초안과 사용자 수정본을 별도 컬럼으로 보존';
COMMENT ON COLUMN cover_letter_variant.ai_draft         IS '암호화 컬럼. AI 초안 (참조용 보존)';
COMMENT ON COLUMN cover_letter_variant.user_edit        IS '암호화 컬럼. 사용자 수정본 (최종본)';
COMMENT ON COLUMN cover_letter_variant.validation_json  IS '자동 검증 결과 {char_count_ok, keyword_match, hallucination_flags}';
COMMENT ON COLUMN cover_letter_variant.deleted_at       IS '휴지통. 30일 경과 시 영구 삭제';

CREATE INDEX idx_variant_user      ON cover_letter_variant (user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_variant_posting   ON cover_letter_variant (posting_id)                WHERE deleted_at IS NULL;
CREATE INDEX idx_variant_deleted   ON cover_letter_variant (deleted_at)                WHERE deleted_at IS NOT NULL;

CREATE TRIGGER trg_variant_updated_at BEFORE UPDATE ON cover_letter_variant FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 6-3. 경력기술서
CREATE TABLE career_statement (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    posting_id      BIGINT                  REFERENCES job_posting(id)      ON DELETE SET NULL,
    analysis_id     BIGINT                  REFERENCES company_analysis(id) ON DELETE SET NULL,
    content_json    JSONB           NOT NULL,
    user_edit       TEXT,
    file_url        VARCHAR(500),
    ai_model        VARCHAR(50),
    ai_tokens_used  INTEGER,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  career_statement              IS '경력기술서. 사용자 경력을 공고·기업분석 기준으로 재구조화한 결과물';
COMMENT ON COLUMN career_statement.content_json IS '암호화 컬럼. 재구조화된 경력 데이터';
COMMENT ON COLUMN career_statement.user_edit    IS '암호화 컬럼. 사용자 수정본';

CREATE INDEX idx_statement_user    ON career_statement (user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_statement_posting ON career_statement (posting_id)               WHERE deleted_at IS NULL;
CREATE TRIGGER trg_statement_updated_at BEFORE UPDATE ON career_statement FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================================
-- 7. 지원 관리
-- ============================================================================

-- 7-1. 지원
CREATE TABLE application (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    posting_id      BIGINT                  REFERENCES job_posting(id) ON DELETE SET NULL,
    company         VARCHAR(200)    NOT NULL,
    stage           VARCHAR(30)     NOT NULL,
    result          VARCHAR(20)     NOT NULL DEFAULT 'SCHEDULED',
    dates_json      JSONB           NOT NULL DEFAULT '{}'::jsonb,
    location        VARCHAR(200),
    mode            VARCHAR(20),
    memo            TEXT,
    color           VARCHAR(7),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_application_stage
        CHECK (stage IN (
            'DOCUMENT', 'CODING_TEST', 'INTERVIEW_1', 'INTERVIEW_2',
            'EXEC_INTERVIEW', 'NEGOTIATION', 'PASSED', 'FAILED', 'OTHER'
        )),
    CONSTRAINT ck_application_result
        CHECK (result IN ('SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'WAITING')),
    CONSTRAINT ck_application_mode
        CHECK (mode IS NULL OR mode IN ('ONLINE', 'OFFLINE', 'HYBRID')),
    CONSTRAINT ck_application_color
        CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);
COMMENT ON TABLE  application IS '지원 1건. 캘린더·대시보드·히스토리 핵심';
COMMENT ON COLUMN application.dates_json IS '전형별 일자: {"INTERVIEW_1":{"date":"2026-06-10T10:00:00+09:00"}}';
COMMENT ON COLUMN application.color      IS '캘린더 표시 hex 색상 (#RRGGBB)';

CREATE INDEX idx_application_user_updated ON application (user_id, updated_at DESC);
CREATE INDEX idx_application_user_stage   ON application (user_id, stage);
CREATE INDEX idx_application_posting      ON application (posting_id);
CREATE TRIGGER trg_application_updated_at BEFORE UPDATE ON application FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 7-2. 지원 변경 이력
CREATE TABLE application_history (
    id              BIGSERIAL       PRIMARY KEY,
    application_id  BIGINT          NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id)    ON DELETE CASCADE,
    field_name      VARCHAR(50)     NOT NULL,
    before_value    JSONB,
    after_value     JSONB           NOT NULL,
    actor           VARCHAR(20)     NOT NULL,
    changed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_app_history_actor CHECK (actor IN ('USER', 'SYSTEM'))
);
COMMENT ON TABLE application_history IS '지원의 모든 변경 로그. 365일 보관. 시간 역순 표출';
CREATE INDEX idx_history_user_changed ON application_history (user_id,        changed_at DESC);
CREATE INDEX idx_history_app          ON application_history (application_id, changed_at DESC);


-- ============================================================================
-- 8. 알림 & 사용자 설정
-- ============================================================================

-- 8-1. 알림 (발송 로그)
CREATE TABLE notification (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    channel         VARCHAR(20)     NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    body            TEXT,
    payload_json    JSONB,
    scheduled_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    error           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_notification_channel CHECK (channel IN ('EMAIL', 'WEB_PUSH')),
    CONSTRAINT ck_notification_type
        CHECK (type IN (
            'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
            'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
            'EMAIL_VERIFY', 'PASSWORD_RESET'
        ))
);
COMMENT ON TABLE notification IS '알림 발송 로그. 90일 보관. 발송 워커는 idx_notif_pending로 폴링';
CREATE INDEX idx_notif_user_created ON notification (user_id, created_at DESC);
CREATE INDEX idx_notif_pending      ON notification (scheduled_at) WHERE sent_at IS NULL;


-- 8-2. 알림 설정 (User와 1:1)
CREATE TABLE notification_preference (
    user_id         BIGINT          PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    email_enabled   BOOLEAN         NOT NULL DEFAULT TRUE,
    push_enabled    BOOLEAN         NOT NULL DEFAULT FALSE,
    prefs_json      JSONB           NOT NULL DEFAULT '{}'::jsonb,
    push_endpoint   VARCHAR(1000),
    push_p256dh     VARCHAR(255),
    push_auth       VARCHAR(255),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  notification_preference IS '알림 설정. 보안 알림(EMAIL_VERIFY, PASSWORD_RESET)은 prefs와 무관하게 강제 발송';
COMMENT ON COLUMN notification_preference.prefs_json
    IS '카테고리별: {"POSTING_DEADLINE":{"email":true,"push":true}, "SCHEDULE":{"email":true,"push":true}, ...}';
CREATE TRIGGER trg_notif_pref_updated_at BEFORE UPDATE ON notification_preference FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================================
-- 마이그레이션 종료
-- ============================================================================
-- 적용 후 Flyway 자동으로 flyway_schema_history에 V1 적용 기록을 남긴다.
-- 후속 변경은 V2__{snake_case}.sql 부터 추가. 본 파일은 한 번 적용된 뒤 절대 수정 금지.
