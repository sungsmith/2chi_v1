# 2chi v1 로컬 셋업 가이드 v0.1

> 본인 PC에서 v1 전체 스택을 띄우고, 지인이 외부에서 접속할 수 있도록 Cloudflare Tunnel로 공개 URL을 발급한다.
>
> **운영 형태**: 클로즈드 베타 (본인 + 지인 ~10명). 비용 0원.

- 작성일: 2026-05-08
- 작성자: 김소미
- 동봉 파일: `docker-compose.yml`, `.env.example`

---

## 1. 개요

### 1.1 운영 그림

```
┌──────────────────────────────────────────────────────────────┐
│                       본인 PC (Mac/Windows)                  │
│                                                              │
│   ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│   │  Next.js    │    │ Spring Boot  │    │ docker compose │  │
│   │  :3000      │◀──▶│  :8080       │◀──▶│  Postgres      │  │
│   │  (npm run   │    │  (./gradlew  │    │  MinIO :9000   │  │
│   │   dev)      │    │   bootRun)   │    │  Redis :6379   │  │
│   └─────────────┘    └──────────────┘    └────────────────┘  │
│         ▲                                                    │
│         │                                                    │
│   ┌─────┴──────────┐                                         │
│   │  cloudflared   │                                         │
│   │  tunnel        │                                         │
│   └─────┬──────────┘                                         │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │   https://xxxxx.trycloudflare.com  (or named tunnel)
          ▼
   ┌─────────────────┐
   │ 지인 외부 접속  │
   │ (휴대폰/노트북) │
   └─────────────────┘
```

### 1.2 무엇을 도커로, 무엇을 직접 실행?

- **인프라 컴포넌트(컨테이너)**: Postgres / MinIO / Redis
- **애플리케이션(호스트 직접 실행)**: Next.js 프론트 / Spring Boot 백엔드 — 핫리로드와 디버깅 편의 때문

### 1.3 v2 이전 용이성을 위한 원칙

- S3는 v1 MinIO → v2 AWS S3로 endpoint만 교체
- 환경변수는 모두 `.env`에 외부화 (코드 하드코딩 0)
- DB 스키마는 Flyway로 관리 (V1__init_schema.sql)
- 인프라 정의는 `docker-compose.yml` 한 파일에 응축

---

## 2. 사전 요구사항

| 항목 | 권장 버전 | 비고 |
|---|---|---|
| Docker Desktop (or OrbStack) | 최신 | macOS/Windows |
| Java | 17 LTS (또는 21) | Spring Boot 3.x |
| Node.js | 20 LTS | Next.js |
| Git | 최신 | - |
| cloudflared CLI | 최신 | Cloudflare 계정 필요 (무료) |
| Gmail 계정 | - | 메일 발송용 (앱 비밀번호 필요) |
| OpenAI API 키 | - | LLM 호출 |

설치 명령어 요약 (macOS / Homebrew 기준):

```bash
brew install --cask docker
brew install openjdk@17 node@20 cloudflared
```

---

## 3. 디렉토리 구조 권장

```
2chi/
├── docker-compose.yml             ← 본 산출물
├── .env                            ← .env.example을 복사 후 실제 값 입력
├── .env.example                    ← 본 산출물 (커밋 가능)
├── .gitignore                      ← .env, .DS_Store, node_modules 등 제외
├── backend/                        ← Spring Boot 프로젝트
│   ├── build.gradle
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │       └── V1__init_schema.sql   ← Flyway 마이그레이션
│   └── ...
├── frontend/                       ← Next.js 프로젝트
│   ├── package.json
│   ├── next.config.js
│   └── ...
└── docs/                           ← 본 가이드 및 기능 정의서 등
```

`.gitignore` 최소 항목:

```gitignore
# 환경변수 (절대 커밋 금지)
.env
.env.local

# 빌드 산출물
backend/build/
frontend/.next/
frontend/node_modules/
node_modules/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db
```

---

## 4. 첫 기동

### 4.1 환경변수 준비

```bash
cd 2chi
cp .env.example .env
```

`.env`를 열어 다음 값을 실제로 채운다:

