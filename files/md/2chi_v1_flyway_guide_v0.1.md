2chi v1

Flyway 마이그레이션 운영 가이드

v0.1 · PostgreSQL 15+ · Spring Boot 3.x

작성일: 2026-05-08 · 작성자: 김소미

# 1. Flyway란

Flyway는 데이터베이스 스키마 변경을 SQL 파일로 버전 관리하는 도구다. Spring Boot와 통합되어 앱 시작 시 자동 적용되며, 한국 백엔드 환경에서 사실상 표준이다. 본 가이드는 2chi v1의 PostgreSQL 스키마를 Flyway로 운영하기 위한 설정·관행·운영 시나리오를 정리한다.

## 1.1 핵심 동작

- SQL 파일을 V{버전}__{설명}.sql 형식으로 작성
- 앱 시작 시 Flyway가 적용되지 않은 파일을 순서대로 실행
- 적용된 파일은 flyway_schema_history 테이블에 체크섬과 함께 기록
- 적용 완료된 파일은 절대 수정 불가 — 수정 시 체크섬 불일치로 앱 시작 실패
- 후속 변경은 항상 새 V{n+1}__ 파일로 추가

## 1.2 장점

- 환경 동기화 — 본인 PC / 지인 테스트 / v2 클라우드가 동일 스키마 보장
- 협업 안전 — git pull + 앱 재시작만으로 동료의 스키마 변경이 자동 반영
- 변경 이력 — 언제 누가 무엇을 왜 변경했는지 파일과 git 히스토리로 추적
- 롤백 안전성 — 잘못된 변경을 되돌리는 새 마이그레이션으로 복구

# 2. Spring Boot 통합 설정

## 2.1 의존성 추가 (build.gradle)

```
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql' // PostgreSQL 16+ 권장
    implementation 'org.postgresql:postgresql'
    // ...
}
```

## 2.2 application.yml

```
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/twochi
    username: ${DB_USER:twochi}
    password: ${DB_PASSWORD:changeme}

  jpa:
    hibernate:
      ddl-auto: validate   # ★ Flyway가 스키마 관리 → JPA는 검증만
    open-in-view: false
    properties:
      hibernate.format_sql: true
      hibernate.jdbc.time_zone: UTC

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false   # v1 신규 DB 기준
    validate-on-migrate: true
    out-of-order: false          # 버전 순서 엄격 적용
    placeholders:
      env: ${SPRING_PROFILES_ACTIVE:local}
```

핵심 포인트:

- ddl-auto는 반드시 validate (또는 none). update/create-drop은 Flyway와 충돌
- locations 디렉토리에 V1__init_schema.sql을 배치
- out-of-order: false — 동료가 본인보다 늦은 버전 번호를 먼저 머지하면 앱 시작 실패. 협의 후 새 버전 번호로 재명명
- placeholders — 환경별 시드 데이터 차이를 SQL 안에서 ${env}로 분기 가능

## 2.3 디렉토리 구조

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__init_schema.sql             ← 본 ERD 기반 초기 스키마
        ├── V2__add_xxxx.sql                ← 후속 변경 1
        ├── V3__seed_competency_master.sql  ← 시드 데이터
        ├── R__refresh_views.sql            ← (repeatable, 매번 재실행)
        └── ...
