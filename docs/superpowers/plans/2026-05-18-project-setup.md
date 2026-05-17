# 2chi v1 프로젝트 초기 셋업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub 레포 + 모노레포 구조 + 백엔드/프론트 스켈레톤 + 인프라(Docker) + CI를 구성하여 `feat/5.1-auth-signup` 작업을 바로 시작할 수 있는 상태를 만든다.

**Architecture:** 단일 GitHub 레포(2chi-v1) 모노레포. `backend/` (Spring Boot 3.x, Gradle), `frontend/` (Next.js App Router), `design_system/` 와 `files/` 는 읽기 전용 참조. Docker Compose는 Postgres·MinIO·Redis만 컨테이너로, 애플리케이션은 호스트 직접 실행. Flyway가 DB 스키마를 관리.

**Tech Stack:** Java 17 / Spring Boot 3.3.x / Gradle (Kotlin DSL) / PostgreSQL 15 / Flyway / Next.js 14+ / TypeScript / Docker Compose / GitHub Actions

---

## File Structure

```
2chi-v1/                                  # 모노레포 루트 = 현재 디렉토리
├── backend/                              # (NEW) Spring Boot 백엔드
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle/wrapper/...                # gradle wrapper
│   ├── gradlew
│   ├── gradlew.bat
│   └── src/
│       ├── main/
│       │   ├── java/com/twochi/
│       │   │   └── TwochiApplication.java
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       │           └── V1__init_schema.sql   # files/ 에서 이동
│       └── test/
│           └── java/com/twochi/
│               └── TwochiApplicationTests.java
├── frontend/                             # (NEW) Next.js 프론트
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       └── styles/
│           └── tokens.css                # design_system/tokens.css 복사본
├── design_system/                        # 기존 유지
├── files/                                # 기존 유지 (docker-compose.yml, V1__init_schema.sql은 이동)
├── docs/
│   └── superpowers/plans/                # 이 플랜 위치
├── docker-compose.yml                    # files/ 에서 루트로 이동
├── .env.example                          # (NEW)
├── .gitignore                            # (NEW)
├── .github/
│   └── workflows/
│       └── ci.yml                        # (NEW)
├── CLAUDE.md                             # 기존 (6,7장 추가됨)
└── REVIEW.md                             # 기존
```

---

## Task 1: GitHub 레포 생성 + Git 초기화

**Files:**
- Modify: 작업 디렉토리 (`/Users/sungjiwon/claude/2chi_v1`)

- [ ] **Step 1: 현재 디렉토리 상태 확인**

Run: `ls -la /Users/sungjiwon/claude/2chi_v1`
Expected: `CLAUDE.md`, `REVIEW.md`, `design_system/`, `files/`, `docs/` 가 보임. `.git/` 은 아직 없음.

- [ ] **Step 2: Git 초기화**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git init -b main
```

Expected: `Initialized empty Git repository in .../2chi_v1/.git/`

- [ ] **Step 3: GitHub 레포 생성**

`gh` CLI 인증됨 (account: sungsmith) 확인됨. private 레포로 생성:

```bash
gh repo create 2chi_v1 --private --source=. --remote=origin
```

Verify: `git remote -v` → origin 표시됨

- [ ] **Step 4: 커밋 (CLAUDE.md, REVIEW.md, 기존 문서 일괄)**

먼저 Task 2의 `.gitignore` 가 없으므로, 이 커밋에는 일단 문서만 포함:
```bash
git add CLAUDE.md REVIEW.md design_system/ files/ docs/
git status
```

Verify: 위 파일들만 staged. 신뢰 가능한 상태인지 확인.

```bash
git commit -m "chore: initial commit - 기획 문서, 디자인 시스템, 행동 지침"
```

- [ ] **Step 5: main 푸시**

```bash
git push -u origin main
```

Expected: main 브랜치가 GitHub에 푸시됨.

---

## Task 2: 모노레포 디렉토리 + .gitignore + 인프라 파일 이동

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Move: `files/docker-compose.yml` → `docker-compose.yml`
- Create: `backend/`, `frontend/`, `.github/workflows/` 디렉토리

- [ ] **Step 1: 디렉토리 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
mkdir -p backend/src/main/java/com/twochi backend/src/main/resources/db/migration backend/src/test/java/com/twochi
mkdir -p frontend
mkdir -p .github/workflows
```

Verify: `ls -la backend frontend .github` 모두 존재

- [ ] **Step 2: `.gitignore` 작성**

`.gitignore` 파일을 다음 내용으로 작성:

```
# ===== Env =====
.env
.env.local
.env.*.local
!.env.example

# ===== OS =====
.DS_Store
Thumbs.db

# ===== IDE =====
.idea/
.vscode/
*.iml
*.iws

# ===== Java / Gradle =====
backend/build/
backend/.gradle/
backend/out/
*.class
*.jar
!gradle/wrapper/gradle-wrapper.jar

# ===== Node / Next.js =====
frontend/node_modules/
frontend/.next/
frontend/out/
frontend/build/
frontend/dist/
frontend/.turbo/
frontend/npm-debug.log*
frontend/yarn-debug.log*
frontend/yarn-error.log*
frontend/.pnpm-debug.log*

# ===== Docker =====
postgres_data/
minio_data/
redis_data/
```

- [ ] **Step 3: `.env.example` 작성**

`.env.example` 파일을 다음 내용으로 작성:

```
# ===== Postgres =====
POSTGRES_DB=twochi
POSTGRES_USER=twochi
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5433   # 호스트 노출 포트 (호스트 Postgres 충돌 방지). 컨테이너 내부는 5432.

# ===== Backend (Spring Boot 가 읽음) =====
DB_HOST=localhost
DB_PORT=5433
DB_NAME=twochi
DB_USER=twochi
DB_PASSWORD=changeme
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=local

# ===== MinIO =====
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001

# ===== Redis =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# ===== Frontend =====
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

- [ ] **Step 4: docker-compose.yml + V1__init_schema.sql 이동**

```bash
git mv files/docker-compose.yml docker-compose.yml
git mv files/V1__init_schema.sql backend/src/main/resources/db/migration/V1__init_schema.sql
```

Verify: `ls files/` 에 두 파일 사라짐. `ls backend/src/main/resources/db/migration/` 에 V1 보임.

- [ ] **Step 5: 인프라 기동 확인**

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Expected: `twochi-postgres`, `twochi-minio`, `twochi-redis` 가 `healthy` 또는 `running` 상태.

확인 후 정지:
```bash
docker compose down
```

- [ ] **Step 6: 이미 커밋된 .DS_Store 제거**

Task 1 에서 `.DS_Store` 가 일부 커밋됐으므로 .gitignore 작성 후 untrack:

```bash
git rm --cached docs/.DS_Store docs/portfolio/.DS_Store files/.DS_Store 2>/dev/null || true
find . -name '.DS_Store' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null
```

Verify: `git ls-files | grep DS_Store` → 출력 없음

- [ ] **Step 7: 커밋**

```bash
git add .gitignore .env.example docker-compose.yml backend/src/main/resources/db/migration/V1__init_schema.sql
git status
```

Verify: `.env` 는 staged 되지 않음 (gitignore 작동 확인). `.DS_Store` 들이 deleted (staged) 상태.

```bash
git commit -m "chore: 모노레포 디렉토리 + .gitignore + 인프라 파일 이동"
```

---

## Task 3: Spring Boot 백엔드 스켈레톤 (Spring Initializr 사용)

**Files:**
- Create (Initializr 생성): `backend/build.gradle.kts`, `backend/settings.gradle.kts`, `backend/gradlew`, `backend/gradle/wrapper/*`, `backend/src/main/java/com/twochi/TwochiApplication.java`, `backend/src/test/java/com/twochi/TwochiApplicationTests.java`
- Replace: `backend/src/main/resources/application.properties` → `backend/src/main/resources/application.yml`
- Delete: `backend/.gitignore` (루트 .gitignore 사용)

**노트:** Spring Security, JWT, Redis 는 5.1 auth-signup 플랜에서 추가. 지금은 컨텍스트가 뜨는 최소 스켈레톤.

- [ ] **Step 1: Spring Initializr API 로 스켈레톤 zip 다운로드**

```bash
cd /Users/sungjiwon/claude/2chi_v1
curl -G https://start.spring.io/starter.zip \
  -d type=gradle-project-kotlin \
  -d language=java \
  -d bootVersion=3.5.6 \
  -d baseDir=backend \
  -d groupId=com.twochi \
  -d artifactId=twochi \
  -d name=twochi \
  -d packageName=com.twochi \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,validation,postgresql,flyway,lombok \
  -o /tmp/twochi-backend.zip
```

Verify: `ls -la /tmp/twochi-backend.zip` 존재 + 파일 크기 > 50KB

- [ ] **Step 2: zip 압축 해제 (V1__init_schema.sql 보존)**

압축 해제 시 backend/ 이미 존재하므로 Task 2 에서 만든 `backend/src/main/resources/db/migration/V1__init_schema.sql` 가 덮어써지지 않도록 주의. zip 내부에는 db/migration 이 없으므로 안전하지만, 안전하게 임시 디렉토리로 풀고 rsync 한다.

```bash
unzip -q /tmp/twochi-backend.zip -d /tmp/twochi-init
rsync -a --exclude='.gitignore' /tmp/twochi-init/backend/ backend/
rm -rf /tmp/twochi-init /tmp/twochi-backend.zip
```

Verify:
- `backend/build.gradle.kts` 존재
- `backend/gradlew` 존재 (실행 권한 +x)
- `backend/src/main/java/com/twochi/TwochiApplication.java` 존재
- `backend/src/main/resources/db/migration/V1__init_schema.sql` 그대로 존재 (Task 2 에서 이동한 파일)

- [ ] **Step 3: build.gradle.kts 검증 + 필요 시 보정**

`backend/build.gradle.kts` 를 읽어서 다음이 들어 있는지 확인:

- `id("org.springframework.boot") version "3.5.6"` (또는 Initializr 가 반환한 최신 stable)
- `implementation("org.springframework.boot:spring-boot-starter-web")`
- `implementation("org.springframework.boot:spring-boot-starter-data-jpa")`
- `implementation("org.springframework.boot:spring-boot-starter-validation")`
- `runtimeOnly("org.postgresql:postgresql")`
- `implementation("org.flywaydb:flyway-core")`
- 그리고 Spring Boot 3.x + Postgres 17 호환 위해 `implementation("org.flywaydb:flyway-database-postgresql")` 추가 필요할 수 있음 — 없으면 다음 블록 안에 추가:

```kotlin
dependencies {
    // ... 기존 의존성 유지 ...
    implementation("org.flywaydb:flyway-database-postgresql")
}
```

Java 버전: `JavaVersion.VERSION_17` 인지 확인. 호스트 JDK 21 이어도 17 바이트코드로 컴파일됨.

- [ ] **Step 4: application.properties → application.yml 로 변경**

Initializr 는 application.properties 를 생성하므로 yml 로 교체.

```bash
rm backend/src/main/resources/application.properties
```

`backend/src/main/resources/application.yml` 작성:

`backend/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: twochi
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/${DB_NAME:twochi}
    username: ${DB_USER:twochi}
    password: ${DB_PASSWORD:changeme}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    open-in-view: false
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

server:
  port: ${SERVER_PORT:8080}

logging:
  level:
    root: INFO
    com.twochi: DEBUG
```

- [ ] **Step 6: 스모크 테스트 확인**

Initializr 가 자동 생성한 `backend/src/test/java/com/twochi/TwochiApplicationTests.java` 의 `contextLoads()` 가 있는지 확인. 없으면 다음과 같이 작성:

```java
package com.twochi;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TwochiApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 7: 인프라 기동 후 테스트 실행**

```bash
cd /Users/sungjiwon/claude/2chi_v1
docker compose up -d postgres
cd backend
./gradlew test --info
```

Expected: `BUILD SUCCESSFUL`. Flyway 가 V1__init_schema.sql 을 적용하고 컨텍스트가 뜸.

만약 `column or table not found` 에러 발생 시 V1 스키마 적용 실패. `docker compose down -v` 후 다시 시도.

테스트 완료 후:
```bash
cd ..
docker compose down
```

- [ ] **Step 8: 커밋**

```bash
git add backend/
git status
```

Verify: `backend/build/`, `backend/.gradle/` 은 staged 되지 않음.

```bash
git commit -m "feat(backend): Spring Boot 스켈레톤 + Flyway 마이그레이션 연결"
```

---

## Task 4: Next.js 프론트엔드 스켈레톤

**Files:**
- Create: `frontend/package.json` (via create-next-app)
- Create: `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`
- Create: `frontend/src/styles/tokens.css` (design_system/tokens.css 복사)

- [ ] **Step 1: create-next-app 실행**

```bash
cd /Users/sungjiwon/claude/2chi_v1
npx --yes create-next-app@latest frontend \
  --typescript \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-tailwind \
  --use-npm
```

Expected: `frontend/` 안에 Next.js 14+ 스켈레톤 생성. node_modules 설치됨.

- [ ] **Step 2: 디자인 토큰 복사**

```bash
mkdir -p /Users/sungjiwon/claude/2chi_v1/frontend/src/styles
cp /Users/sungjiwon/claude/2chi_v1/design_system/tokens.css /Users/sungjiwon/claude/2chi_v1/frontend/src/styles/tokens.css
```

Verify: `frontend/src/styles/tokens.css` 존재.

- [ ] **Step 3: globals.css 수정**

`frontend/src/app/globals.css` 를 다음 내용으로 **덮어쓰기**:

```css
@import "../styles/tokens.css";

html, body {
  padding: 0;
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text-primary);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 4: page.tsx 수정 (스켈레톤 랜딩)**

`frontend/src/app/page.tsx` 를 다음 내용으로 덮어쓰기:

```tsx
export default function Home() {
  return (
    <main style={{ padding: "var(--space-12)" }}>
      <h1 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-page-title)" }}>
        2chi · 이취
      </h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        취업·이직 올인원 워크스페이스. v1 셋업 완료.
      </p>
    </main>
  );
}
```

**노트:** 실제 페이지는 5.1+ 에서 design_system/index.html 의 컴포넌트 스펙을 따라 만든다. 지금은 토큰이 import 되는지 확인하는 스켈레톤.

- [ ] **Step 5: layout.tsx 한국어 lang 설정**

`frontend/src/app/layout.tsx` 의 `<html lang="en">` → `<html lang="ko">` 로 수정:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2chi · 이취",
  description: "취업·이직 올인원 워크스페이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: 빌드 검증**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
npm run build
```

Expected: `BUILD SUCCESSFUL`. 경고는 무시 가능.

- [ ] **Step 7: 개발 서버 기동 확인**

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속 → "2chi · 이취" 헤더가 hand-feel 폰트로 보임, 배경색 var(--color-bg) 적용 확인. (MemomentKkukkukk 폰트 파일은 design_system/uploads 에 있으므로 v1 초기엔 폴백 폰트 적용될 수 있음 — 추후 frontend/public 에 복사 시 적용.)

Ctrl+C 로 종료.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/
git status
```

Verify: `frontend/node_modules/`, `frontend/.next/` 는 staged 되지 않음.

```bash
git commit -m "feat(frontend): Next.js 스켈레톤 + 디자인 토큰 연결"
```

---

## Task 5: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: ci.yml 작성**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop, "feat/**", "fix/**"]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    name: Backend (Spring Boot)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: twochi
          POSTGRES_USER: twochi
          POSTGRES_PASSWORD: changeme
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U twochi -d twochi"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"

      - name: Gradle cache
        uses: gradle/actions/setup-gradle@v3

      - name: Test
        working-directory: backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: twochi
          DB_USER: twochi
          DB_PASSWORD: changeme
        run: ./gradlew test --no-daemon

      - name: Build (skip test)
        working-directory: backend
        run: ./gradlew build -x test --no-daemon

  frontend:
    name: Frontend (Next.js)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install
        working-directory: frontend
        run: npm ci

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Build
        working-directory: frontend
        run: npm run build
```

- [ ] **Step 2: 커밋**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions — backend test/build + frontend lint/build"
```

- [ ] **Step 3: main 푸시 후 CI 동작 확인**

```bash
git push origin main
```

GitHub 웹에서 Actions 탭 → CI 워크플로우 실행 확인. 두 잡(backend, frontend) 모두 ✅ 통과해야 함.

❌ 실패 시: 로그 확인 → 원인 수정 → 재커밋. (예: gradlew 실행 권한 문제면 `git update-index --chmod=+x backend/gradlew` 후 재커밋)

---

## Task 6: develop 브랜치 생성 + push

- [ ] **Step 1: develop 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout -b develop
```

- [ ] **Step 2: develop 푸시**

```bash
git push -u origin develop
```

Verify: GitHub 웹에서 `2chi-v1` 레포의 브랜치 목록에 `main`, `develop` 둘 다 표시됨.

- [ ] **Step 3: 기본 브랜치 develop 으로 변경 (선택)**

GitHub 웹 > Settings > Branches > Default branch → `develop` 선택.

이렇게 하면 PR 의 base 가 자동으로 develop 이 됨. main 직접 커밋 사고도 줄어듦.

- [ ] **Step 4: 셋업 완료 확인**

`git log --oneline --all` 로 확인:

```
chore: initial commit - 기획 문서, 디자인 시스템, 행동 지침
chore: 모노레포 디렉토리 + .gitignore + 인프라 파일 이동
feat(backend): Spring Boot 스켈레톤 + Flyway 마이그레이션 연결
feat(frontend): Next.js 스켈레톤 + 디자인 토큰 연결
ci: GitHub Actions — backend test/build + frontend lint/build
```

5건의 커밋이 main 과 develop 양쪽에 존재해야 함.

---

## 다음 단계

이 셋업이 끝나면 `feat/5.1-auth-signup` 브랜치를 develop 에서 분기하여 첫 기능 개발을 시작한다. 5.1 플랜은 별도 작성 예정 (Spring Security + JWT 도입, 회원가입/로그인 API, 프론트 로그인 화면 등).