- `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `REDIS_PASSWORD` — 강한 임의값
- `JWT_SECRET` — `openssl rand -base64 64` 결과 붙여넣기
- `ENCRYPTION_KEY` — `openssl rand -hex 32` 결과 붙여넣기
- `OPENAI_API_KEY` — OpenAI 콘솔에서 발급
- `MAIL_USERNAME` / `MAIL_PASSWORD` — Gmail + 앱 비밀번호 (4.2 참조)
- `DART_API_KEY` — 오픈DART에서 발급 (https://opendart.fss.or.kr/)
- `OAUTH_*` — 소셜 로그인 콘솔에서 발급 (당장 안 써도 됨)

### 4.2 Gmail 앱 비밀번호 발급

1. Google 계정 → 보안 → 2단계 인증 활성화
2. https://myaccount.google.com/apppasswords 접속
3. "메일" + "기타(2chi)" 선택 → 16자리 비밀번호 발급
4. `.env`의 `MAIL_PASSWORD`에 붙여넣기 (공백 제거)

### 4.3 인프라 기동

```bash
docker compose up -d
```

기동 확인:

```bash
docker compose ps
# postgres + minio + minio-init(완료) + redis 가 healthy 상태여야 함

# Postgres 접속
docker compose exec postgres psql -U twochi -d twochi -c "\dt"
# (V1 적용 전이라 비어있음. Spring Boot 기동 후 다시 확인하면 21개 테이블)

# MinIO 콘솔 열기
open http://localhost:9001
# 로그인: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD (.env 값)
# 버킷 확인: twochi-resume, twochi-portfolio, twochi-download
```

### 4.4 백엔드 기동

```bash
cd backend
./gradlew bootRun
# 첫 기동 시 Flyway가 V1__init_schema.sql 적용 → 21개 테이블 생성
# 적용 확인:
docker compose exec postgres psql -U twochi -d twochi \
  -c "SELECT version, description, success FROM flyway_schema_history;"
```

### 4.5 프론트엔드 기동

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

---

## 5. Cloudflare Tunnel — 외부 노출

지인이 외부에서 접속하려면 본인 PC를 인터넷에 노출해야 한다. WiFi 사설 IP는 같은 망에서만 동작하므로 Cloudflare Tunnel을 사용한다 (무료).

### 5.1 옵션 비교

| 옵션 | 비용 | 도메인 | 안정성 | 사용 시점 |
|---|---|---|---|---|
| **A. Quick Tunnel** | 무료 | 매번 임의 (`xxxxx.trycloudflare.com`) | 중 | 30분~몇 시간 테스트 |
| **B. Named Tunnel + 본인 도메인** | 도메인 등록비만 (연 1~2만원) | 고정 (`2chi.example.com`) | 높음 | 지인 클로즈드 베타 |
| **C. Cloudflare 무료 서브도메인** | 무료 | `*.trycloudflare.com` 영구 | 중 | (사실상 권장 X) |

→ **본인 도메인이 없다면 A로 시작**, 베타 사용자가 늘면 도메인 사서 B로 전환.

### 5.2 옵션 A — Quick Tunnel (즉시 발급, 무로그인)

가장 빠른 방법. 본인 PC 켜진 동안만 유효.

```bash
# 프론트엔드만 노출하는 경우
cloudflared tunnel --url http://localhost:3000

# 출력 예:
# Your quick Tunnel has been created! Visit it at:
#   https://random-words.trycloudflare.com
```

- 발급 URL을 지인에게 공유. 지인은 모바일/PC 어디서나 접속 가능.
- 본인 PC가 슬립되면 끊김. 다시 명령 실행 시 **새 URL 발급** (URL이 바뀌면 소셜 로그인 Redirect URI가 깨질 수 있음 — 5.4 참조).

**백엔드 API도 외부에서 호출되어야 하는 경우** (대부분 그렇다):

옵션 a) 프론트엔드에서 백엔드를 같은 도메인으로 프록시 (Next.js의 `rewrites`)

```js
// frontend/next.config.js
module.exports = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }];
  },
};
```

→ 프론트 도메인 하나만 노출하면 백엔드 호출은 같은 URL 안에서 처리됨.

옵션 b) 프론트와 백엔드를 각각 노출 (포트 2개를 별도 터널로) — 옵션 a 권장.

### 5.3 옵션 B — Named Tunnel (영구 도메인)

먼저 본인 도메인이 Cloudflare에 연결되어 있어야 함 (가비아·후이즈 등에서 도메인 구매 → Cloudflare DNS로 네임서버 변경).

```bash
# 1) 로그인 (브라우저 한 번 열림, 도메인 선택)
cloudflared tunnel login

