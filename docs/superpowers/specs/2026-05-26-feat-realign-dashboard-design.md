# 2단계 PR 1번 (`feat/realign-dashboard`) Spec

**브랜치 베이스**: `develop` (1단계 PR `#15` 머지됨, commit `0b8500b`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 첫 화면)
**작성일**: 2026-05-26

---

## 1. 목적

`(app)/page.tsx` 의 dashboard 화면을 `design_system/project/ui_kits/web/screen-dashboard.jsx` mock 과 픽셀 단위로 재정렬. 마크업·className 구조를 mock 그대로 옮기되 데이터 바인딩·API 호출·라우팅 로직은 유지.

> 1단계 spec §5 표에 "(app)/page → /dashboard redirect" 라고 적혀 있으나 잘못된 매핑이었음 — frontend 는 `(app)/(dashboard)/` 별도 라우트 그룹이 없고 `(app)/page.tsx` 자체가 dashboard 화면. **redirect 불필요**.

---

## 2. 현 상태 진단

### 2.1 frontend 현재 dashboard 구조

`(app)/page.tsx` → `DashboardContent`:

1. `HomeBanner` (28줄, onboarding 미완료 사용자만 표시, inline style)
2. `Greeting` (55줄, tags 있음, **마스코트/aside 없음**)
3. `kpi-grid` — `KpiCompleteness` + `KpiCoverLetters` + `KpiInProgress`
4. `dual-grid` — `UpcomingPanel` + `TodayQuote`
5. `Shortcuts` (4개)

CSS: `frontend/src/app/(app)/dashboard.css` 788줄 (1단계에서 미변경)
Icons: `frontend/src/components/dashboard/icons.tsx` (cluster-local, 83줄)

### 2.2 mock screen-dashboard.jsx 구조 (180줄)

1. `.greet` — main 텍스트 + tags + **`aside.memo-paper` (mint tape + memo)**
2. `.kpi-grid` — 3 카드, **tone-mint / 기본 / tone-lav** 색 토큰
3. `.dual-grid` — `다가오는 일정` 패널 + **`매칭 분석` 패널 (match-ring + 부족 역량 TOP 3, 신규)**
4. `.shortcuts` — primary AI 1개 + tone-1/2/3 일반 3개

### 2.3 핵심 차이 3개 + 결정

| # | 차이 | 결정 |
|---|---|---|
| 1 | `HomeBanner` mock 에 없음 | design_system `banner` 컴포넌트로 리디자인 + 유지 (onboarding 안내 UX 가치) |
| 2 | `TodayQuote` 가 mock 에선 Greeting aside (memo-paper + tape) 로 통합 | TodayQuote 제거, Greeting 에 aside 추가 (mascot wave 도 통합) |
| 3 | mock 의 `매칭 분석 패널` 이 frontend 에 없음 (BE 도 없음) | **UI mock-only** — frontend mock JSON 으로 화면만 그림. BE matching endpoint 는 별도 issue spawn |

### 2.4 부수적 동기화

- KPI 3장 색 토큰: `tone-mint` (completeness), 기본 (cover-letters), `tone-lav` (in-progress)
- cluster-local `dashboard/icons.tsx` → 전역 `components/ui/icons.tsx` 로 교체 + 파일 삭제
- `dashboard.css` 788줄 → 0 (mock 의 kit.css 클래스로 완전 대체)
- 신규 ui 컴포넌트 2개: `banner.tsx`, `mascot-cloud.tsx` (1단계 spec 의 "2단계 첫 사용 시 정의" 정책 따름)

---

