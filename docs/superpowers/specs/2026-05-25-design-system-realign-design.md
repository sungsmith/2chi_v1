# design_system → frontend 픽셀 단위 재정렬

**브랜치 베이스**: `develop`
**작업 단위**: 1단계 공통 자산 1 PR + 2단계 화면별 8 PR (총 9 PR)
**작성일**: 2026-05-25

---

## 1. 배경

`design_system/` 디렉토리가 외부에서 재작업되어 폴더 구조와 내용이 모두 갱신되었다 (handoff 표준 형태로 한 단계 깊어짐, 컴포넌트·화면 mock 대폭 추가, 마스코트 PNG 6장 신규).

`frontend/` 는 5.1~5.9 동안 옛 design_system 을 기준으로 화면 9개를 구현했고, 그 사이 다수의 drift 가 누적됨.

이번 작업의 목적은 **frontend 의 기 구현 화면을 갱신된 design_system 의 mock (`project/ui_kits/web/screen-*.jsx`) 과 픽셀 단위로 재정렬**하는 것.

기능 추가/변경은 없다. 데이터 바인딩·API 호출·라우팅 로직은 그대로 유지하고, **마크업·CSS·아이콘·마스코트만 mock 에 맞춤**.

---

## 2. 현 상태 진단

### 2.1 design_system 변경 요약

- 경로 한 단계 깊어짐: `design_system/*` → `design_system/project/*`
- `design_system/README.md` 는 코딩 에이전트용 handoff 안내. **실제 가이드는 `design_system/project/README.md`** (249줄)
- `preview/` 27 → 60+개 (modal · toast · tabs · breadcrumb · stepper · dropdown-select · date-picker · file-upload · tag-input · inline-edit · command-palette · empty-states · skeleton-ai · avatars · banner · diff-viewer · pagination-filters · tooltip-popover · undo-toast · error-state)
- `ui_kits/web/` 화면 mock 7개 추가: `screen-dashboard` · `screen-me` · `screen-cover-letters` · `screen-company` · `screen-applications` · `screen-account` · `screen-error`
- 화면별 CSS 5개 추가: `kit-me.css` · `kit-cl.css` · `kit-company.css` · `kit-applications.css` · `kit-account.css`
- 마스코트가 CSS-drawn 에서 PNG 6 표현으로 교체 (`mascot-{default,wave,happy,think,excited,sleep}.png`)
- `scraps/` 에 `source-onboarding`, `source-posting-new` 추가

### 2.2 frontend ↔ design_system drift

| 자산 | frontend | design_system | 차이 |
|---|---|---|---|
| `colors_and_type.css` | 326줄 | 334줄 | ≈8줄 토큰 추가 |
| `kit.css` | 463줄 | 660줄 | ≈200줄 신규 컴포넌트 css 추가 |
| 마스코트 | 0장 | 6장 PNG | 전부 부재 |
| 공용 컴포넌트 | 3개 (button·checkbox·text-field) | 21+ | modal·toast·dropdown·date-picker·tag-input·stepper·tabs·breadcrumb 등 부재 |
| 아이콘 카탈로그 | cluster-local 4개 (dashboard·me·onboarding·event-chip) | 전역 `kit-icons.jsx` | 분산 → 통합 필요 |
| CSS 분할 정책 | route-local (`dashboard.css`·`me/career.css`·`onboarding/onboarding.css`) | cluster 단위 (`kit-me`·`kit-cl`·`kit-company`·`kit-applications`·`kit-account`) | 정책 불일치 |

### 2.3 화면 매핑

| frontend route | 매핑 mock |
|---|---|
| `(public)/onboarding` | `screen-onboarding.jsx` |
| `(public)/login`, `/signup` | `screen-account.jsx` (auth 파트) |
| `(app)/page` (홈 배너) | — (제거 → `/dashboard` redirect) |
| `(app)/(dashboard)` | `screen-dashboard.jsx` |
| `(app)/me`, `/me/career` | `screen-me.jsx` |
| `(app)/cover-letters` (목록) | `screen-cover-letters.jsx` |
| `(app)/cover-letters/master` | (5.6 폐기, 유지) |
| `(app)/cover-letters/variants/{new,[id]}` | `screen-cover-letter.jsx` |
| `(app)/company/postings`, `/company/analysis/*` | `screen-company.jsx` + `screen-posting-new.jsx` |
| `(app)/applications`, `/applications/calendar` | `screen-applications.jsx` |
| **신규** `(app)/mypage/{account,social,notifications,notification-center,withdraw}` | `screen-account.jsx` (myPage 파트) |
| **신규** `(app)/not-found`, `(app)/error` | `screen-error.jsx` |

---

## 3. 결정 사항

| 항목 | 결정 |
|---|---|
| 작업 단위 | 1단계(공통 자산 1 PR) → 2단계(화면별 8 PR) |
| 정렬 깊이 | 픽셀 단위 — mock JSX 마크업·className 구조 그대로 옮김. 데이터 바인딩·API 호출은 유지 |
| 화면 순서 | dashboard → me → cover-letters → company → applications → onboarding·auth → mypage → error |
| 5.6 마스터 자소서 | 폐기 상태 유지 (AI 초안 마스터 아이디어는 v2 백로그로 별도) |
| 추가 작업 | `(app)/page` → `/dashboard` redirect, error 404/500, mypage cluster 신규 |