```

파일 접두사 종류:

- V (Versioned): 한 번만 실행. 가장 일반적. 본 프로젝트 기본 선택.
- R (Repeatable): 파일 내용이 바뀔 때마다 실행. 뷰·함수·시드 데이터 갱신용.
- U (Undo): 다운그레이드용. Flyway Teams (유료) 전용. 사용 안 함.

# 3. 파일 명명 규칙

## 3.1 형식

V{버전}__{snake_case_설명}.sql

- V — 버전드 마이그레이션 접두사 (대문자 고정)
- 버전 — 정수 또는 1.1, 1.2.3 같은 점 분리 형식. 본 프로젝트는 정수 사용
- __ — 언더스코어 2개 (필수 구분자)
- 설명 — snake_case, 영문 권장 (한글 허용되나 OS별 호환성 위해 영문 권장)
- 확장자 — .sql

## 3.2 예시

| 파일명 | 내용 예시 |
| --- | --- |
| V1__init_schema.sql | 초기 스키마 (현재 산출물) |
| V2__add_application_notes_column.sql | application.memo → notes 컬럼 변경 |
| V3__create_competency_seed.sql | 직무 표준 역량 매트릭스 시드 |
| V4__add_cover_letter_version.sql | v2 자소서 버전 관리 컬럼 추가 |
| V5__index_application_dates.sql | 캘린더 조회 성능 개선 GIN 인덱스 |
| R__refresh_views.sql | 뷰/머터리얼라이즈 뷰 재생성 |

## 3.3 작명 가이드

- 동사 시작 권장: add / drop / rename / alter / create / index / seed
- 한 파일 = 한 의도. 'misc_changes' 같은 파일명 금지
- PR 제목과 파일명을 같은 키워드로 맞추면 추적 쉬움

# 4. 절대 규칙 (지키지 않으면 운영 사고)

## 4.1 적용된 마이그레이션은 절대 수정 금지

한 번 적용된 V{n} 파일을 수정하면 Flyway는 체크섬 불일치로 앱 시작을 거부한다. 본인 PC에서만 작업하더라도 git push 후엔 다른 환경에 영향. 수정이 필요하면 새 V{n+1} 파일을 추가하라.

## 4.2 버전 번호 중복 금지

동료와 동시에 V2를 추가하면 머지 시 충돌. 본인 PR에서 항상 main의 최신 버전을 확인하고 한 칸 위로 명명. 같은 버전이 둘이면 둘 다 실패.

## 4.3 ddl-auto는 validate 또는 none

JPA의 ddl-auto가 update/create면 JPA가 임의로 컬럼을 추가/변경해 Flyway 이력과 어긋남. 반드시 validate (또는 none).

## 4.4 운영 DB에서 직접 DDL 실행 금지

psql로 직접 ALTER TABLE 실행하면 flyway_schema_history에 기록되지 않아 다음 마이그레이션에서 충돌. 모든 변경은 V{n} 파일을 통해서.

## 4.5 트랜잭션 가정 주의

PostgreSQL은 DDL이 트랜잭션 안에서 실행되어 마이그레이션 중 실패 시 자동 롤백된다 (대부분의 DDL). 다만 CREATE INDEX CONCURRENTLY 등 일부 DDL은 트랜잭션 밖에서만 실행 가능. 이 경우 파일 첫 줄에 다음을 명시:

```
-- 트랜잭션 비활성화 (CONCURRENT 인덱스 등)
-- @flyway.executeInTransaction=false
CREATE INDEX CONCURRENTLY idx_xxx ON xxx (col);
```

# 5. 로컬 개발 환경 운영

## 5.1 docker-compose로 Postgres 띄우기

```
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: twochi
      POSTGRES_USER: twochi
      POSTGRES_PASSWORD: changeme
      TZ: Asia/Seoul
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 5.2 첫 기동

```
# 1) Postgres 컨테이너 기동
docker compose up -d postgres

# 2) Spring Boot 앱 기동 → Flyway가 V1__init_schema.sql 자동 적용
./gradlew bootRun

# 3) 적용 확인
psql -h localhost -U twochi -d twochi -c \
  "SELECT version, description, success FROM flyway_schema_history;"
```

## 5.3 스키마 초기화 (개발 중 처음부터 다시)

개발 중 스키마를 완전히 리셋하고 싶을 때:

```
# Postgres 데이터 볼륨 삭제
docker compose down -v
docker compose up -d postgres
./gradlew bootRun     # 다시 V1부터 전체 적용
```

⚠ 운영 환경에서는 절대 사용 금지. 로컬 한정.

# 6. 후속 마이그레이션 작성 가이드 (예시)

## 6.1 컬럼 추가

```
-- V2__add_application_priority.sql
ALTER TABLE application
    ADD COLUMN priority SMALLINT NOT NULL DEFAULT 0;
COMMENT ON COLUMN application.priority IS '사용자 정의 우선순위 (높을수록 위)';
CREATE INDEX idx_application_user_priority
    ON application (user_id, priority DESC);
```

## 6.2 컬럼명 변경 (안전한 단계적 변경)

한 번에 RENAME COLUMN을 하면 이전 코드와 호환 안 됨. 무중단 배포가 필요하다면 다음 3단계:

```
-- V2__add_application_notes_column.sql
-- 1단계: 새 컬럼 추가 + 데이터 복사
ALTER TABLE application ADD COLUMN notes TEXT;
UPDATE application SET notes = memo;

-- 이후 새 컬럼을 사용하도록 애플리케이션 코드 배포

-- V3__drop_application_memo_column.sql
-- 2단계: 새 코드가 안정화된 후 옛 컬럼 삭제 (수일~수주 뒤)
ALTER TABLE application DROP COLUMN memo;
```

## 6.3 데이터 마이그레이션과 함께

```
-- V4__convert_project_metrics_to_jsonb.sql
ALTER TABLE project ADD COLUMN metrics_new JSONB;

UPDATE project
SET metrics_new = jsonb_build_object('legacy_text', metrics_text)
WHERE metrics_text IS NOT NULL;

ALTER TABLE project DROP COLUMN metrics_text;
ALTER TABLE project RENAME COLUMN metrics_new TO metrics;
```

## 6.4 시드 데이터 (Repeatable 권장)

직무 표준 역량 매트릭스 같은 시드 데이터는 R__로 작성. 파일 내용이 바뀌면 매번 재실행.

