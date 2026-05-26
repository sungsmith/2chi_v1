# 2단계 PR 4번 (`feat/realign-company`) Spec

**브랜치 베이스**: `develop` (#19 머지됨, commit `a5ef7a1`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 company 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/company` cluster (채용공고 목록·등록·상세 / 기업분석 목록·입력·결과) 화면을 `design_system/project/ui_kits/web/screen-company.jsx` (747줄) + `screen-posting-new.jsx` (141줄) mock 과 픽셀 단위로 재정렬. cluster sidenav 를 mock 패턴 (`.side-nav` 클래스) 으로 정합. 미구현 화면 2개 (채용공고 상세 + 채용공고 등록 별도 라우트) 신규 추가.

---

## 2. 현 상태 진단

### 2.1 frontend 현재 company 구조

**Routes**:
- `(app)/company/layout.tsx` — `sidenav-rail` (inline style, 2-item nav)
- `(app)/company/postings/page.tsx` — postings-content (목록)
- `(app)/company/analysis/page.tsx` — analysis-list-content
- `(app)/company/analysis/new/page.tsx` — analysis-create-form
- `(app)/company/analysis/[id]/page.tsx` — analysis-detail-content

**Components** (13):
- `sidenav-rail` (inline style, generic)
- `postings-content` / `posting-card` / `posting-edit-modal` / `posting-fields` / `posting-manual-form` / `posting-tabs` / `posting-url-form` / `url-input-list`
- `analysis-create-form` / `analysis-detail-content` / `analysis-list-content` / `keyword-chip-list`
- `__tests__` 5 (analysis-create-form, analysis-detail-content, analysis-list-content, posting-card, postings-content)

### 2.2 mock screen-company.jsx (747줄)

**Cluster shell**:
- `CO_NAV` (line 8-12) — 2-item (`채용공고` + `기업분석`, 진행 공고 수 pill)
- `CompanySideNav` (line 22-43) — `.side-nav` + `.nav-item` + `.pill` 마크업

**Sub-views**:
- `PostingListView` (line 44-110) — 채용공고 목록
- `CompanyAnalysisView` (line 112-311, ~200줄) — 기업분석 결과
- `AnalysisListView` (line 313-374) — 기업분석 목록
- `PostingNewScreenEmbedded` (line 439-444) — embedded posting 등록 (PostingNewScreen wrapper)
- `PostingDetailView` (line 446-650, **~200줄, 신규**) — 채용공고 상세
- `CompanyAnalysisEntry` (line 651-746) — 기업분석 입력

### 2.3 mock screen-posting-new.jsx (141줄)

`PostingNewScreen` — 채용공고 등록 별도 화면 (URL paste / manual / v2-locked search 탭).

### 2.4 핵심 차이 + 결정

| # | 차이 | 결정 |
|---|---|---|
| 1 | sidenav-rail (inline style) ↔ mock `.side-nav` 클래스 패턴 | **`co-side-nav.tsx` 신규** (cover-letters 의 cl-sub-tabs 와 유사 패턴). 기존 sidenav-rail 은 사용처 0 확인 후 삭제 |
| 2 | mock `PostingDetailView` frontend 미구현 (목록만, 상세 없음) | **`/company/postings/[id]` 신규 라우트 + `PostingDetailContent` 컴포넌트**. BE `fetchPosting(id)` API 이미 존재 (frontend `lib/api/posting.ts`). mock 마크업 (line 446-650) |
| 3 | 채용공고 등록 — frontend 는 modal (`PostingEditModal`), mock 은 별도 화면 | **`/company/postings/new` 신규 라우트**. 기존 form 컴포넌트 (posting-tabs / posting-url-form / posting-manual-form / posting-fields) 재활용. modal 은 편집용 (`PATCH`) 으로만 유지 |
| 4 | 기업분석 결과 (CompanyAnalysisView ~200줄) 마크업 ↔ frontend `analysis-detail-content` | 마크업 mock 정렬. keyword-chip-list 재활용 |
| 5 | 기업분석 입력 (CompanyAnalysisEntry) 마크업 ↔ frontend `analysis-create-form` | 마크업 mock 정렬 |
| 6 | 기업분석 목록 (AnalysisListView) 마크업 ↔ frontend `analysis-list-content` | 마크업 mock 정렬 |

### 2.5 데이터 의존성

- **PostingListView**: 기존 5.5 `fetchPostings()` API 재활용
- **PostingDetailView**: 기존 `fetchPosting(id)` API 재활용 (BE/FE 모두 있음)
- **PostingNewContent**: 기존 5.5 `createPosting()` + `parsePosting(url)` API 재활용
- **AnalysisListView**: 기존 5.9 analysis API 재활용
- **CompanyAnalysisEntry / View**: 기존 5.9 API 재활용 — 마크업만 mock 정렬

---

## 3. 변경 파일 (~30)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(app)/company/postings/new/page.tsx` | 채용공고 등록 라우트 |
| `frontend/src/app/(app)/company/postings/[id]/page.tsx` | 채용공고 상세 라우트 |
| `frontend/src/components/company/co-side-nav.tsx` | mock CompanySideNav (.side-nav 클래스, 2-item + pill) |
| `frontend/src/components/company/posting-detail-content.tsx` | mock PostingDetailView (line 446-650) |
| `frontend/src/components/company/posting-new-content.tsx` | mock PostingNewScreen — 기존 form 컴포넌트 wrap |
| `frontend/src/lib/mock/company.ts` | (필요 시) POSTINGS_NAV_PILL_MOCK 등 |
| `frontend/src/components/company/__tests__/posting-detail-content.test.tsx` | render + 필드 + 액션 버튼 smoke test |
| `frontend/src/components/company/__tests__/posting-new-content.test.tsx` | render + tab 전환 smoke test |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(app)/company/layout.tsx` | sidenav-rail → co-side-nav |
| `frontend/src/components/company/postings-content.tsx` | mock PostingListView (line 44-110). "+ 등록" 버튼이 `/company/postings/new` 로 라우팅 |
| `frontend/src/components/company/posting-card.tsx` | mock posting-card 마크업 (회사·역할·src·dday·match·soon·closed) |
| `frontend/src/components/company/analysis-list-content.tsx` | mock AnalysisListView (line 313-374) |
| `frontend/src/components/company/analysis-create-form.tsx` | mock CompanyAnalysisEntry (line 651-746) |
| `frontend/src/components/company/analysis-detail-content.tsx` | mock CompanyAnalysisView (line 112-311) |
| `frontend/src/components/company/posting-tabs.tsx` / `posting-url-form.tsx` / `posting-manual-form.tsx` / `posting-fields.tsx` / `url-input-list.tsx` | mock PostingNewScreen 패턴 정합 |
| `frontend/src/styles/kit.css` | mock kit-company.css 의 .co-* selector port |
| `frontend/src/components/company/__tests__/*.test.tsx` (5) | 새 마크업 셀렉터 갱신 |

### Delete (확인 후)

- `frontend/src/components/company/sidenav-rail.tsx` (사용처 0 시 — cover-letters 에선 이미 제거됨, company 가 마지막 사용처)
- `frontend/src/components/company/posting-edit-modal.tsx` (별도 라우트로 신규 대체. 다만 편집은 modal 또는 별도 라우트 결정 필요 — 일단 보존, modal 유지)

---

## 4. Commit 분할 (9 task, dashboard/me/cover-letters 패턴)

1. **`refactor(co): cluster shell — co-side-nav + .side-nav 클래스`**
   - co-side-nav.tsx 신규 (mock CompanySideNav 마크업)
   - layout.tsx 갱신 (sidenav-rail → co-side-nav)
   - kit.css 의 .side-nav (이미 me PR 에서 port) 재사용
2. **`refactor(co): PostingListView 마크업 정렬`**
   - postings-content + posting-card mock 마크업 (line 44-110)
   - "+ 등록" 버튼 → `/company/postings/new` 링크
3. **`feat(co): PostingDetailView + /company/postings/[id] 신규`** (가장 무거운 task)
   - 신규 라우트 + posting-detail-content (mock line 446-650, ~200줄)
   - `fetchPosting(id)` 호출
   - smoke test
4. **`feat(co): PostingNewContent + /company/postings/new 별도 라우트`**
   - 신규 라우트 + posting-new-content wrapper
   - 기존 form 4-5 컴포넌트 (posting-tabs / posting-url-form / posting-manual-form / posting-fields / url-input-list) 재활용 + 마크업 mock 정합
   - smoke test
   - postings-content 의 modal create 흐름 → 별도 라우트로 이동 (modal 은 편집 시에만)
5. **`refactor(co): AnalysisListView 마크업 정렬`**
   - analysis-list-content mock (line 313-374)
6. **`refactor(co): CompanyAnalysisEntry 마크업 정렬`**
   - analysis-create-form mock (line 651-746)
7. **`refactor(co): CompanyAnalysisView 마크업 정렬`**
   - analysis-detail-content mock (line 112-311). keyword-chip-list 활용
8. **`chore(co): cluster-local 자산 정리 + kit.css port`**
   - sidenav-rail 삭제 (사용처 0 확인)
   - mock kit-company.css 의 잔여 selector port
9. **`test(co): 통합 테스트 갱신`** (필요 시)
   - task 2~7 의 it.skip 일괄 해제

각 commit 후 `npm run build` · `npm run test` 통과 보장.

---

## 5. 검증

### 5.1 자동 (CI 필수)

- `npm run lint` — 0 errors
- `npm run test` — 회귀 0
- `npm run build` — Compiled successfully (신규 2 routes 포함)

### 5.2 시각

- mock vs frontend dev 서버 비교 (6 routes)
- sidenav active pill, 채용공고 카드 dday/match/closed 상태, posting detail 의 dual-column, analysis 결과의 keyword chip

### 5.3 회귀 sanity

- 기존 5.5 posting CRUD 정상 (목록 + 등록 + 편집)
- 기존 5.9 analysis CRUD 정상 (목록 + 입력 + 결과)
- DEPRECATED `posting-edit-modal` 편집 흐름 동작

---

## 6. Out of scope (별도 issue)

- 채용공고 매칭률 알고리즘 개선 (현재 `matchPct` 는 mock 데이터)
- 기업분석 LLM 추출 v2 (현재 mock 텍스트)
- 채용공고 검색 (mock 의 v2-locked 탭 그대로 lock 유지)

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| postings-content 의 modal create → 별도 라우트 이동 시 기존 5.5 통합 테스트 회귀 | task 4 에서 modal 흐름 정리 + 통합 테스트 갱신. modal 자체는 편집용으로 보존 |
| PostingDetailView 신규 200+줄 마크업, mock 의 dual-column 레이아웃이 frontend 의 기존 dual-grid CSS 와 다를 가능성 | task 3 에서 kit-company.css 의 detail 관련 selector port + 시각 sanity |
| analysis-detail-content 마크업 변경으로 5.9 통합 테스트 셀렉터 회귀 | task 7 에서 임시 skip, task 9 에서 일괄 갱신 |
| sidenav-rail 삭제 시 다른 화면에서 사용 중일 가능성 | task 8 에서 grep 확인 후 0 인 경우만 삭제. 사용처 있으면 그 화면 cleanup PR 으로 분리 |

### 롤백

- 각 commit 단위 revert
- PR 전체 revert 시 develop 영향 0

---

## 8. Next step

이 spec 통과 → `superpowers:writing-plans` 로 9-commit task plan 작성.