---

## 4. 1단계 — 공통 자산 동기화 (`chore/design-system-sync`)

### 4.1 변경 파일

1. `frontend/src/styles/colors_and_type.css` ← `design_system/project/colors_and_type.css`
   - diff 확인 후 추가된 토큰만 머지
   - frontend-local 변형(있다면) 보존 검증
2. `frontend/src/styles/kit.css` ← `design_system/project/ui_kits/web/kit.css`
   - diff 확인 후 신규 selector 만 머지
   - 기존 selector specificity 충돌 시 보강
3. `frontend/public/mascot-{default,wave,happy,think,excited,sleep}.png` ← `design_system/project/assets/mascot-*.png` 복사 (6장)
4. `frontend/src/components/ui/icons.tsx` ← `design_system/project/ui_kits/web/kit-icons.jsx` 의 `Ico` 카탈로그를 TSX 로 옮김. 기존 cluster-local `icons.tsx` 4개는 2단계에서 점진 교체

> **공용 컴포넌트 21개 (modal·toast·dropdown-select·date-picker·tag-input·stepper·tabs·breadcrumb·mascot-cloud 등)** 는 1단계 PR scope 에서 제외. **각 화면 PR 에서 그 화면이 실제 사용할 때 정의** 한다. 사용처 없이 미리 만들면 props 시그니처가 추측 기반이 되어 2단계에서 다시 손보게 되고, 의미있는 TDD 도 불가능 (YAGNI). 화면 PR 마다 그 화면이 도입하는 공용 컴포넌트는 각 PR description 에 명시해서 다른 PR 과 중복 작업 회피.

### 4.2 검증

- `npm run build` 통과
- `npm run lint` 통과
- `npm run test` 회귀 0건 (화면 코드 미변경)
- 기 구현 화면 9개 sanity check — 토큰/CSS 변경으로 시각 회귀가 없는지 수동 확인
- 마스코트 PNG 직접 fetch 확인 (`/mascot-default.png` 등)

### 4.3 Out of scope

- 화면별 마크업 변경
- 마스코트의 실제 화면 사용
- 공용 컴포넌트 21개 정의 (각 화면 PR 에서 첫 사용 시 정의)

---

## 5. 2단계 — 화면별 PR (Option A, 총 8 PR)

각 PR 은 `develop` 분기. 앞 PR 머지 후 다음 PR 시작.

| # | 브랜치 | 화면 | 매핑 mock | 핵심 변경 |
|---|---|---|---|---|
| 1 | `feat/realign-dashboard` | `(app)/(dashboard)`, `(app)/page` | `screen-dashboard.jsx` | 마크업·CSS 픽셀 재현. `(app)/page` → `/dashboard` redirect. 마스코트 cloud(greeting) 도입. `dashboard.css` 삭제 → `kit.css` 클래스 |
| 2 | `feat/realign-me` | `(app)/me`, `/me/career` | `screen-me.jsx` | 7-section side-nav(기초/학력/자격증/경험/이력서/PRAR/포트폴리오) 정렬. PRAR cell·project card 마크업 mock 그대로. `me/career.css` → `kit-me.css` 도입 |
| 3 | `feat/realign-cover-letters` | `(app)/cover-letters`(목록), `/cover-letters/variants/{new,[id]}` | `screen-cover-letters.jsx` + `screen-cover-letter.jsx` | 목록(마스터/변형본 그룹핑) + 2-pane 에디터(AI hallucination 플래그·matched/gap 키워드) 픽셀 재현. `kit-cl.css` 도입 |
| 4 | `feat/realign-company` | `(app)/company/postings`, `/company/analysis/*` | `screen-company.jsx` + `screen-posting-new.jsx` | 채용공고 목록·등록(URL/manual/v2-locked 탭) + 기업분석 목록·상세. cluster 좌측 side-nav. `kit-company.css` 도입 |
| 5 | `feat/realign-applications` | `(app)/applications`, `/applications/calendar` | `screen-applications.jsx` | 캘린더(year/month/week/day) + 칸반 + 히스토리. `.sub-tabs` 콘텐츠 레벨 탭. `kit-applications.css` 도입 |
| 6 | `feat/realign-onboarding-auth` | `(public)/onboarding`, `/login`, `/signup` | `screen-onboarding.jsx` + `screen-account.jsx`(auth 파트) | 4-step onboarding split brand panel + welcome modal 픽셀 재현. login·signup 동일 톤. `kit-account.css` 도입 (auth 파트) + `onboarding/onboarding.css` 삭제 |
| 7 | `feat/mypage-cluster` | **신규** `(app)/mypage/{account,social,notifications,notification-center,withdraw}` | `screen-account.jsx`(myPage 파트) | 5-section side-nav cluster 신규. TopNav 프로필 드롭다운에서 진입. **UI mock-only — BE 작업은 별도 issue spawn** |
| 8 | `feat/error-pages` | **신규** `(app)/not-found.tsx`, `(app)/error.tsx`, `(public)/not-found.tsx`, `(public)/error.tsx` | `screen-error.jsx` | Next.js `not-found`/`error` boundary 로 404/500. 마스코트 sleep 표현 |

