2chi v1 ERD

데이터 모델 상세 명세 v0.1

PostgreSQL 15+ 기준

작성일: 2026-05-08 / 작성자: 김소미

# 1. 개요

본 문서는 2chi v1 기능 정의서(7장 데이터 모델)에 기반한 PostgreSQL 15+ 상세 스키마 명세입니다. 17개 엔티티의 컬럼·타입·제약·인덱스를 정의하며, Spring Boot JPA 엔티티와 Flyway 마이그레이션 작성의 기준이 됩니다.

## 1.1 설계 원칙

- PK는 BIGSERIAL (Identity). UUID는 v1 단순화를 위해 미사용.
- 타임스탬프는 TIMESTAMPTZ (시간대 포함). 모든 시간은 UTC 저장 후 클라이언트에서 KST 변환.
- 논리 삭제(soft delete): User는 deleted_at NULL/NOT NULL로 관리. 30일 유예 후 배치 영구 삭제.
- 자유 형식 데이터(폼·구조별 4단 필드 등)는 JSONB로 저장하여 스키마 변경 비용 최소화.
- FK는 ON DELETE CASCADE 기본 (사용자 영구 삭제 시 연관 데이터 자동 삭제).
- 민감 데이터(이력서·자소서·연락처)는 애플리케이션 레이어에서 AES-256 컬럼 암호화.
- 스키마 마이그레이션은 Flyway. 모든 변경은 V{n}__{설명}.sql 형식.

## 1.2 명명 규칙

- 테이블: snake_case 단수형 (cover_letter_master)
- 컬럼: snake_case (created_at, user_id)
- 인덱스: idx_{테이블}_{컬럼} 또는 uq_{테이블}_{컬럼} (unique)
- FK 제약: fk_{from_table}_{to_table}_{column}
- enum 컬럼: VARCHAR로 저장 + 애플리케이션에서 enum 매핑 (PostgreSQL ENUM 타입 미사용 — 마이그레이션 비용↓)

## 1.3 사용 타입 요약

| 타입 | 용도 |
| --- | --- |
| BIGSERIAL | PK 자동 증가 |
| BIGINT | FK |
| VARCHAR(n) | 가변 길이 문자열. 한국어 1자 = 3바이트(UTF-8), 길이는 문자 수 기준 |
| TEXT | 긴 텍스트 (자소서 본문 등) |
| INTEGER | 정수 |
| NUMERIC(p,s) | GPA·금액 등 소수점 필요한 수치 |
| BOOLEAN | true/false |
| DATE | 날짜 (시간 없음) |
| TIMESTAMPTZ | 시각 (시간대 포함, UTC 저장) |
| JSONB | 스키마가 유연한 구조 데이터 |
| TEXT[] | 문자열 배열 (태그, 키워드 등) |

# 2. ERD 다이어그램

전체 엔티티 관계도. 시각화는 별도 .mermaid 파일(2chi_v1_ERD_diagram_v0.1.mermaid) 참조 — VS Code의 Mermaid 익스텐션이나 mermaid.live에 붙여넣으면 다이어그램 렌더링 가능.

## 2.1 관계 요약

- User(1) ↔ Profile(1): 1:1
- User(1) ↔ Education / Certificate / Experience / CareerHistory / PortfolioLink / SocialAccount / ConsentLog / AuditLog (N): 1:N
- User(1) ↔ Resume / NotificationPreference (1): 1:1
- CareerHistory(1) ↔ Project(N): 1:N (사이드 프로젝트는 user_id 직접 참조, career_history_id NULL)
- JobPosting(1) ↔ CoverLetterVariant / CareerStatement / Application (N): 1:N
- CompanyAnalysis(1) ↔ CoverLetterVariant / CareerStatement (N): 1:N
- CoverLetterMaster(1) ↔ CoverLetterVariant(N): 1:N
- Application(1) ↔ ApplicationHistory(N): 1:N

## 2.2 도메인 그룹

| 그룹 | 엔티티 |
| --- | --- |
| 사용자 & 인증 | User, SocialAccount, ConsentLog, AuditLog |
| 프로필 & 기본 정보 | Profile, Education, Certificate, Experience |
| 이력 / 경력 / 프로젝트 | Resume, CareerHistory, Project |
| 포트폴리오 | PortfolioLink |
| 채용공고 & 기업분석 | JobPosting, CompanyAnalysis |
| 자소서 & 경력기술서 | CoverLetterMaster, CoverLetterVariant, CareerStatement |
| 지원 관리 | Application, ApplicationHistory |
| 알림 & 사용자 설정 | Notification, NotificationPreference |

# 3. 엔티티 상세 정의

## 3.1 사용자 & 인증

### User  (사용자)