## 3. 변경 파일

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/components/ui/banner.tsx` | create | design_system banner 컴포넌트. variant (info/warn/...) + dismissible. `kit.css` 클래스 사용 |
| `frontend/src/components/ui/__tests__/banner.test.tsx` | create | render + variant + dismissible smoke test |
| `frontend/src/components/ui/mascot-cloud.tsx` | create | `<span className="mascot-cloud {size} {expression}"/>` 래퍼 (PNG 6 표현) |
| `frontend/src/components/ui/__tests__/mascot-cloud.test.tsx` | create | size·expression className 출력 smoke test |
| `frontend/src/lib/mock/dashboard.ts` | modify | `MATCH_RING_MOCK` (매칭률 + 메타), `GAPS_MOCK` (부족 역량 3건) 추가 |
| `frontend/src/components/dashboard/greeting.tsx` | modify | mock 의 main 텍스트 + tags + aside (memo-paper · tape · mascot wave) 통합. `Ico` 전역 사용 |
| `frontend/src/components/dashboard/today-quote.tsx` | **delete** | Greeting aside 로 통합됨 |
| `frontend/src/components/dashboard/match-panel.tsx` | create | mock 의 `.panel`. match-ring (conic-gradient) + gap-list 3건. MATCH_RING_MOCK + GAPS_MOCK 소비 |
| `frontend/src/components/dashboard/__tests__/match-panel.test.tsx` | create | render + 매칭률 % + GAPS 3건 표시 검증 |
| `frontend/src/components/dashboard/dashboard-content.tsx` | modify | TodayQuote → MatchPanel 교체. dual-grid 가 (UpcomingPanel · MatchPanel) |
| `frontend/src/components/dashboard/kpi-completeness.tsx` | modify | `tone-mint` 클래스 적용. bar-row 3행 마크업 확인 |
| `frontend/src/components/dashboard/kpi-in-progress.tsx` | modify | `tone-lav` 클래스 적용. stage chip 마크업 확인 |
| `frontend/src/components/dashboard/kpi-cover-letters.tsx` | modify | 기본 tone, mini-stats 3행 확인 |
| `frontend/src/components/dashboard/upcoming-panel.tsx` | modify | mock 의 `.sched-list` 마크업 그대로. `Ico.Calendar` |
| `frontend/src/components/dashboard/shortcuts.tsx` | modify | primary 1 + tone-1/2/3 3개. `Ico.Sparkle / Plus / Building / Calendar` |
| `frontend/src/components/dashboard/icons.tsx` | **delete** | 전역 `components/ui/icons.tsx` 로 대체 |
| `frontend/src/components/home/home-banner.tsx` | modify | inline style → `<Banner variant="info">` 컴포넌트 |
| `frontend/src/app/(app)/page.tsx` | modify | `import "./dashboard.css"` 제거 |
| `frontend/src/app/(app)/dashboard.css` | **delete** | 788줄 → 0. kit.css 의 클래스로 대체 |

---

## 4. Commit 분할 (Option C — 점진 + 항상 빌드 통과)

1. **`feat(ui): banner + mascot-cloud 컴포넌트`** — 신규 ui 2개 + smoke test 2개
2. **`feat(dashboard): match-panel 신규 + mock 데이터`** — MatchPanel + MATCH_RING_MOCK + GAPS_MOCK + test
3. **`refactor(dashboard): Greeting 에 aside 통합 + TodayQuote 제거`** — Greeting aside + TodayQuote 파일 삭제 + dashboard-content 일부 갱신
4. **`refactor(dashboard): KPI/Shortcuts/UpcomingPanel mock 정렬 + 전역 Ico 사용`** — KPI 3, Shortcuts, UpcomingPanel 마크업 정렬 + cluster-local icons.tsx 삭제
5. **`refactor(home): HomeBanner → Banner 컴포넌트`** — inline style → variant prop
6. **`chore(fe): dashboard.css 삭제 + dashboard-content 정리`** — page.tsx 의 import 제거 + dashboard.css 삭제 + DashboardContent 최종 정합
7. **`test(dashboard): 통합 테스트 갱신`** — 마크업 변경 따라 기존 테스트 갱신

각 commit 후 `npm run build`·`npm run test` 통과 보장.

---

## 5. 검증

### 5.1 자동 (CI 필수)

- `npm run build` — Compiled successfully
- `npm run lint` — 0 errors
- `npm run test` — 회귀 0. 갱신이 필요한 dashboard 통합 테스트는 commit 7 에서 갱신
- 매 commit 마다 위 3개 통과 보장 (중간 commit 빌드 깨지면 안 됨)

### 5.2 시각

- `cd design_system/project/ui_kits/web && open index.html` → dashboard 스크린샷
- `cd frontend && npm run dev` → `/` route 스크린샷
- PR description 에 mock vs frontend 나란히 첨부
- controller 가 push 전 수동 sanity 1회

### 5.3 회귀 sanity

- onboarding 미완료/완료 두 케이스 모두 표시 정상 (HomeBanner / Banner)
- KPI 데이터 + UpcomingPanel API 호출 정상
- Shortcuts 네 링크 모두 정확한 route 로 이동

---

## 6. Out of scope (별도 issue)

- BE matching analysis endpoint (스키마 · 알고리즘 · 테스트) — `feat: BE matching analysis (dashboard 매칭 분석 패널 데이터 소스)`
- 매칭 분석 "자세히" 클릭 시 상세 페이지
- `(app)/page` 가 dashboard 임을 명시하는 라우팅 문서화 (1단계 spec 의 잘못된 가정 retro)

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| dashboard.css 788줄 삭제 시 kit.css 로 cover 안 되는 selector 발견 | commit 6 직전에 dev 서버로 직접 확인. 발견 시 kit.css 에 patch 또는 frontend-local 보존 |
| Greeting aside 의 mascot-cloud PNG 표시 안됨 | 1단계에서 PNG path 검증 완료 (`/assets/mascot-wave.png`). 2단계 commit 1 의 mascot-cloud.tsx 테스트로 재확인 |
| MatchPanel 의 conic-gradient 가 일부 브라우저(Safari old)에서 렌더링 다름 | mock 자체가 conic-gradient 사용. 브라우저 차이는 mock-spec 따라감 |
| dashboard 통합 테스트 다수 깨짐 (특히 dashboard-content.test) | commit 7 에서 일괄 갱신. 셀렉터는 className 우선 |

### 롤백

- 매 commit 단위 revert 가능. PR 전체 revert 시 develop 영향 0 (1단계는 별개 PR)

---

## 8. Next step

이 spec 사용자 리뷰 → 통과 시 `superpowers:writing-plans` 로 7-commit task-by-task plan 작성.
