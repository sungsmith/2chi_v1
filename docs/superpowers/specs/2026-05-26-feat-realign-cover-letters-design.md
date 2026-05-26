# 2단계 PR 3번 (`feat/realign-cover-letters`) Spec

**브랜치 베이스**: `develop` (#18 retro 머지됨, commit `7458c6c`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 cover-letters 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/cover-letters` cluster (목록 / 휴지통 / 경력기술서 재구조화 / dual-pane 에디터) 화면을 `design_system/project/ui_kits/web/screen-cover-letters.jsx` + `screen-cover-letter.jsx` mock 과 픽셀 단위로 재정렬. cluster IA 를 mock 의 sub-tabs 3-tab 구조로 변경. 신규 sub-view (휴지통 + 경력기술서 재구조화) 는 **UI mock-only** 로 신규 추가.

---

## 2. 현 상태 진단

### 2.1 frontend 현재 cover-letters 구조

**Routes**:
- `(app)/cover-letters/layout.tsx` — `sidenav-rail` cross-category ("자소서" + "경력기술서" cross-link)
- `(app)/cover-letters/page.tsx` — list-content (변형본 목록, 5.7 작성)
- `(app)/cover-letters/master/page.tsx` — DEPRECATED redirect (5.6 폐기)
- `(app)/cover-letters/variants/new/page.tsx` — 작성 시작
- `(app)/cover-letters/variants/[id]/page.tsx` — 작성 편집

**Components** (14):
- `list-content` (변형본 목록)
- `item-type-list / master-content / master-editor / other-masters-list` (5.6 잔재, DEPRECATED 주석)
- `posting-cta-modal`
- `write-content / write-dual-pane / write-input-panel / write-validation-panel` (5.7 작성)
- `__tests__` 4 (list-content, master-content, validation-panel, write-content)

### 2.2 mock screen-cover-letters.jsx (420줄)

**Cluster shell** (sub-tabs 4-tab):
- `cl-list` — ClListView (line 79) — master + variant 두 그룹 카드
- `cl-trash` — TrashView (line 144) — 신규 휴지통 (TRASH_ITEMS line 138 mock 데이터)
- `cl-career-statement` — CareerStatementView (line 212) — 신규 경력기술서 재구조화 (POSTINGS_FOR_PICKER line 205)
- `cl-editor` — 에디터 진입 시 (별도 화면, screen-cover-letter.jsx)

**Helpers**:
- `CL_TABS` (line 8), `CL_FILTERS` (line 16)
- `MASTERS` (line 23), `VARIANTS` (line 30) — mock 데이터
- `ClCard` (line 43) — 자소서 카드 (master / variant 공용)
- `CoverLettersScreen` (line 384) — top-level (initialTab prop)

### 2.3 mock screen-cover-letter.jsx (197줄)

**Single editor view**:
- `DRAFT_PARAGRAPH` (line 6) — mock draft text
- `CoverLetterScreen` (line 19) — dual-pane (좌측 input panel + 우측 result panel with AI hallucination 플래그 + matched/gap 키워드)

### 2.4 핵심 차이 + 결정

| # | 차이 | 결정 |
|---|---|---|
| 1 | cluster IA: frontend `sidenav-rail` cross-category ↔ mock sub-tabs 4-tab | **sub-tabs 3-tab 채택** (목록 / 휴지통 / 경력기술서 재구조화). editor 는 별도 route (`/cover-letters/variants/{new,[id]}`) 유지, sub-tabs 에 포함 안 함 |
| 2 | mock 의 `cl-trash` sub-view frontend 미구현 | **신규 라우트 + UI mock-only** (`/cover-letters/trash`). TRASH_MOCK 데이터로 화면만. BE soft-delete endpoint 는 별도 issue |
| 3 | mock 의 `cl-career-statement` sub-view frontend 미구현 | **신규 라우트 + UI mock-only** (`/cover-letters/career-statement`). POSTINGS_FOR_PICKER_MOCK 데이터로 화면만. LLM 재구조화 service 는 별도 issue |
| 4 | mock ClListView 에 master + variant 두 그룹, frontend 는 5.6 폐기로 variant 만 | **master 카드도 mock 데이터로 화면만 표시** (disabled — 클릭 시 "준비중"). master CRUD 부활 + AI 초안은 별도 spec/PR |
| 5 | 5.7 dual-pane 에디터 마크업 ↔ mock screen-cover-letter.jsx 마크업 | **mock 마크업 픽셀 정렬**. write-* 4 컴포넌트 갱신 |
| 6 | sidenav-rail (cluster + cross-category) | mock 의 cluster shell (sub-tabs only) 로 정렬. cross-category "경력기술서" 링크 제거 (재구조화 sub-view 로 대체 가능, 또는 단순 제거) |

### 2.5 데이터 의존성

- **ClListView 의 variant 그룹**: 기존 5.7 variant API 재활용
- **ClListView 의 master 그룹**: frontend mock JSON (MASTERS_MOCK)
- **TrashView**: frontend mock JSON (TRASH_MOCK) — BE soft-delete endpoint 별도 issue
- **CareerStatementView**: frontend mock JSON (POSTINGS_FOR_PICKER_MOCK + LLM 결과 mock) — BE LLM service 별도 issue
- **Editor**: 기존 5.7 write API 재활용 — 마크업만 mock 정렬

---

## 3. 변경 파일 (~25)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(app)/cover-letters/trash/page.tsx` | 휴지통 신규 라우트 |
| `frontend/src/app/(app)/cover-letters/career-statement/page.tsx` | 경력기술서 재구조화 신규 라우트 |
| `frontend/src/components/cover-letters/cl-sub-tabs.tsx` | sub-tabs 컴포넌트 (3-tab) |
| `frontend/src/components/cover-letters/cl-card.tsx` | mock ClCard (master / variant 공용) |
| `frontend/src/components/cover-letters/trash-content.tsx` | mock TrashView (line 144-202) |
| `frontend/src/components/cover-letters/career-statement-content.tsx` | mock CareerStatementView (line 212-382) |
| `frontend/src/lib/mock/cover-letters.ts` | MASTERS_MOCK / TRASH_MOCK / POSTINGS_FOR_PICKER_MOCK / CL_FILTERS |
| `frontend/src/components/cover-letters/__tests__/trash-content.test.tsx` | render + 3건 표시 + restore 버튼 (disabled) |
| `frontend/src/components/cover-letters/__tests__/career-statement-content.test.tsx` | render + posting 선택 + 결과 영역 |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(app)/cover-letters/layout.tsx` | sidenav-rail 제거 → cluster shell (sub-tabs 도입) |
| `frontend/src/components/cover-letters/list-content.tsx` | master + variant 두 그룹 마크업 (mock ClListView 정렬) |
| `frontend/src/components/cover-letters/write-content.tsx` | mock CoverLetterScreen wrapping 정렬 |
| `frontend/src/components/cover-letters/write-dual-pane.tsx` | mock 의 dual-pane 마크업 (좌측 input + 우측 result) |
| `frontend/src/components/cover-letters/write-input-panel.tsx` | mock input panel 마크업 |
| `frontend/src/components/cover-letters/write-validation-panel.tsx` | mock result panel (AI hallucination 플래그 + matched/gap 키워드) |
| `frontend/src/components/cover-letters/posting-cta-modal.tsx` | mock posting-cta-modal 패턴 정합 |
| `frontend/src/styles/kit.css` | mock kit-cl.css 의 .cl-* selector port (sub-tabs / cl-card / trash / career-statement / dual-pane). cluster CSS 통합 |
| `frontend/src/components/cover-letters/__tests__/list-content.test.tsx` | 새 마크업 (master + variant 그룹) 셀렉터 갱신 |
| `frontend/src/components/cover-letters/__tests__/write-content.test.tsx` | 새 dual-pane 마크업 셀렉터 갱신 |
| `frontend/src/components/cover-letters/__tests__/validation-panel.test.tsx` | 새 result panel 마크업 셀렉터 갱신 |

### 유지 (5.6 잔재, 별도 PR 에서 부활)

- `(app)/cover-letters/master/page.tsx` (DEPRECATED redirect 유지)
- `master-content / master-editor / item-type-list / other-masters-list` (DEPRECATED 주석 유지, 5.6 부활 PR 에서 재사용)
- `master-content.test.tsx` (DEPRECATED 잔재 검증, skip 또는 그대로)

### Delete

- 없음 (5.6 잔재는 보존)

---

## 4. Commit 분할 (8 task, dashboard/me 패턴)

1. **`refactor(cl): cluster shell — sub-tabs 3-tab IA`**
   - layout.tsx 갱신 (sidenav-rail 제거 → cluster shell with sub-tabs)
   - cl-sub-tabs.tsx 신규 컴포넌트
   - kit.css 에 sub-tabs CSS port (있다면)
2. **`refactor(cl): ClListView 목록 정렬 — master + variant 그룹`**
   - list-content.tsx mock 마크업 (두 그룹)
   - cl-card.tsx 신규 (master / variant 공용)
   - mock/cover-letters.ts 에 MASTERS_MOCK / CL_FILTERS 추가
   - master 카드 disabled 처리 (클릭 시 placeholder)
3. **`feat(cl): TrashView + /cover-letters/trash 신규`**
   - trash/page.tsx + trash-content.tsx + TRASH_MOCK
   - smoke test
4. **`feat(cl): CareerStatementView + /cover-letters/career-statement 신규`**
   - career-statement/page.tsx + career-statement-content.tsx + POSTINGS_FOR_PICKER_MOCK
   - smoke test
5. **`refactor(cl): dual-pane 에디터 mock 정렬`** (가장 무거운 task)
   - write-content / write-dual-pane / write-input-panel / write-validation-panel 4 컴포넌트 마크업 정렬
   - mock 의 hallucination 플래그 + matched/gap 키워드 마크업
   - 일부 통합 테스트 임시 it.skip (task 8 에서 갱신)
6. **`refactor(cl): posting-cta-modal 정렬`**
   - mock posting-cta-modal 패턴과 비교 후 정합
7. **`chore(cl): cluster-local 자산 정리 + kit.css port`**
   - cluster-local icons import 정리 → 전역 `@/components/ui/icons`
   - cluster CSS (있다면) → kit.css 로 통합. dashboard.css / career.css 패턴
8. **`test(cl): 통합 테스트 갱신`**
   - task 5/6 에서 임시 skip 한 케이스 일괄 갱신
   - 신규 trash + career-statement 테스트 통합
   - skip 0건

각 commit 후 `npm run build` · `npm run test` 통과 보장.

---

## 5. 검증

### 5.1 자동 (CI 필수)

- `npm run lint` — 0 errors
- `npm run test` — 회귀 0
- `npm run build` — Compiled successfully

### 5.2 시각

- mock vs frontend dev 서버 비교 (4 routes: `/cover-letters`, `/cover-letters/trash`, `/cover-letters/career-statement`, `/cover-letters/variants/new`)
- sub-tabs 3-tab 정렬, master 카드 disabled, dual-pane editor hallucination 플래그

### 5.3 회귀 sanity

- 기존 `/cover-letters/variants/{new,[id]}` 직접 접근 정상
- 5.7 write API 호출 + 데이터 표시 정상
- DEPRECATED `/cover-letters/master` redirect 정상

---

## 6. Out of scope (별도 issue / 별도 PR)

- BE: cover-letter soft-delete (휴지통) endpoint + 30일 자동 삭제 schedule (`feat: BE cover-letter soft-delete`)
- BE: 경력기술서 재구조화 LLM service (`feat: BE career-statement LLM extraction`)
- **5.6 master CRUD 부활 + AI 초안 service** (`feat: cover-letter master 부활 + AI 초안`) — 사용자가 별도 spec/PR 로 결정
- 마이그레이션: 기존 5.6 사용자의 마스터 데이터가 있다면 (실제로는 베타 미배포라 0건) 처리

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| cluster IA 변경으로 사용자 bookmark `/cover-letters/master` 깨짐 | DEPRECATED redirect 유지 (변경 없음). 신규 sub-tab 라우트는 새 URL 이라 영향 없음 |
| sidenav-rail 제거로 cross-category "경력기술서" 진입 누락 | 헤더 메뉴의 "내 정보 > 경력기술" 진입 유지. 또는 cl-sub-tabs 의 "경력기술서 재구조화" sub-view 로 연결 (별 화면 가능) |
| write-* 4 컴포넌트 마크업 변경으로 5.7 작성 통합 테스트 다수 회귀 | task 5 에서 임시 skip, task 8 에서 일괄 갱신 |
| mock 의 ClListView 가 master + variant 두 그룹이라 frontend ClListView 구조 변경 시 list-content.test 회귀 | task 2 에서 셀렉터 갱신, task 8 에서 최종 정리 |
| BE 부재로 trash/career-statement 화면이 정적 — 실제 동작 안 함 | UI mock-only PR 명시. PR description 에 BE 별도 issue 명시. dev 서버에서 시각 sanity 만 |

### 롤백

- 각 commit 단위 revert 가능
- PR 전체 revert 시 develop 영향 0
- 5.6 잔재 컴포넌트 보존 — master 부활 PR 에서 재사용 가능

---

## 8. Next step

이 spec 통과 → `superpowers:writing-plans` 로 8-commit task plan 작성.