사용자 계정. 이메일+비밀번호 또는 소셜 로그인. 회원 탈퇴는 soft delete로 처리하고 30일 유예 후 영구 삭제.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | 기본키 |
| email | VARCHAR(255) | NOT NULL | 이메일. 소셜 가입자는 소셜 계정 이메일 복사 |
| password_hash | VARCHAR(60) | NULLABLE | bcrypt 해시 (cost 12+). 소셜 전용 가입자는 NULL |
| nickname | VARCHAR(20) | NOT NULL | 닉네임. 2~20자, 한/영/숫자 |
| role | VARCHAR(20) | NOT NULL DEFAULT 'USER' | USER / ADMIN |
| email_verified | BOOLEAN | NOT NULL DEFAULT FALSE | 이메일 인증 완료 여부 |
| last_login_at | TIMESTAMPTZ | NULLABLE | 마지막 로그인 시각 |
| failed_login_count | INTEGER | NOT NULL DEFAULT 0 | 연속 실패 횟수 |
| locked_until | TIMESTAMPTZ | NULLABLE | 잠금 해제 예정 시각 (5회 실패 시 +10분) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 가입 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 수정 시각 |
| deleted_at | TIMESTAMPTZ | NULLABLE | 탈퇴 시각(soft). NULL이면 정상 계정 |

#### 인덱스 / 제약