# 2) 터널 생성 (이름은 자유)
cloudflared tunnel create twochi-v1

# 3) 라우팅 등록 (예: beta.your-domain.com)
cloudflared tunnel route dns twochi-v1 beta.your-domain.com

# 4) 설정 파일 작성: ~/.cloudflared/config.yml
```

`~/.cloudflared/config.yml` 예시:

```yaml
tunnel: twochi-v1
credentials-file: /Users/사용자명/.cloudflared/<터널-UUID>.json

ingress:
  - hostname: beta.your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# 5) 실행
cloudflared tunnel run twochi-v1

# 백그라운드 상시 실행은 launchd(macOS) / systemd(Linux) 등록
sudo cloudflared service install
```

이후 항상 `https://beta.your-domain.com`이 본인 PC의 3000번 포트로 연결된다.

### 5.4 소셜 로그인 Redirect URI

- **옵션 A (Quick Tunnel)**: URL이 매번 바뀌므로 매번 카카오/네이버/구글 개발자 콘솔에서 Redirect URI 갱신 필요 → 운영 부담 큼. 지인 테스트 시 소셜 로그인 비활성화하고 이메일 회원가입만 활성화하는 것 권장.
- **옵션 B (Named Tunnel)**: 고정 도메인이라 한 번만 등록하면 됨.

### 5.5 보안 권장

- Cloudflare 대시보드 → Zero Trust → Access → Self-hosted Application 추가
  - 인증 정책으로 **특정 이메일만 접근 허용** (Google 로그인 등). 지인 5명 이메일만 화이트리스트.
  - 클로즈드 베타의 보안을 한 단계 강화.
- 본인 PC 방화벽: cloudflared만 외부와 통신하므로 OS 방화벽은 닫아둬도 됨.

---

## 6. 운영 시나리오

### 6.1 매일 시작

```bash
# 한 줄로 인프라 기동
docker compose up -d

# 별도 터미널: 백엔드
cd backend && ./gradlew bootRun

# 별도 터미널: 프론트엔드
cd frontend && npm run dev

# 별도 터미널: 터널
cloudflared tunnel --url http://localhost:3000
# 또는 (named): cloudflared tunnel run twochi-v1
```

### 6.2 종료 / 정지

```bash
# 애플리케이션·터널은 Ctrl+C
# 인프라 정지 (데이터 유지)
docker compose down
```

### 6.3 데이터 백업 (지인 테스트 직전 권장)

```bash
# Postgres 덤프
docker compose exec postgres pg_dump -U twochi twochi \
  > backups/twochi_$(date +%Y%m%d_%H%M).sql

# MinIO 파일 백업 (mc 클라이언트)
mc mirror local/twochi-resume ./backups/twochi-resume_$(date +%Y%m%d)
```

### 6.4 데이터 완전 초기화 (개발 중에만)

```bash
docker compose down -v   # 볼륨 삭제
docker compose up -d
./gradlew bootRun        # V1 다시 적용
```

> 경고: 운영 환경에서는 절대 금지.

---

## 7. 트러블슈팅

### 7.1 `docker compose up -d` 실패 — 포트 충돌

```
Error: bind: address already in use
```

해결: 충돌 포트 변경. `.env`의 `POSTGRES_PORT`, `MINIO_API_PORT` 등을 다른 값으로 변경.

### 7.2 Flyway 체크섬 불일치

```
FlywayValidateException: Validate failed: Migration checksum mismatch
```

원인: 이미 적용된 V{n} 파일을 수정함.
해결: V1__init_schema.sql은 절대 수정 금지. 변경이 필요하면 V2__... 새 파일로.

