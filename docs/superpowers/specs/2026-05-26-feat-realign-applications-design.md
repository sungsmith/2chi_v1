# 2단계 PR 5번 (`feat/realign-applications`) Spec

**브랜치 베이스**: `develop` (#20 머지됨, commit `0eb91e1`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 applications 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/applications` cluster (캘린더 / 칸반 / 히스토리) 화면을 `design_system/project/ui_kits/web/screen-applications.jsx` (619줄) mock 과 픽셀 단위로 재정렬. cluster IA 를 mock 의 3-sub-tab (sidenav cluster + 4 calendar sub-view) 로 변경. 신규 sub-view 3개 (CalendarYear / CalendarWeek / CalendarDay) + HistoryView 추가.

캘린더 라이브러리 도입은 검토 후 미채택 — mock 의 단순 grid + click + modal 패턴이 라이브러리 (FullCalendar 등) 의 고급 기능 (드래그·리사이즈·반응형·충돌 stacking) 을 활용 안 함 + 디자인 override 부담 동일.

---

## 2. 현 상태 진단

### 2.1 frontend 현재 applications 구조

**Routes**:
- `(app)/applications/page.tsx` — applications-content (table 패턴)
- `(app)/applications/calendar/page.tsx` — calendar-content (month view 만)

**Components** (13, 1008줄):
- `applications-content / applications-table / applications-header / application-filters / application-edit-modal` (table 흐름)
- `calendar-content / calendar-grid / calendar-header / calendar-legend / day-cell / event-chip / event-create-modal / event-edit-modal` (calendar month 만)

### 2.2 mock screen-applications.jsx (619줄)

**Cluster shell**:
- `AP_NAV` (line 6-11) — 3-item (캘린더 / 칸반 / 히스토리)
- `ApSideNav` (line 12-30) — `.side-nav` + `.nav-item`

**Sub-views**:
- `CalendarView` (line 66-121) — 4-view 토글 + 메인
- `CalendarMonth` (line 190-230, ~40줄) — 주별 grid + day-cell + event-chip
- `CalendarYear` (line 231-280, ~50줄) — 12개월 mini grid + 이벤트 도트
- `CalendarWeek` (line 281-334, ~55줄) — 7일 × 시간 grid
- `CalendarDay` (line 335-401, ~65줄) — 시간 stack + event
- `EventDetailModal` (line 122-189)
- `STAGE_LEGEND` (line 31) + `CAL_EVENTS` (line 46) — mock 데이터
- `KAN_COLS` (line 402) + `KanbanView` (line 423-491)
- `HistoryRow` (line 492) + `HistoryView` (line 505-604)

### 2.3 핵심 차이 + 결정

| # | 차이 | 결정 |
|---|---|---|
| 1 | frontend `/applications` 가 table, mock 은 칸반 | **칸반으로 전환** (applications-content → KanbanView 패턴). table 흐름 제거 |
| 2 | mock calendar 가 4 view, frontend 는 month 만 | **4 sub-view 신규** (year / week / day 추가) + 기존 month 정렬 |
| 3 | mock `HistoryView` frontend 미구현 | **`/applications/history` 신규 라우트** + HistoryView (UI mock-only — BE history endpoint 별도) |
| 4 | mock `EventDetailModal` ↔ frontend event-edit-modal | mock 패턴 정렬 |
| 5 | cluster sidenav 없음 (frontend) ↔ mock `ApSideNav` | **`ap-side-nav.tsx` 신규** (`.side-nav` 재사용, me/company PR port) |
| 6 | mock view 토글 (year/month/week/day) | calendar-content 내부 view state + sub-tab |

### 2.4 데이터 의존성

- **CalendarView**: 기존 5.8 events API 재활용. mock CAL_EVENTS 형태와 frontend 타입 매핑
- **KanbanView**: 기존 applications API 재활용 (단계별 칼럼 분류)
- **HistoryView**: BE 미구현 → frontend mock JSON (HISTORY_MOCK)
- **EventDetailModal**: 기존 event API 재활용

---

## 3. 변경 파일 (~32)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(app)/applications/history/page.tsx` | 히스토리 라우트 |
| `frontend/src/components/applications/ap-side-nav.tsx` | mock ApSideNav (3-item) |
| `frontend/src/components/applications/kanban-view.tsx` | mock KanbanView (단계별 칼럼) |
| `frontend/src/components/applications/calendar-year.tsx` | mock CalendarYear (12개월 mini grid) |
| `frontend/src/components/applications/calendar-week.tsx` | mock CalendarWeek (7일 × 시간 grid) |
| `frontend/src/components/applications/calendar-day.tsx` | mock CalendarDay (시간 stack) |
| `frontend/src/components/applications/history-view.tsx` | mock HistoryView |
| `frontend/src/components/applications/history-row.tsx` | mock HistoryRow |
| `frontend/src/lib/mock/applications.ts` | KAN_COLS / HISTORY_MOCK / STAGE_LEGEND 등 |
| `frontend/src/components/applications/__tests__/kanban-view.test.tsx` | smoke test |
| `frontend/src/components/applications/__tests__/calendar-year.test.tsx` | smoke test |
| `frontend/src/components/applications/__tests__/calendar-week.test.tsx` | smoke test |
| `frontend/src/components/applications/__tests__/calendar-day.test.tsx` | smoke test |
| `frontend/src/components/applications/__tests__/history-view.test.tsx` | smoke test |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(app)/applications/layout.tsx` | 신규 (cluster shell + ap-side-nav). 현재 layout 부재 시 신규 생성 |
| `frontend/src/app/(app)/applications/page.tsx` | applications-content → kanban-view 도입 |
| `frontend/src/app/(app)/applications/calendar/page.tsx` | calendar-content + 4-view 토글 |
| `frontend/src/components/applications/applications-content.tsx` | **delete or 대체** (칸반으로 IA 전환). table 컴포넌트 5개 (applications-table, applications-header, application-filters, application-edit-modal) 도 사용처 0 시 삭제 |
| `frontend/src/components/applications/calendar-content.tsx` | 4-view 토글 추가 + CalendarMonth 분리 |
| `frontend/src/components/applications/calendar-grid.tsx` | calendar-month.tsx 로 rename + mock 정합 |
| `frontend/src/components/applications/calendar-header.tsx` | mock 패턴 정합 (view 토글 헤더 포함) |
| `frontend/src/components/applications/calendar-legend.tsx` | mock STAGE_LEGEND 정합 |
| `frontend/src/components/applications/day-cell.tsx` | mock day-cell 마크업 |
| `frontend/src/components/applications/event-chip.tsx` | mock event-chip 마크업 |
| `frontend/src/components/applications/event-create-modal.tsx` | mock 패턴 정합 (또는 EventDetailModal 와 통합) |
| `frontend/src/components/applications/event-edit-modal.tsx` | mock EventDetailModal 패턴 정합 |
| `frontend/src/styles/kit.css` | mock kit-applications.css 의 .ap-*, .cal-*, .kan-*, .hist-* selector port |

### Delete (확인 후)

- applications-table.tsx / applications-header.tsx / application-filters.tsx (table 흐름 제거 시 사용처 0)
- application-edit-modal.tsx (편집은 event-edit-modal 또는 modal 통합 시)

---

## 4. Commit 분할 (9 task, dashboard/me/cl/co 패턴)

1. **`refactor(ap): cluster shell — ap-side-nav + layout`**
2. **`refactor(ap): KanbanView 마크업 + /applications 칸반 전환`**
3. **`refactor(ap): CalendarMonth + calendar-content view 토글 셸`**
4. **`feat(ap): CalendarYear sub-view 신규`**
5. **`feat(ap): CalendarWeek + CalendarDay sub-view 신규`**
6. **`refactor(ap): EventDetailModal + event-create/edit modal 정합`**
7. **`feat(ap): HistoryView + /applications/history 신규 (UI mock-only)`**
8. **`chore(ap): cluster-local 자산 정리 (table 흐름 제거) + kit.css port`**
9. **`test(ap): 통합 테스트 갱신 (skip 0)`**

각 commit 후 `npm run build` · `npm run test` 통과 보장.

---

## 5. 검증

### 5.1 자동

- `npm run lint` — 0 errors
- `npm run test` — 회귀 0
- `npm run build` — Compiled successfully (신규 1 route + 기존 2 routes)

### 5.2 시각

- mock vs frontend dev 서버 비교 (3 routes + 4 calendar sub-view)
- 칸반 칼럼·카드, 캘린더 4 view 전환, history timeline

### 5.3 회귀 sanity

- 기존 5.8 events API + applications API 호출 정상
- application-edit-modal 흐름 (편집) 정상

---

## 6. Out of scope

- BE: history endpoint (`activity-log`)
- 캘린더 이벤트 드래그·리사이즈
- 모바일 반응형
- 라이브러리 도입 (FullCalendar 등 검토 후 미채택)

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| `/applications` table → 칸반 IA 전환으로 기존 5.8 통합 테스트 다수 회귀 | task 2 에서 임시 skip, task 9 에서 일괄 갱신 |
| 4 sub-view 신규로 calendar-content 의 view 토글 state 복잡 | task 3 에서 토글 셸 + state 분리. 각 view 컴포넌트 props 명확 |
| HistoryView UI mock-only — 실제 동작 안 함 | PR description 에 명시. BE 별도 issue spawn |
| table 컴포넌트 5개 (table, header, filters, edit-modal) 삭제 시 import 잔재 | task 8 grep 확인 후 삭제 |

### 롤백
- 각 commit 단위 revert
- PR 전체 revert 시 develop 영향 0

---

## 8. Next step

이 spec 통과 → `superpowers:writing-plans` 로 9-commit task plan 작성.
