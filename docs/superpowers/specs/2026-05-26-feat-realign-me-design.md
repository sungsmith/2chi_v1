# 2단계 PR 2번 (`feat/realign-me`) Spec

**브랜치 베이스**: `develop` (2단계 PR 1번 #16 머지됨, commit `d04a9eb`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 me 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/me`, `/me/career` (+ 신규 `/me/portfolio`) 화면을 `design_system/project/ui_kits/web/screen-me.jsx` mock 과 픽셀 단위로 재정렬. side-nav IA 를 mock 의 3-section (`profile · career · portfolio`) 으로 변경. 데이터 바인딩·API·기존 라우팅 로직은 가능한 유지하되, IA 변경 따라 일부 재라우팅.

> 1단계 spec §5 표의 "7-section side-nav (기초/학력/자격증/경험/이력서/PRAR/포트폴리오)" 는 잘못된 가정. mock 은 **3-section** (`profile · career · portfolio`). frontend 의 기존 7-item 은 mock 의 3-section 으로 통합되고, 각 section 안에 sub-section (예: profile 안의 기본/학력/자격증/경험/이력서) 으로 stacked.

---

## 2. 현 상태 진단

### 2.1 frontend 현재 me 구조

**Routes**:
- `(app)/me/page.tsx` — `useEffect` 로 `/me/career` redirect 만 함 (자체 화면 미구현)
- `(app)/me/career/page.tsx` — PRAR career view
- `(app)/me/layout.tsx` — 260px sidebar + main grid (inline style)
- `(app)/me/career.css` — **966줄**

**Components**:
- `side-nav.tsx` (120줄, **모두 inline style**) — 7-item: 기초정보 / 학력 / 자격증 / 경험 · 대외활동 / 이력서 / 경력기술 / 포트폴리오 링크 (대부분 disabled, 경력기술만 활성)
- `page-header.tsx` (23줄)
- `icons.tsx` (99줄, cluster-local)
- `career/` 11개 컴포넌트 (assistant-note, career-card, career-content, date-input, metric-chip, new-career-form, new-metric-form, new-project-form, prar-cell, project-card, tech-tag)
- `career/__tests__/career-content.test.tsx` (275줄)

### 2.2 mock screen-me.jsx 구조 (495줄)

**3-section nav** (line 9):
```js
const ME_NAV = [
  { id: "profile",    label: "내 정보" },
  { id: "career",     label: "경력기술", pill: "PRAR" },
  { id: "portfolio",  label: "포트폴리오" },
];
```

**Components** (mock 내부):
- `MeSideNav` (line 22) — `.side-nav` 클래스, 3-item
- `MePageHeader` (line 42) — eyebrow + title + sub 패턴
- `CareerMeta` (line 66)
- `CoachBanner` (line 80) — dismissible 안내 banner
- `ProfileView` (line 113-216) — 기본/학력/자격증/경험/이력서 sub-section (stacked, ~100 lines)
- `ListRow` (line 217-237) — generic row
- `PortfolioView` (line 238-310) — 외부 링크·파일 (~70 lines)
- `PrarCell`, `ProjectRow`, `CompanyBand` — career 전용
- `CareerView` (line 383-477) — 경력기술 메인
- `MeScreen` (line 479) — top-level

### 2.3 핵심 차이 + 결정

| # | 차이 | 결정 |
|---|---|---|
| 1 | side-nav IA: frontend 7-item ↔ mock 3-item | **mock 3-section 채택** — `/me` 가 ProfileView 자체 화면이 되고, sub-section (기본/학력/자격증/경험/이력서) 은 stacked |
| 2 | `/me/page.tsx` 가 redirect 만 (ProfileView 미구현) | redirect 제거, ProfileView 도입 |
| 3 | `/me/portfolio` 라우트 없음 + PortfolioView 미구현 | 신규 라우트 + 컴포넌트 + mock 데이터 |
| 4 | `side-nav.tsx` 가 inline style (mock 의 .side-nav 클래스 미사용) | mock 의 .side-nav 마크업으로 재작성 |
| 5 | `me/icons.tsx` (99줄, cluster-local) | 전역 `components/ui/icons.tsx` 로 교체 + 파일 삭제 |
| 6 | `career.css` 966줄 | dashboard.css 패턴 — selector cross-check 후 kit.css 로 port + 삭제 |
| 7 | `CoachBanner` (mock) | 1단계 PR 의 `Banner` 컴포넌트 활용 (variant + dismissible) |

### 2.4 데이터 의존성

- **ProfileView**: 기존 onboarding answer / career API 데이터 재활용. 부족 부분은 frontend mock JSON (PROFILE_MOCK)
- **PortfolioView**: BE 부재 → 전체 mock JSON (PORTFOLIO_MOCK)
- **CareerView**: 기존 career API 그대로 사용. 마크업만 mock 정렬
- BE 신규 endpoint (ProfileSummary aggregator, Portfolio CRUD) 는 **별도 issue spawn**

---

## 3. 변경 파일 (~28)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(app)/me/portfolio/page.tsx` | 신규 라우트 → PortfolioView |
| `frontend/src/components/me/profile-view.tsx` | mock line 113-216 ProfileView 마크업 |
| `frontend/src/components/me/portfolio-view.tsx` | mock line 238-310 PortfolioView 마크업 |
| `frontend/src/components/me/coach-banner.tsx` | mock 의 CoachBanner, ui/banner.tsx (variant=info, dismissible) 활용 |
| `frontend/src/lib/mock/me.ts` | PROFILE_MOCK, PORTFOLIO_MOCK 등 |
| `frontend/src/components/me/__tests__/profile-view.test.tsx` | render + sub-section 검증 |
| `frontend/src/components/me/__tests__/portfolio-view.test.tsx` | render + 링크/파일 리스트 검증 |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(app)/me/page.tsx` | redirect 제거 → ProfileView import + 렌더 |
| `frontend/src/app/(app)/me/layout.tsx` | grid container 를 mock 의 `.kit-amb` + `.kit-main` 패턴 또는 단순화 (inline style 제거) |
| `frontend/src/components/me/side-nav.tsx` | 3-section ME_NAV, `.side-nav` 클래스 마크업 (inline style 모두 제거) |
| `frontend/src/components/me/page-header.tsx` | mock 의 ME_TITLES 매핑 + `.page-head` 클래스 |
| `frontend/src/components/me/career/*` (11) | mock 의 CareerView (line 383-477) 마크업으로 정렬. CompanyBand · ProjectRow · PrarCell · ListRow 마크업 매핑 |
| `frontend/src/components/me/career/__tests__/career-content.test.tsx` | 마크업 변경 따라 셀렉터 갱신 |
| `frontend/src/styles/kit.css` | career.css 의 me-specific selector port (예: `.me-side`, `.profile-sub-head`, `.list-row` 등) |

### Delete

| 파일 | 사유 |
|---|---|
| `frontend/src/components/me/icons.tsx` | 전역 `components/ui/icons.tsx` 사용 |
| `frontend/src/app/(app)/me/career.css` | 966줄 → kit.css 로 통합 |

---

## 4. Commit 분할 (7 task, dashboard 패턴)

1. **`refactor(me): side-nav 3-section IA + .side-nav 클래스`**
   - side-nav.tsx inline style 제거 → mock 마크업
   - ME_NAV 3-item, page-header.tsx mock ME_TITLES 적용
   - /me/layout.tsx 갱신
2. **`feat(me): ProfileView 신규 + CoachBanner + mock 데이터`**
   - /me/page.tsx redirect 제거
   - ProfileView 컴포넌트, PROFILE_MOCK, CoachBanner (Banner 활용)
   - smoke test
3. **`feat(me): PortfolioView 신규 라우트`**
   - /me/portfolio/page.tsx
   - PortfolioView 컴포넌트, PORTFOLIO_MOCK
   - smoke test
4. **`refactor(me): CareerView 마크업 mock 정렬`** (가장 무거운 task)
   - 11 career 컴포넌트 mock 의 CareerView 마크업 정렬
   - CompanyBand · ProjectRow · PrarCell · ListRow 매핑
   - 기존 career-content.test 의 일부 it.skip (task 7 에서 갱신)
5. **`refactor(me): icons.tsx 제거 + 전역 Ico 사용`**
   - me/icons.tsx (99줄) 삭제
   - 모든 Ico import 를 `@/components/ui/icons` 로 교체
6. **`chore(fe): career.css 966줄 삭제 + kit.css port`**
   - dashboard.css 패턴 — selector cross-check + 사용처 확인 + port + delete
7. **`test(me): 통합 테스트 갱신`**
   - career-content.test 의 skip 모두 해제
   - profile-view·portfolio-view 신규 테스트
   - skip 0건

각 commit 후 `npm run build`·`npm run test` 통과 보장.

---

## 5. 검증

### 5.1 자동 (CI 필수)

- `npm run lint` — 0 errors
- `npm run test` — 회귀 0
- `npm run build` — Compiled successfully

### 5.2 시각

- mock vs frontend dev 서버 비교 (3 routes: `/me`, `/me/career`, `/me/portfolio`)
- side-nav 3-item 정렬, ProfileView sub-section stacked, CoachBanner dismissible 동작

### 5.3 회귀 sanity

- 기존 `/me/career` 직접 접근 정상
- career API 호출 + 데이터 표시 정상
- onboarding answer 가 ProfileView 에 정상 표시 (기존 데이터 재활용)

---

## 6. Out of scope (별도 issue)

- BE ProfileSummary aggregator endpoint (`feat: BE profile-summary aggregator`)
- BE Portfolio CRUD endpoint (`feat: BE portfolio CRUD`)
- 이력서 PDF export (mock 에도 없음)
- 1단계 spec §5 의 "7-section side-nav" retro 메모

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| frontend 의 기존 onboarding answer / career API ↔ ProfileView 데이터 형태 mismatch | task 2 에서 데이터 어댑터 작성. mock JSON 으로 fallback |
| `/me` redirect 제거 시 기존 bookmark 영향 | redirect 제거 = `/me` 가 ProfileView 표시. `/me/career` 는 그대로 동작. 회귀 0 |
| career.css 966줄 삭제 시 me-specific selector 가 kit.css 와 conflict | task 6 에서 dashboard.css 패턴으로 cross-check + 안전한 selector 만 port |
| career-content.test 275줄 갱신 부담 | task 4 에서 임시 skip, task 7 에서 일괄 갱신 |
| mock 의 ProfileView sub-section 데이터가 frontend 의 단편적 API 와 1:1 매핑 어려움 | UI mock-only 정책 따라 frontend mock JSON 으로 보충 — 데이터 어댑터는 단순하게 |

### 롤백

- 각 commit 단위 revert 가능
- PR 전체 revert 시 develop 영향 0 (다른 화면 PR 과 독립)

---

## 8. Next step

이 spec 통과 → `superpowers:writing-plans` 로 7-commit plan 작성.