### 5.1 각 PR 공통 절차

1. mock JSX (`design_system/project/ui_kits/web/screen-*.jsx`) 와 해당 `kit-*.css` 를 읽어 마크업·className 구조 파악
2. frontend 컴포넌트를 동일 className 구조로 재작성 (props·state·API 호출은 기존 유지)
3. cluster-local CSS·icons 삭제 + 신규 `kit-{cluster}.css` 와 전역 `Ico` 카탈로그로 교체 (동일 PR 안에서)
4. 통합 테스트 갱신 — DOM 셀렉터가 className 기반이면 그대로, 텍스트 기반이면 mock 카피로 갱신 (mock 이 정답)
5. `npm run build`·`npm run lint`·`npm run test` 통과
6. dev server 띄워 mock 과 시각 비교 (사람 확인)
7. PR description 에 mock 스크린샷 vs frontend 스크린샷 첨부

### 5.2 cluster-local 자산 처리

- **CSS**: 각 화면별 PR 안에서 frontend-local CSS 삭제 + design_system `kit-{cluster}.css` 를 `frontend/src/styles/kit-{cluster}.css` 로 신규 추가. root layout 또는 `globals.css` 에서 한 번에 import (mock 의 `index.html` 패턴 따라감)
- **icons**: 1단계에서 만든 `components/ui/icons.tsx` (전역 `Ico`) 로 교체 후 cluster-local 파일 삭제

---

## 6. 테스트 · 검증 정책

### 6.1 자동 (각 PR CI 필수)

- `npm run build` — Next.js 빌드
- `npm run lint` — ESLint
- `npm run test` — Vitest (cluster 별 통합 테스트 포함)
- 회귀 0건. 갱신이 필요한 테스트는 같은 PR 안에서 갱신, 정당화는 PR description 에 명시

### 6.2 시각 (각 PR description 첨부)

1. `cd design_system/project/ui_kits/web && open index.html` → 해당 screen 스크린샷
2. `cd frontend && npm run dev` → 해당 route 스크린샷
3. 나란히 첨부. 미세 차이는 follow-up issue spawn

### 6.3 수동 회귀 (각 PR)

- 해당 화면 핵심 user flow 1~2개 클릭 확인
- BE 연결 화면은 backend 띄워 API 호출 정상 확인

### 6.4 1단계 특이 검증

- 1단계는 화면 미변경 → 시각 회귀 0 이어야 함. 모든 cluster 화면 빠르게 클릭하며 sanity check
- 마스코트 PNG 직접 fetch 확인

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| `kit.css` 머지로 selector specificity 충돌 → 기존 화면 시각 회귀 | 1단계 PR 에서 모든 화면 sanity check. 회귀 발견 시 selector 보강 |
| 마스코트 PNG 경로 깨짐 (Next.js public/ 위치) | `kit.css` 의 `background-image: url('/mascot-*.png')` 경로 통일 |
| mock UI 데이터 형태 ↔ frontend 타입 불일치 | **frontend 타입 우선** (BE 가 정답). 마크업만 mock 따라가고 데이터 바인딩은 기존 시그니처 유지 |
| PR 7 (mypage) BE 부재로 화면이 동작 안함 | UI mock-only PR 임을 PR description 에 명시. BE 작업 별도 issue spawn |
| 9 PR 누적 conflict | 각 PR 머지 직후 다음 작업자 `git pull origin develop` 우선. PR 간 간격 짧게 |

### 7.1 롤백

- 1단계만 머지된 상태에서 회귀 발견 → revert (1 PR)
- 화면별 PR 중 하나에서 회귀 → 해당 PR 만 revert (다른 화면 영향 0)
- 누적 후 발견된 회귀 → 발견 화면 PR 만 revert + follow-up issue

### 7.2 중단 조건

- 1단계에서 token/kit.css 머지 후 sanity check 가 통과 못하면 → 즉시 revert. drift 원인 분석 후 design_system 자체를 손볼지 사용자와 재상의
- BE 변경이 필요한 화면 (mypage 등) 에서 BE 작업이 v1 스코프를 넘으면 → 그 PR 만 보류, 나머지 진행

---

## 8. Out of scope (이번 작업 아님)

- 5.6 마스터 자소서 부활 (AI 초안 마스터) — v2 백로그
- mypage cluster 의 BE 엔드포인트 구현 — 별도 issue
- 모바일 breakpoints — design_system 자체가 PC web first
- 관리자(Admin) 페이지 — v1 스코프 외
- 글로벌 `⌘K` 활성화 — design_system `command-palette.html` 컴포넌트는 정의만, 활성화는 별도 작업

---

## 9. Next step

이 spec 사용자 리뷰 후 `superpowers:writing-plans` skill 로 1단계 PR 의 task-by-task 구현 plan 작성. 2단계 8개 PR 은 각각 별도 spec/plan cycle.