### 7.3 MinIO 버킷 자동 생성 안 됨

```bash
# minio-init 컨테이너 로그 확인
docker compose logs minio-init

# 수동으로 다시 실행
docker compose up minio-init
```

### 7.4 Cloudflare Tunnel URL이 바뀜

매번 명령을 실행할 때마다 새 URL이 발급된다 (옵션 A). 매번 지인에게 새 URL을 공유해야 함. 자주 테스트한다면 옵션 B로 전환.

### 7.5 백엔드가 외부에서 호출 안 됨

원인: 프론트 코드에서 `http://localhost:8080`을 그대로 호출 → 지인 PC에서는 동작 안 함.
해결: `next.config.js`의 `rewrites`로 같은 도메인 안의 `/api/*`로 라우팅 (5.2 참조).

### 7.6 OAuth 로그인 시 "redirect_uri_mismatch"

원인: 카카오/네이버/구글 콘솔의 Redirect URI와 현재 Cloudflare Tunnel URL이 불일치.
해결: 콘솔에서 Redirect URI 갱신 또는 옵션 B(고정 도메인)로 전환.

### 7.7 Gmail SMTP 535 인증 오류

원인: 일반 비밀번호 사용. Gmail은 앱 비밀번호 필수.
해결: 4.2 절차로 앱 비밀번호 발급 후 `.env` 갱신.

### 7.8 본인 PC 사양 부족

- Postgres + MinIO + Redis + Spring Boot + Next.js 동시 실행은 RAM 8GB 이상 권장
- 부족하면 Redis 컴포즈 블록을 주석 처리하고 인메모리 캐시로 대체

---

## 8. v2 이전 시 변경 사항

v2 클라우드 배포로 넘어갈 때 본 셋업에서 바뀌는 부분:

| v1 | v2 |
|---|---|
| 본인 PC + Cloudflare Tunnel | AWS/NCP/Oracle Cloud + 본인 도메인 |
| docker compose의 Postgres | AWS RDS / NCP Cloud DB |
| MinIO | AWS S3 / NCP Object Storage (endpoint만 교체) |
| Redis (local) | AWS ElastiCache / NCP Redis |
| Gmail SMTP | AWS SES / Resend / 다른 메일 서비스 |
| cloudflared (수동 실행) | 클라우드 LB + 도메인 직결 |
| 환경변수 .env | AWS Secrets Manager / NCP Secret Manager |

`docker-compose.yml`은 v1 전용. v2에서는 Kubernetes 없이 단일 인스턴스 + Docker Compose 그대로 사용해도 충분 (Ops-Result 트랙 추가 자동화는 그 시점에 도입).

---

## 9. 다음 산출물

- `2chi_v1_privacy_policy_v0.1.md` — 클로즈드 베타에서도 필수인 개인정보처리방침·이용약관 초안
- `2chi_v1_prompt_catalog_v0.1.md` — 자소서 항목 × 직군 권장 구조 매트릭스의 실행 가능한 시스템 프롬프트 템플릿
- `2chi_v1_*.md` 시리즈 — 기존 docx 산출물의 Claude Code 친화 .md 변환본

---

**참고 산출물**

| 산출물 | 파일 |
|---|---|
| 기능 정의서 v0.3 | `2chi_v1_기능정의서_v0.3.docx` |
| ERD v0.1 + Mermaid | `2chi_v1_ERD_v0.1.docx` + `2chi_v1_ERD_diagram_v0.1.mermaid` |
| 와이어프레임 v0.1 | `2chi_v1_wireframes_v0.1.html` |
| 역량 매트릭스 v0.1 | `2chi_v1_competency_matrix_v0.1.xlsx` |
| 자소서 카탈로그 v0.1 | `2chi_v1_master_cover_letter_catalog_v0.1.docx` |
| Flyway 가이드 v0.1 | `2chi_v1_flyway_guide_v0.1.docx` |
| 초기 스키마 SQL | `V1__init_schema.sql` |
| 로컬 인프라 컴포즈 | `docker-compose.yml` |
| 환경변수 템플릿 | `.env.example` |
| 본 가이드 | `2chi_v1_local_setup_guide_v0.1.md` |