```
-- R__seed_competency_master.sql
-- 멱등성 보장: ON CONFLICT DO UPDATE 패턴
INSERT INTO competency_master (id, code, track, category, name, weight)
VALUES
    (1, 'BE-LANG-001', 'BACKEND', '언어·프레임워크', 'Java/Kotlin 기초', 5),
    (2, 'BE-LANG-002', 'BACKEND', '언어·프레임워크', 'Spring Boot', 5)
    -- ... (외부 xlsx에서 자동 생성)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    weight = EXCLUDED.weight;
```

## 6.5 인덱스 추가 (운영 무중단)

```
-- V5__index_application_dates.sql
-- @flyway.executeInTransaction=false
-- CONCURRENT는 트랜잭션 밖에서만 실행 가능

CREATE INDEX CONCURRENTLY idx_application_dates_gin
    ON application USING GIN (dates_json);
```

# 7. 운영 시나리오

## 7.1 PR 머지 시 동료와 버전 충돌

상황: 본인 브랜치에서 V2 작성. 동료가 먼저 V2를 머지함.

- git pull로 main 최신 받음
- 본인 V2 파일을 V3으로 rename + 파일 내용에 영향 없으면 그대로
- rename 커밋 + PR 갱신
- 팀 룰: PR 제출 직전 반드시 main의 최신 V{n}을 확인하고 한 칸 위로 명명

## 7.2 적용된 마이그레이션을 수정해야 할 때

원칙: 절대 수정 금지. 새 마이그레이션으로 보정한다.

- V1에서 컬럼 정의가 잘못됐다면 → V2__fix_xxx.sql 추가로 ALTER 적용
- V1에서 잘못 만든 인덱스 → V2__drop_xxx_index.sql + V3__create_correct_index.sql
- 예외: 로컬 개발 중 아직 push 안 한 V{n}은 수정 OK. push/머지 직전에 한 번 더 확인

## 7.3 운영 DB 직접 변경된 상태에서 마이그레이션 실패

누군가 psql로 직접 DDL을 적용해 다음 마이그레이션이 충돌하는 경우:

- 실제 스키마와 flyway_schema_history 비교
- 정합성을 맞춘 새 V{n} 파일 작성 (필요 시 IF EXISTS / IF NOT EXISTS 사용)
- 최후 수단: flyway repair 명령 — 체크섬·실패 기록을 재정렬 (잘못된 사용 시 위험)

## 7.4 v1 로컬 → v2 클라우드 이전

- v1 로컬 PostgreSQL의 flyway_schema_history와 데이터를 pg_dump
- v2 클라우드 PostgreSQL에 pg_restore
- v2 코드 배포 시 Flyway가 이미 적용된 V1~V{n}을 건너뛰고 V{n+1}부터 적용
- baseline-on-migrate: true는 사용하지 않는다 (히스토리 누락 위험)

# 8. 명령어 치트시트

## 8.1 Spring Boot 기동 시 자동 적용

앱 시작만 하면 됨 (./gradlew bootRun). 별도 명령어 불필요.

## 8.2 Flyway CLI 명령 (선택, 디버깅용)

```
# 설치 (Mac, Homebrew)
brew install flyway

# 적용
flyway -url=jdbc:postgresql://localhost:5432/twochi \
       -user=twochi -password=changeme \
       -locations=filesystem:./src/main/resources/db/migration \
       migrate

# 현재 상태 확인
flyway -url=... info

# 검증 (체크섬 일치 여부)
flyway -url=... validate

# 체크섬 복구 (최후 수단)
flyway -url=... repair
```

## 8.3 psql로 직접 이력 확인

```
# 적용된 마이그레이션 목록
SELECT version, description, type, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;

# 실패한 마이그레이션 확인
SELECT * FROM flyway_schema_history WHERE success = false;
```

# 9. (부록) Flyway vs Liquibase

참고용 비교. 본 프로젝트는 Flyway 선정.

| 항목 | Flyway | Liquibase |
| --- | --- | --- |
| 문법 | 순수 SQL | XML / YAML / JSON / SQL |
| 학습 곡선 | 낮음 | 높음 (DSL 학습 필요) |
| DB 호환성 | 각 DB의 네이티브 SQL | 추상화 (DB 무관 가능) |
| 롤백 | 유료 (Flyway Teams) | 오픈소스에 포함 |
| 커뮤니티 | Spring Boot 기본 통합, 한국 자료 풍부 | 엔터프라이즈 시장 강세 |
| 선정 이유 | 단순함, Spring Boot 기본, 작은 팀 운영 부담↓ | - |

# 10. 다음 단계

- 로컬 docker-compose.yml 작성 (다음 산출물: v1 도커 컴포즈 운영 가이드)
- V2__seed_competency_master.sql 자동 생성 스크립트 작성 (역량 매트릭스 xlsx 기반)
- CI에 'Flyway migrate dry-run' 단계 추가 (PR 머지 전 마이그레이션 정합성 검증)
- 운영 환경 분리 후 staging 마이그레이션 SOP 확정
