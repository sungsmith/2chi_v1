# 지원현황 Kanban 실배선 설계

> 베타 차단 #2. `/applications` Kanban 보드가 정적 mock(`KAN_COLS_MOCK`)을 렌더해 가짜 회사·하드코딩 카운트를 보여준다. Application BE CRUD는 이미 완비. 실 데이터로 배선한다(컬럼=활성 단계, 카드 클릭→단계 변경; 드래그는 v2).

## 1. 현황

- **FE mock:** `frontend/src/app/(app)/applications/page.tsx`가 `<KanbanView columns={KAN_COLS_MOCK} />` 렌더. `kanban-view.tsx`는 5컬럼(doc/code/int1/int2/exec) 하드코딩, Result 탭 카운트(7/7/2/3)·정렬 탭 정적, 드래그 미구현(카피만 있음).
- **BE(완비):** `ApplicationController` — `GET /api/v1/applications?stage=&result=`(목록), `GET /{id}`, `PATCH /{id}`(단계/결과 변경), `POST`(공고에서 생성), `DELETE`.
  - `Stage`(8): DOC_SUBMITTED, CODING_TEST, FIRST_INTERVIEW, SECOND_INTERVIEW, EXEC_INTERVIEW, NEGOTIATION, PASSED, FAILED.
  - `Result`(4): IN_PROGRESS, PASSED, FAILED, WITHDRAWN.
  - `ApplicationSummaryResponse`: `{ id, postingId, company, role, currentStage, currentResult, variantsCount, nextEvent, updatedAt }`.
  - `ApplicationPatchRequest`: `{ currentStage?, currentResult?, memo?, company?, role? }`.
- **배선 레퍼런스:** `calendar-content.tsx` + `@/lib/api/application`(`fetchApplications()`)가 이미 실 데이터를 가져와 쓰는 패턴. FE 타입(`@/lib/types/application`)에 `Stage`·`Result`·`STAGE_LABEL`·`RESULT_LABEL` 이미 정의됨.

## 2. 범위

**범위 안:**
- Kanban을 실 `fetchApplications()` 데이터로 렌더(컬럼 = **활성 단계**, Result 필터 탭).
- 카드 **클릭 → 단계(및 결과) 변경 → `PATCH`** (낙관적 업데이트 + 실패 시 되돌림).
- Result 탭 카운트·정렬을 실 데이터 기반으로.

**범위 밖 (v2):**
- 드래그 앤 드롭 단계 이동(dnd-kit). mock의 "드래그해 이동" 카피는 현재 인터랙션에 맞게 수정.
- 지원 생성 UI(지원은 공고 페이지의 "지원함"에서 생성 — 기존 흐름 유지).

## 3. 설계

### 3.1 컬럼 모델 (결정 A1)
- **컬럼 = 활성 단계 6개**: 서류(DOC_SUBMITTED) · 코딩테스트(CODING_TEST) · 1차면접(FIRST_INTERVIEW) · 2차면접(SECOND_INTERVIEW) · 임원면접(EXEC_INTERVIEW) · 처우협의(NEGOTIATION). 라벨은 `STAGE_LABEL` 사용.
- **종료 단계(PASSED/FAILED)는 별도 컬럼 없음.** 카드는 `currentStage`로 컬럼 배치.
- **Result 필터 탭**: 전체 / 진행중(IN_PROGRESS) / 합격(PASSED) / 불합격(FAILED). 탭이 표시 카드를 `currentResult`로 필터. 카운트 = 데이터에서 계산. 기본 탭 = 전체.
  - 종료 결과(합격/불합격) 카드도 자신의 `currentStage` 컬럼에 표시되며, 해당 탭 선택 시 노출.

### 3.2 단계 변경 인터랙션 (결정 B1)
- 카드 클릭 → **단계 변경 컨트롤**(경량 popover 또는 select; 단계 목록 = 6 활성 + 합격/불합격 선택지). 선택 시:
  - 낙관적으로 카드를 새 컬럼으로 이동(또는 결과 변경 반영),
  - `PATCH /{id}` (`currentStage`, 필요 시 `currentResult`) 호출,
  - 실패하면 원위치 + 에러 배너.
- 결과(합격/불합격) 변경도 같은 컨트롤에서 가능(단계=PASSED/FAILED 선택 시 결과 동기 또는 별도 토글). 구현 디테일은 plan에서 확정.

### 3.3 카드 / 보조 컨트롤
- 카드 매핑: `company`·`role`·D-day(있으면 `nextEvent` 기준)·`variantsCount` 배지·`updatedAt`(정렬용).
- 정렬 탭(최신순/마감순/회사명): 메모리 내 클라이언트 정렬.
- "지원 추가" 버튼: `/company/postings`로 이동(지원은 공고에서 생성) — 또는 제거. plan에서 확정.
- 빈 상태: 지원 0건이면 안내 + 공고로 가는 CTA.

### 3.4 파일
| 파일 | 작업 |
|---|---|
| `frontend/src/app/(app)/applications/page.tsx` | mock 주입 → 실 데이터 콘텐츠 컴포넌트 렌더(클라이언트). `KAN_COLS_MOCK` import 제거 |
| `frontend/src/components/applications/kanban-view.tsx` | props 기반 mock 렌더 → `fetchApplications()` + Stage 그룹핑 + Result 필터/카운트 + 단계변경 PATCH. (큰 변경이면 `kanban-content.tsx`로 분리, `kanban-view`는 presentational 유지) |
| `frontend/src/lib/mock/applications.ts` | 본 화면에서 미사용화(다른 참조 없으면 제거 — 확인 후) |
| `frontend/src/lib/api/application.ts` | 기존 `fetchApplications`·patch 사용. 누락 시 추가 |

## 4. 테스트
- `kanban`(content) 컴포넌트 테스트(vitest+RTL, api mock):
  - 실 데이터 → 카드가 올바른 단계 컬럼에 그룹핑.
  - Result 탭 클릭 → 필터링 + 카운트 정확.
  - 카드 단계 변경 → `patch`가 새 `currentStage`로 호출됨 + 낙관적 이동.
  - 빈 상태 렌더.
- 기존 calendar/application 테스트 회귀 없음.

## 5. 리스크
- 낙관적 업데이트 ↔ PATCH 실패 되돌림 로직이 유일한 복잡 지점 — calendar의 `refreshTick` 패턴 참고.
- mock 카드 shape ≠ `ApplicationSummary` → 매핑 누락 주의(타입은 이미 정의됨).

---

spec 통과 → `superpowers:writing-plans`.