CREATE UNIQUE INDEX uq_user_email_alive ON user (email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_user_nickname_alive ON user (nickname) WHERE deleted_at IS NULL;

CREATE INDEX idx_user_deleted_at ON user (deleted_at);

#### 주요 노트

- 이메일·닉네임의 unique는 'alive 사용자만' 보장 — 탈퇴자의 이메일 재사용 허용
- user 테이블명은 PostgreSQL 예약어 충돌 가능. 실제 마이그레이션에서는 'app_user' 또는 'users' 사용 권장
- 탈퇴 30일 경과자는 일일 배치로 영구 삭제 + FK CASCADE로 연관 데이터 정리

### SocialAccount  (소셜 계정 연결)

한 User에 카카오/네이버/구글 계정을 다중 연결 가능. 동일 (provider, provider_user_id)는 단 하나의 User에만 연결.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| provider | VARCHAR(20) | NOT NULL | kakao / naver / google |
| provider_user_id | VARCHAR(255) | NOT NULL | 소셜 측 사용자 식별자 |
| email | VARCHAR(255) | NULLABLE | 소셜 측 이메일 (참고용, 변경 가능) |
| linked_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 연결 시각 |

#### 인덱스 / 제약

CREATE UNIQUE INDEX uq_social_provider_pid ON social_account (provider, provider_user_id);

CREATE INDEX idx_social_user_id ON social_account (user_id);

#### 주요 노트

- 소셜 회원가입 시 User + SocialAccount 트랜잭션 내 동시 생성
- 마이페이지에서 소셜 연결 해제 가능 (단 비밀번호 미설정 사용자는 마지막 소셜은 해제 불가)

### ConsentLog  (동의 로그)

약관·개인정보·마케팅 동의 이력. 법적 분쟁 대비 영구 보관.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| consent_type | VARCHAR(50) | NOT NULL | TERMS / PRIVACY / MARKETING / AI_DATA_USAGE |
| agreed | BOOLEAN | NOT NULL | 동의 여부 (철회도 같은 테이블에 새 행으로 기록) |
| version | VARCHAR(20) | NOT NULL | 약관 버전 (예: 'terms-v1.2') |
| ip | VARCHAR(45) | NULLABLE | 동의 시점 IP (IPv6 대응 45자) |
| user_agent | VARCHAR(500) | NULLABLE | User-Agent 헤더 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 동의/철회 시각 |

#### 인덱스 / 제약

CREATE INDEX idx_consent_user_type ON consent_log (user_id, consent_type, created_at DESC);

#### 주요 노트

- 최신 동의 상태는 (user_id, consent_type)별 가장 최근 행으로 판정
- 회원 탈퇴 시에도 ConsentLog는 법적 의무에 따라 별도 보관 정책 적용 가능 (v1은 CASCADE로 단순화, v2에서 검토)

### AuditLog  (감사 로그)

주요 보안·운영 액션 로그. 로그인, 비밀번호 변경, 관리자 액션 등.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NULLABLE FK → user(id) ON DELETE SET NULL | 익명 액션도 기록 가능 |
| action | VARCHAR(50) | NOT NULL | LOGIN_SUCCESS / LOGIN_FAIL / PASSWORD_CHANGE / ADMIN_ACTION 등 |
| target_type | VARCHAR(50) | NULLABLE | 대상 엔티티 타입 |
| target_id | VARCHAR(100) | NULLABLE | 대상 ID (문자열로 일반화) |
| ip | VARCHAR(45) | NULLABLE |  |
| user_agent | VARCHAR(500) | NULLABLE |  |
| metadata | JSONB | NULLABLE | 추가 컨텍스트 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_audit_user_created ON audit_log (user_id, created_at DESC);

CREATE INDEX idx_audit_action_created ON audit_log (action, created_at DESC);

#### 주요 노트

- v1 보관 기간: 90일. 이후 배치 삭제 (개인정보보호법 보관 기간 충족)
- 개인정보(이메일·이름 등) 본문 기록 금지. metadata는 PII 마스킹 후 저장

## 3.2 프로필 & 기본 정보

### Profile  (프로필)

User와 1:1. 온보딩 시 입력한 목적·경력·희망 직군과 기초 정보를 보관.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| user_id | BIGINT | PK FK → user(id) ON DELETE CASCADE | User와 1:1 |
| target | VARCHAR(20) | NOT NULL | JOB_CHANGE (이직) / EMPLOYMENT (취업) |
| career_year | SMALLINT | NOT NULL DEFAULT 0 | 경력 연차. 0=신입, 1~7=경력 |
| target_jobs | TEXT[] | NOT NULL DEFAULT '{}' | 희망 직군 코드 배열 (BACKEND / FRONTEND / INFRA_CLOUD / INFRA_OPS / UI_UX) |
| onboarding_completed | BOOLEAN | NOT NULL DEFAULT FALSE | 온보딩 4단계 완료 여부 |
| name | VARCHAR(50) | NULLABLE | 이름 (암호화 권장) |
| birth_date | DATE | NULLABLE | 생년월일 |
| gender | VARCHAR(10) | NULLABLE | MALE / FEMALE / NONE (선택 입력) |
| phone | VARCHAR(20) | NULLABLE | 연락처 (암호화 컬럼) |
| region | VARCHAR(50) | NULLABLE | 거주 지역 |
| introduction | TEXT | NULLABLE | 한 줄 소개 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

PK가 user_id 자체이므로 추가 인덱스 불필요

#### 주요 노트

- 이름·전화번호는 애플리케이션 레이어 AES-256 암호화 후 저장
- target_jobs는 다중 선택 가능 (예: BACKEND + INFRA_CLOUD 둘 다 희망)
- 인프라/DevOps 트랙은 target_jobs에는 INFRA_CLOUD / INFRA_OPS로 분리 저장. 둘 다 선택 가능.

### Education  (학력)

사용자별 학력 다중 입력 (고등학교, 대학교, 대학원 등).

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| level | VARCHAR(20) | NOT NULL | HIGH_SCHOOL / UNIVERSITY / GRADUATE |
| school | VARCHAR(100) | NOT NULL | 학교명 |
| major | VARCHAR(100) | NULLABLE | 전공 |
| start_date | DATE | NULLABLE | 입학일 |
| end_date | DATE | NULLABLE | 졸업/예정일 |
| gpa | NUMERIC(3,2) | NULLABLE | 학점 (4.50 또는 100점 환산) |
| gpa_max | NUMERIC(3,2) | NULLABLE | 만점 기준 (4.5 / 4.3 / 100) |
| status | VARCHAR(20) | NOT NULL | GRADUATED / ATTENDING / LEAVE / DROP |
| order_index | INTEGER | NOT NULL DEFAULT 0 | 표시 순서 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_education_user ON education (user_id, order_index);

### Certificate  (자격증)

사용자별 자격증 다중 입력.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| name | VARCHAR(100) | NOT NULL | 자격증명 |
| issuer | VARCHAR(100) | NULLABLE | 발급 기관 |
| acquired_at | DATE | NULLABLE | 취득일 |
| score | VARCHAR(50) | NULLABLE | 점수/등급 (예: '900점', '1급') |
| order_index | INTEGER | NOT NULL DEFAULT 0 |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_certificate_user ON certificate (user_id, order_index);

### Experience  (경험 / 대외활동)

인턴·동아리·공모전·봉사·사이드 프로젝트 등 비정규 경험. 경력은 별도 CareerHistory에 저장.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| type | VARCHAR(30) | NOT NULL | INTERN / CLUB / CONTEST / VOLUNTEER / SIDE_PROJECT / OTHER |
| name | VARCHAR(200) | NOT NULL | 활동명 |
| organization | VARCHAR(200) | NULLABLE | 기관/단체 |
| start_date | DATE | NULLABLE |  |
| end_date | DATE | NULLABLE |  |
| role | VARCHAR(200) | NULLABLE | 역할 |
| summary | TEXT | NULLABLE | 성과 요약 |
| order_index | INTEGER | NOT NULL DEFAULT 0 |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_experience_user ON experience (user_id, order_index);

## 3.3 이력서 · 경력 · 프로젝트

### Resume  (이력서)

사용자별 이력서 단일 최신본. 폼 작성 또는 파일 첨부 모드.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL UNIQUE FK → user(id) ON DELETE CASCADE | User와 1:1 |
| mode | VARCHAR(20) | NOT NULL | FORM (폼 작성) / FILE (파일 첨부) |
| content_json | JSONB | NULLABLE | FORM 모드의 작성 데이터 (스키마: 6.1 참조) |
| file_url | VARCHAR(500) | NULLABLE | FILE 모드의 S3/MinIO 경로 |
| file_name | VARCHAR(255) | NULLABLE | 원본 파일명 |
| file_size | INTEGER | NULLABLE | 바이트 |
| parsed_json | JSONB | NULLABLE | 파일 모드일 때 파싱 결과 (사용자 확인 후 저장) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

user_id UNIQUE 제약으로 1:1 보장

#### 주요 노트

- v1은 단일 최신본만 저장. 버전 관리는 v2
- content_json은 AES-256 컬럼 암호화 적용 (민감 정보)

### CareerHistory  (경력 (회사 단위))

사용자별 경력. 회사 단위로 한 행. 회사 안의 프로젝트는 Project 테이블에서 관리.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| company | VARCHAR(200) | NOT NULL | 회사명 |
| position | VARCHAR(100) | NULLABLE | 직책/직무 |
| start_date | DATE | NOT NULL |  |
| end_date | DATE | NULLABLE | 재직 중이면 NULL |
| is_current | BOOLEAN | NOT NULL DEFAULT FALSE | 현재 재직 중 플래그 |
| summary | TEXT | NULLABLE | 회사 단위 요약 |
| order_index | INTEGER | NOT NULL DEFAULT 0 |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_career_user ON career_history (user_id, order_index);

### Project  (프로젝트)

경력 회사 내 프로젝트 또는 사이드 프로젝트. 직군별 권장 구조(5.6.0)에 따른 4단 필드를 JSONB로 저장.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| career_history_id | BIGINT | NULLABLE FK → career_history(id) ON DELETE CASCADE | 사이드 프로젝트는 NULL |
| title | VARCHAR(200) | NOT NULL | 프로젝트명 |
| period_start | DATE | NULLABLE |  |
| period_end | DATE | NULLABLE |  |
| role | VARCHAR(200) | NULLABLE | 역할 / 본인 기여 |
| tech_stack | TEXT[] | NOT NULL DEFAULT '{}' | 사용 기술 태그 |
| structure_type | VARCHAR(30) | NOT NULL | PRAR / UX_DRIVEN / OPS_RESULT / DESIGN_THINKING |
| structure_data | JSONB | NOT NULL DEFAULT '{}' | 4단 필드 (스키마: 6.2 참조) |
| metrics | JSONB | NULLABLE | 정량 성과 (TPS, 비용 절감 등) |
| order_index | INTEGER | NOT NULL DEFAULT 0 |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_project_user ON project (user_id, order_index);

CREATE INDEX idx_project_career ON project (career_history_id);

CREATE INDEX idx_project_tech ON project USING GIN (tech_stack);

#### 주요 노트

- structure_type은 사용자가 명시적으로 선택하거나 직군에서 자동 추론
- tech_stack은 GIN 인덱스로 키워드 매칭 검색 가속
- metrics는 자유 형식: { 'tps': '500→2000', 'cost_saved_krw': 30000000 } 등

## 3.4 포트폴리오

### PortfolioLink  (포트폴리오 링크)

외부 링크 모음 + 메타데이터. v1은 풀 빌더 미제공, 링크 + 본인 기여 요약만 관리.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| title | VARCHAR(200) | NOT NULL | 항목 제목 |
| description | VARCHAR(500) | NULLABLE | 한 줄 설명 |
| link_type | VARCHAR(30) | NOT NULL | GITHUB / NOTION / BEHANCE / DRIBBBLE / FIGMA / PDF / OTHER |
| url | VARCHAR(1000) | NULLABLE | 외부 URL |
| file_url | VARCHAR(500) | NULLABLE | PDF 업로드 시 S3/MinIO 경로 |
| tags | TEXT[] | NOT NULL DEFAULT '{}' | 사용 기술/태그 |
| contribution | TEXT | NULLABLE | 본인 기여 요약 (자소서 컨텍스트로 활용) |
| order_index | INTEGER | NOT NULL DEFAULT 0 |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_portfolio_user ON portfolio_link (user_id, order_index);

CHECK (url IS NOT NULL OR file_url IS NOT NULL)

## 3.5 채용공고 & 기업분석

### JobPosting  (채용공고)

사용자가 등록한 채용공고. v1은 URL 입력 또는 직접 작성. 사람인 OpenAPI 검색은 v2.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE | 공고는 사용자 단위로 관리 (개인 작업 공간) |
| source | VARCHAR(20) | NOT NULL | URL / MANUAL |
| company | VARCHAR(200) | NOT NULL | 회사명 |
| title | VARCHAR(300) | NOT NULL | 공고 제목 |
| job_role | VARCHAR(100) | NULLABLE | 직무 (예: '백엔드 개발자') |
| requirements | TEXT | NULLABLE | 자격 요건 |
| preferred | TEXT | NULLABLE | 우대 사항 |
| main_tasks | TEXT | NULLABLE | 주요 업무 |
| deadline | DATE | NULLABLE | 마감일 |
| source_url | VARCHAR(1000) | NULLABLE | 원본 URL |
| keywords | TEXT[] | NOT NULL DEFAULT '{}' | JD 핵심 키워드 (LLM 추출 결과, JD 매칭에 사용) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_posting_user_deadline ON job_posting (user_id, deadline);

CREATE INDEX idx_posting_keywords ON job_posting USING GIN (keywords);

#### 주요 노트

- 공고 본문은 메타데이터 + 자격요건/우대사항 텍스트만 영구 저장. 본문 전문은 사용자 화면에서만 사용하고 영구 저장 최소화 (저작권)
- keywords는 등록 시 LLM 1회 호출로 추출 → 자소서 작성 시 캐시 활용

### CompanyAnalysis  (기업분석)

DART + 뉴스 + 회사 홈페이지 기반 기업 분석 결과. 자소서 생성에 컨텍스트로 활용.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| company | VARCHAR(200) | NOT NULL | 회사명 |
| summary_json | JSONB | NOT NULL | 항목별 분석 결과 (스키마: 6.3 참조) |
| news_keywords | TEXT[] | NOT NULL DEFAULT '{}' | 최근 6개월 뉴스 핵심 키워드 |
| dart_corp_code | VARCHAR(20) | NULLABLE | DART 고유 코드 (재조회용) |
| source_urls | TEXT[] | NOT NULL DEFAULT '{}' | 참조 URL들 (인용 추적) |
| generated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 분석 생성 시각 |
| generated_by | VARCHAR(50) | NOT NULL | LLM 모델명 (예: 'gpt-4o-mini-2024-07-18') |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_analysis_user_company ON company_analysis (user_id, company);

CREATE INDEX idx_analysis_generated_at ON company_analysis (generated_at DESC);

#### 주요 노트

- 분석 결과는 30일 캐시. 같은 회사 재요청 시 30일 이내면 기존 결과 재사용 (LLM 비용 절감)
- 사용자별로 분석 보관 (다른 사용자의 분석 결과 공유 안 함 — v1 단순화. v2에서 공용 캐시 검토)

## 3.6 자소서 & 경력기술서

### CoverLetterMaster  (마스터 자소서)

사용자의 항목 유형별 마스터 답변. 회사 지원 시 AI가 베이스로 활용.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| item_type | VARCHAR(50) | NOT NULL | MOTIVATION / FUTURE_PLAN / TEAMWORK / CONFLICT / ACHIEVEMENT / PROBLEM_SOLVING / STRENGTH / WEAKNESS / OTHER |
| title | VARCHAR(200) | NULLABLE | 사용자 지정 제목 (예: 'A형 협업 마스터') |
| master_answer | TEXT | NOT NULL | 마스터 답변 본문 |
| char_limit_hint | INTEGER | NULLABLE | 타겟 글자수 힌트 |
| is_default | BOOLEAN | NOT NULL DEFAULT TRUE | 같은 item_type 다중 보유 시 기본 선택 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_master_user_type ON cover_letter_master (user_id, item_type);

CREATE UNIQUE INDEX uq_master_default ON cover_letter_master (user_id, item_type) WHERE is_default = TRUE;

#### 주요 노트

- 같은 item_type에 여러 마스터 보유 가능. is_default = TRUE는 항목 유형당 1개만 허용
- AES-256 컬럼 암호화 적용 (민감 정보)

### CoverLetterVariant  (회사별 자소서 변형본)

특정 채용공고 × 항목 유형에 대한 자소서 변형본. AI 초안과 사용자 수정본을 별도 컬럼으로 보관.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| posting_id | BIGINT | NULLABLE FK → job_posting(id) ON DELETE SET NULL | 공고 미연결도 허용 |
| analysis_id | BIGINT | NULLABLE FK → company_analysis(id) ON DELETE SET NULL |  |
| master_id | BIGINT | NULLABLE FK → cover_letter_master(id) ON DELETE SET NULL |  |
| item_type | VARCHAR(50) | NOT NULL | 마스터와 동일 enum |
| question | VARCHAR(500) | NOT NULL | 자소서 항목 질문 (예: '지원 동기를 작성해주세요') |
| char_limit | INTEGER | NOT NULL | 글자수 제한 |
| ai_draft | TEXT | NULLABLE | AI 생성 초안 (참조용 보존) |
| user_edit | TEXT | NULLABLE | 사용자 수정본 (최종본) |
| user_request | TEXT | NULLABLE | AI 초안 생성 시 사용자 요청사항 |
| validation_json | JSONB | NULLABLE | 자동 검증 결과 (스키마: 6.4 참조) |
| status | VARCHAR(20) | NOT NULL DEFAULT 'DRAFT' | DRAFT / COMPLETED |
| ai_model | VARCHAR(50) | NULLABLE | 초안 생성 LLM 모델명 |
| ai_tokens_used | INTEGER | NULLABLE | 사용 토큰 (비용 추적) |
| deleted_at | TIMESTAMPTZ | NULLABLE | 휴지통 (30일 후 영구 삭제) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_variant_user ON cover_letter_variant (user_id, updated_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_variant_posting ON cover_letter_variant (posting_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_variant_deleted ON cover_letter_variant (deleted_at) WHERE deleted_at IS NOT NULL;

#### 주요 노트

- ai_draft / user_edit / user_request 컬럼은 AES-256 암호화
- 휴지통 30일 경과 시 일일 배치 영구 삭제
- 동일 (user_id, posting_id, item_type) 조합은 단일 변형본 (UPSERT 운영). v1은 unique 미강제, 애플리케이션 단에서 중복 방지.

### CareerStatement  (경력기술서)

사용자의 경력을 채용공고·기업분석 기준으로 재구조화한 결과물.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| posting_id | BIGINT | NULLABLE FK → job_posting(id) ON DELETE SET NULL |  |
| analysis_id | BIGINT | NULLABLE FK → company_analysis(id) ON DELETE SET NULL |  |
| content_json | JSONB | NOT NULL | 재구조화 결과 (스키마: 6.5 참조) |
| user_edit | TEXT | NULLABLE | 사용자 수정본 (마크다운/텍스트) |
| file_url | VARCHAR(500) | NULLABLE | 다운로드 결과물 캐시 (PDF/Word) |
| ai_model | VARCHAR(50) | NULLABLE |  |
| ai_tokens_used | INTEGER | NULLABLE |  |
| deleted_at | TIMESTAMPTZ | NULLABLE |  |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_statement_user ON career_statement (user_id, updated_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_statement_posting ON career_statement (posting_id) WHERE deleted_at IS NULL;

#### 주요 노트

- v1은 단일 최신본만 저장
- content_json / user_edit 컬럼은 AES-256 암호화

## 3.7 지원 관리

### Application  (지원)

사용자의 지원 1건. 캘린더·대시보드·히스토리의 핵심 엔티티.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| posting_id | BIGINT | NULLABLE FK → job_posting(id) ON DELETE SET NULL | 공고 미연결도 허용 (수동 일정) |
| company | VARCHAR(200) | NOT NULL | 공고 연결 시 자동 채움, 아니면 직접 입력 |
| stage | VARCHAR(30) | NOT NULL | DOCUMENT / CODING_TEST / INTERVIEW_1 / INTERVIEW_2 / EXEC_INTERVIEW / NEGOTIATION / PASSED / FAILED / OTHER |
| result | VARCHAR(20) | NOT NULL DEFAULT 'SCHEDULED' | SCHEDULED / IN_PROGRESS / PASSED / FAILED / WAITING |
| dates_json | JSONB | NOT NULL DEFAULT '{}' | 전형별 일자/기간 (스키마: 6.6 참조) |
| location | VARCHAR(200) | NULLABLE | 장소 (오프라인) 또는 링크 (온라인) |
| mode | VARCHAR(20) | NULLABLE | ONLINE / OFFLINE / HYBRID |
| memo | TEXT | NULLABLE | 사용자 메모 |
| color | VARCHAR(7) | NULLABLE | 캘린더 표시용 hex 색상 (#RRGGBB) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_application_user_updated ON application (user_id, updated_at DESC);

CREATE INDEX idx_application_user_stage ON application (user_id, stage);

CREATE INDEX idx_application_posting ON application (posting_id);

#### 주요 노트

- 캘린더 조회는 dates_json 안의 일자를 추출하므로 GIN 인덱스 또는 별도 마터리얼라이즈 뷰 고려 가능 (v1은 단순 조회로 충분)
- stage 변경 시 ApplicationHistory에 자동 기록 (트리거 또는 애플리케이션 단)

### ApplicationHistory  (지원 변경 이력)

Application의 모든 변경 로그. 지원 현황 > 히스토리 메뉴에서 시간 역순 표출.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| application_id | BIGINT | NOT NULL FK → application(id) ON DELETE CASCADE |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE | 조회 효율성 |
| field_name | VARCHAR(50) | NOT NULL | stage / result / dates_json / location / mode / memo |
| before_value | JSONB | NULLABLE | 변경 전 값 |
| after_value | JSONB | NOT NULL | 변경 후 값 |
| actor | VARCHAR(20) | NOT NULL | USER / SYSTEM |
| changed_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_history_user_changed ON application_history (user_id, changed_at DESC);

CREATE INDEX idx_history_app ON application_history (application_id, changed_at DESC);

#### 주요 노트

- 필드 단위로 변경 기록 (한 번에 여러 필드 변경 시 같은 changed_at으로 여러 행 생성)
- v1 보관 기간: 365일. 이후 배치 삭제

## 3.8 알림 & 사용자 설정

### Notification  (알림)

사용자에게 발송된 알림 로그.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK |  |
| user_id | BIGINT | NOT NULL FK → user(id) ON DELETE CASCADE |  |
| channel | VARCHAR(20) | NOT NULL | EMAIL / WEB_PUSH |
| type | VARCHAR(50) | NOT NULL | POSTING_DEADLINE_D3 / POSTING_DEADLINE_D1 / SCHEDULE_D1 / COVER_LETTER_UNSUBMITTED_7D / WEEKLY_SUMMARY / EMAIL_VERIFY / PASSWORD_RESET |
| title | VARCHAR(200) | NOT NULL | 알림 제목 |
| body | TEXT | NULLABLE | 본문 |
| payload_json | JSONB | NULLABLE | 딥링크 / 추가 컨텍스트 |
| scheduled_at | TIMESTAMPTZ | NULLABLE | 예약 발송 시각 |
| sent_at | TIMESTAMPTZ | NULLABLE | 실제 발송 시각 |
| read_at | TIMESTAMPTZ | NULLABLE | 사용자 확인 시각 (웹푸시) |
| error | TEXT | NULLABLE | 발송 실패 사유 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 인덱스 / 제약

CREATE INDEX idx_notif_user_created ON notification (user_id, created_at DESC);

CREATE INDEX idx_notif_pending ON notification (scheduled_at) WHERE sent_at IS NULL;

#### 주요 노트

- 발송 워커는 idx_notif_pending를 사용해 예약 알림 폴링
- 보관 기간 90일 (사용자 화면 표시 + 배치 삭제)

### NotificationPreference  (알림 설정)

User와 1:1. 카테고리별 ON/OFF 설정.

| 컬럼명 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| user_id | BIGINT | PK FK → user(id) ON DELETE CASCADE |  |
| email_enabled | BOOLEAN | NOT NULL DEFAULT TRUE | 전체 이메일 알림 ON/OFF |
| push_enabled | BOOLEAN | NOT NULL DEFAULT FALSE | 전체 웹푸시 ON/OFF (사용자가 브라우저 권한 동의해야 TRUE) |
| prefs_json | JSONB | NOT NULL DEFAULT '{}' | 카테고리별 세부 설정 (스키마: 6.7 참조) |
| push_endpoint | VARCHAR(1000) | NULLABLE | 웹푸시 endpoint |
| push_p256dh | VARCHAR(255) | NULLABLE | 웹푸시 공개키 |
| push_auth | VARCHAR(255) | NULLABLE | 웹푸시 auth secret |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |  |

#### 주요 노트

- EMAIL_VERIFY / PASSWORD_RESET 같은 보안 알림은 prefs_json과 무관하게 강제 발송
- 웹푸시 endpoint·키는 브라우저별 1개. 멀티 디바이스 지원은 v2에서 별도 테이블로 분리

# 4. 인덱스 요약

v1 운영에 필요한 인덱스. 모든 FK 컬럼에는 기본적으로 인덱스 권장 (대부분 위 정의에 포함).

## 4.1 Unique 인덱스 (alive 사용자만 적용)

- user(email) WHERE deleted_at IS NULL
- user(nickname) WHERE deleted_at IS NULL
- social_account(provider, provider_user_id)
- cover_letter_master(user_id, item_type) WHERE is_default = TRUE

## 4.2 조회 인덱스

- application(user_id, updated_at DESC) — 대시보드
- application(user_id, stage) — 전형별 필터
- application_history(user_id, changed_at DESC) — 히스토리 화면
- notification(scheduled_at) WHERE sent_at IS NULL — 발송 워커
- cover_letter_variant(user_id, updated_at DESC) WHERE deleted_at IS NULL — 자소서 목록
- company_analysis(user_id, company) — 같은 회사 재요청 시 캐시 hit 체크

## 4.3 GIN 인덱스 (배열·JSONB)

- project USING GIN (tech_stack) — 기술 매칭
- job_posting USING GIN (keywords) — JD 키워드 매칭
- application USING GIN (dates_json) — 캘린더 날짜 조회 (필요 시)

# 5. 운영 / 마이그레이션 노트

## 5.1 마이그레이션 도구

- Flyway 사용. SQL 파일 명명: V{버전}__{snake_case_설명}.sql
- 초기 스키마: V1__init_schema.sql (모든 테이블 + 인덱스 + FK)
- 이후 변경은 단일 변경 단위로 분리 (롤백 불가하므로 신중)
- 개발 환경: docker-compose 기동 시 자동 마이그레이션

## 5.2 암호화 컬럼

- Spring Boot에서 @Convert(converter = StringEncryptConverter.class) 적용
- 적용 대상: profile.name / profile.phone / resume.content_json / cover_letter_master.master_answer / cover_letter_variant.ai_draft / cover_letter_variant.user_edit / career_statement.content_json / career_statement.user_edit
- 키 관리: v1은 환경변수 .env. v2 클라우드 진입 시 KMS / Secrets Manager

## 5.3 배치 작업 (v1)

- 탈퇴 30일 경과 사용자 영구 삭제 (일 1회 새벽)
- 자소서 변형본 / 경력기술서 휴지통 30일 경과 영구 삭제 (일 1회)
- CompanyAnalysis 30일 경과 캐시 만료 (조회 시 lazy 갱신, 별도 배치 불필요)
- AuditLog 90일 경과 삭제 (주 1회)
- ApplicationHistory 365일 경과 삭제 (월 1회)
- Notification 90일 경과 삭제 (주 1회)

## 5.4 데이터 마이그레이션 호환성 (v1 → v2)

- v1 로컬 PostgreSQL → v2 클라우드 RDS 이전 시 pg_dump / pg_restore 사용
- 파일 저장(MinIO → S3)은 별도 동기화 스크립트 (aws s3 sync 호환 도구)
- 암호화 키는 별도 안전 이전 (KMS 도입 시 컬럼 단위 재암호화 필요)

## 5.5 PostgreSQL 운영 팁

- VACUUM ANALYZE 자동 실행 활성화 (autovacuum 기본)
- connection pool: HikariCP 기본 사용, maxPoolSize = 10 (v1 충분)
- 백업: pg_dump 일 1회 + 7일 보관 (v1 로컬에서는 cron으로 NAS/외장 디스크 백업)

# 6. JSONB 컬럼 스키마

자유 형식 컬럼의 구조를 문서화. 애플리케이션 단에서 검증 + 마이그레이션 시 호환성 확보.

## 6.1 resume.content_json (폼 작성 모드)

{

"basic": { "name": "...", "phone": "...", "email": "..." },

"summary": "한 줄 요약",

"skills": ["Spring Boot", "PostgreSQL", "AWS"],

"highlights": [

{ "title": "주요 성과 1", "desc": "..." }

]

}

## 6.2 project.structure_data (구조별 4단)

// PRAR (백엔드)

{ "problem": "...", "root_cause": "...", "approach": "...", "result": "..." }

// UX-Driven (프론트엔드)

{ "ux_problem": "...", "tech_approach": "...", "implementation": "...", "impact": "..." }

// Ops-Result (인프라/DevOps)

{ "ops_issue": "...", "analysis": "...", "automation": "...", "result": "...",

"track": "CLOUD" | "OPS" }

// Design Thinking (UI/UX 디자이너)

{ "user_problem": "...", "insight": "...", "solution": "...", "validation": "..." }

## 6.3 company_analysis.summary_json

{

"overview": { "business": "...", "products": [...], "size": "..." },

"recent_news": [

{ "title": "...", "date": "2026-04", "url": "...", "summary": "..." }

],

"talent_profile": "...",

"hiring_process": ["서류", "코딩테스트", "1차 면접", "임원 면접"],

"action_points": [

"본인 이력의 ○○ 경험을 ○○ 식으로 풀면 효과적"

]

}

## 6.4 cover_letter_variant.validation_json

{

"char_count": 487,

"char_limit": 500,

"char_count_ok": true,

"keyword_match": {

"k_total": 10,

"matched": ["Spring Boot", "MSA", "Kafka"],

"matched_count": 3,

"threshold": 3,

"passed": true

},

"hallucination_flags": [

{ "text": "Kafka 클러스터 운영", "reason": "이력에 명시되지 않음" }

]

}

## 6.5 career_statement.content_json

{

"summary": "...",

"highlights": [

{ "company": "...", "project": "...", "structure_type": "PRAR",

"structure_data": { ... }, "metrics": { ... } }

],

"jd_match": { "matched_keywords": [...], "score": 0.72 }

}

## 6.6 application.dates_json

{

"DOCUMENT": { "deadline": "2026-05-31" },

"CODING_TEST": { "date": "2026-06-05T14:00:00+09:00", "duration_min": 120 },

"INTERVIEW_1": { "date": "2026-06-10T10:00:00+09:00", "location": "..." },

"INTERVIEW_2": { "date": "2026-06-15T15:00:00+09:00", "mode": "ONLINE", "link": "..." }

}

## 6.7 notification_preference.prefs_json

{

"POSTING_DEADLINE": { "email": true, "push": true },

"SCHEDULE": { "email": true, "push": true },

"COVER_LETTER_UNSUBMITTED": { "email": false, "push": false },

"WEEKLY_SUMMARY": { "email": false, "push": false }

}

# 7. 다음 단계

- V1__init_schema.sql 작성 (이 문서 기반 Flyway 마이그레이션)
- JPA 엔티티 클래스 작성 (각 테이블별)
- Spring Boot Repository / Service 레이어 구현
- 암호화 컬럼용 AttributeConverter 구현
- seed 데이터 작성 (직군 코드, 자소서 항목 유형, 알림 카테고리 등 enum 마스터)
- ERD 다이어그램 시각화 (.mermaid → mermaid.live 또는 VS Code 확장)
