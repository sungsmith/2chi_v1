# Session Handoff — fix/career-inline-forms (brainstorming 중간)

작성일: 2026-05-20
브랜치: `fix/career-inline-forms` (커밋 0건 — 본 문서가 첫 커밋)
직전 develop: `9c448c8` (PR #8 design-system-v2 머지)

---

## 한 줄 요약

5.4 의 `window.prompt` 9건을 인라인 form 으로 교체. brainstorming 의 **설계 1/4 (컴포넌트 구조)** 까지 사용자 승인. 다음 세션은 설계 2/4 부터 이어가면 됨.

---

## 진행 상태

### Brainstorming 단계 (superpowers:brainstorming 스킬 흐름)

| 단계 | 상태 | 비고 |
|---|---|---|
| 1. 컨텍스트 탐색 | ✅ | preview/form-inputs.html + form-toggles.html 정독 |
| 2. Visual companion 제안 | (skip) | 직전 세션들과 동일하게 텍스트만 |
| 3. 클러리파잉 질문 | ✅ 3건 결정 | 아래 §결정 내역 |
| 4. 접근법 비교 | (skip — 자명) | 인라인 form 으로 합의됨 |
| 5. 설계 섹션 단위 승인 | **🟡 1/4 완료** | 다음 세션 시작 지점 |
| 6. spec 작성 + 커밋 | ⏸ pending | 5번 완료 후 |
| 7. self-review + 사용자 리뷰 | ⏸ | |
| 8. writing-plans 인계 | ⏸ | |

### 결정 내역 (3건)

1. **스코프**: `window.prompt` 9건만 교체. `window.confirm` 2건 (삭제 확인) 은 유지 — v1 클로즈드 베타에 적절·최소 설수.
2. **표시 방식**: **인라인 form** (modal 아님). 브랜치명 `fix/career-inline-forms` 가 합의 반영.
3. **메트릭 variant 선택 UI**: **radio (form-toggles.html 패턴)** — `○ 비교 (TPS 500 → 2000)` `○ 증감 (-₩2,000,000 ↓)`.

### 사용자가 승인한 설계 섹션

**설계 1/4 — 컴포넌트 구조**:

신규 3개 inline form 컴포넌트:
```
frontend/src/components/me/career/
├── new-career-form.tsx        # NEW — 회사 추가 폼 (인라인 카드)
├── new-project-form.tsx       # NEW — 프로젝트 추가 폼 (인라인 카드)
├── new-metric-form.tsx        # NEW — 메트릭 추가 폼 (chip 자리 morphing, radio variant)
│
├── career-content.tsx         # 수정 — "+회사 추가" 클릭 시 NewCareerForm 표시
├── career-card.tsx            # 수정 — "+프로젝트 추가" 클릭 시 NewProjectForm 표시
└── project-card.tsx           # 수정 — "+성과 지표 추가" chip 클릭 시 NewMetricForm morphing
```

원칙:
- 각 폼 컴포넌트는 props 만 (initialValues 없음, `onSubmit`/`onCancel`/`onError`).
- Parent 가 useState 로 폼 열림 상태 관리 + API 호출.
- 시안 `preview/form-inputs.html` 의 `.field` / `.lbl` / `.input` / `.helper` 클래스 사용 (kit.css 가 이미 제공).
- 메트릭 폼은 chip 한 칸 자리에서 morphing — horizontal layout.

### 남은 설계 섹션 (2~4)

**설계 2/4 — 폼 동작 (열기·저장·취소·검증)**:
- 열기: parent 의 `adding` state. true 일 때 form 표시. 첫 input 자동 포커스 (autofocus).
- 취소: form 의 onCancel → parent setAdding(false). 입력 버려짐.
- 저장: form 의 onSubmit → API 호출 (parent 가 처리) → 성공 시 setAdding(false). 실패 시 onError 호출 (top error banner — 5.4 에 이미 있음).
- 검증 (클라이언트 단):
  - **회사 폼**: company 필수 (빈 값 아님), startDate 필수 + ISO 형식 (YYYY-MM-DD). position/endDate 선택.
  - **프로젝트 폼**: title 필수, periodStart 선택 (있다면 ISO). periodEnd/role 선택.
  - **메트릭 폼**: k 필수. variant=compare 면 before/after 필수. variant=delta 면 delta 필수 + dir 선택 (기본 up).
- 에러 표시:
  - 필드별 helper.error (form-inputs 패턴) — 빈 값/형식 오류
  - 저장 실패 (API 에러) — parent 의 top error banner (기존 5.4 에 이미 있음)
- 키보드:
  - Enter (textarea 아닌 input 에서) → submit
  - Esc → cancel
- 날짜 입력: **type="text" placeholder="YYYY-MM-DD" + 클라 정규식 검증** (단순). type="date" 는 브라우저별 외관 다양해서 디자인 일관성 ↓ — 제외.

**설계 3/4 — 메트릭 폼 specifics**:
- Variant radio 2개 (compare / delta), 기본 compare 선택
- variant=compare 시 노출 필드: k(라벨) / before / after
- variant=delta 시 노출 필드: k / delta / dir (up/down radio, 기본 up)
- 저장 시 Metric 타입:
  - compare → `{ k, before, after }`
  - delta → `{ k, delta, dir }`
- 칩 자리에서 morphing — chip 의 max-width 보다 폼이 커야 함. row 전체 폭 차지 OR 폼 영역만 별도 row 로 잠시 점유.

**설계 4/4 — 테스트 회귀**:
- 신규 5케이스 권장:
  - new-career-form: 빈 company 시 disabled / submit 클릭 시 API 호출 / cancel 클릭 시 onCancel 호출
  - new-project-form: 동일 패턴
  - new-metric-form: variant 토글 / compare 저장 / delta 저장
- 또는 통합 테스트로: career-content.test.tsx 의 "회사 추가" / "프로젝트 추가" / "메트릭 추가" 흐름을 prompt mock 제거하고 form 입력 시뮬레이션
- 5.4 기존 5케이스 selector 조정 필요 (`screen.getByText("자소서 작성")` 같은 건 그대로, 그러나 `window.prompt` mock 제거 후 새 form 입력으로 대체)
- 전체 회귀: 42 (직전) → 신규 5 추가 또는 통합 갱신 후 42 유지

---

## 다음 세션 시작 방법

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout fix/career-inline-forms
git log --oneline -3   # 본 handoff 커밋만 있어야 함

# 본 handoff 문서 읽기
cat docs/superpowers/handoffs/2026-05-20-fix-career-inline-forms-handoff.md
```

새 세션에 다음 한 줄 입력:

> `docs/superpowers/handoffs/2026-05-20-fix-career-inline-forms-handoff.md` 읽고 설계 2/4 부터 이어가자

새 세션은:
1. handoff 문서 읽고 컨텍스트 복원
2. brainstorming 스킬 호출 (`/superpowers:brainstorming` 또는 skill invoke)
3. 설계 2/4 (폼 동작) 부터 사용자에게 제시
4. 2/4 → 3/4 → 4/4 승인 후 spec 작성

---

## 핵심 참조 파일

- **prompt 위치**: `frontend/src/components/me/career/{career-content,career-card,project-card}.tsx` (9 prompt + 2 confirm)
- **5.4 통합 테스트**: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (5 케이스, prompt mock 패턴 참고)
- **시안**: `design_system/preview/form-inputs.html` (39줄), `design_system/preview/form-toggles.html` (41줄)
- **베이스 CSS**: `frontend/src/styles/kit.css` 의 `.field` / `.input` / `.helper`
- **5.4 의 spec/plan**: `docs/superpowers/specs/2026-05-20-feat-5.4-me-career-design.md`, `docs/superpowers/plans/2026-05-20-feat-5.4-me-career.md`
- **API**: `frontend/src/lib/api/career.ts` (createCareer/createProject/patchProject)
- **타입**: `frontend/src/lib/types/career.ts` (`CareerCreateRequest`/`ProjectCreateRequest`/`Metric`)

---

## 직전 세션 머지 요약 (8 PR)

| PR | 브랜치 | 내용 | 머지 |
|---|---|---|---|
| #1 | feat/5.1-auth-signup | 회원가입 | ✅ |
| #2 | feat/5.1-auth-login | 로그인 | ✅ |
| #3 | feat/5.2-onboarding | 온보딩 | ✅ |
| #4 | feat/5.0-app-shell | 앱 셸 (TopNav, route 그룹) | ✅ |
| #5 | feat/5.3-dashboard | 대시보드 | ✅ |
| #6 | fix/5.2-onboarding-design | 온보딩 시안 정합 + doc.css 통합 | ✅ |
| #7 | feat/5.4-me-career | 경력기술 (PRAR) BE+FE | ✅ |
| #8 | chore/design-system-v2 | Claude Design hand-off 번들 통합 + FE migration | ✅ |

---

## 환경 메모

- BE/FE dev server 종료 상태
- CI workflow trigger 에 `chore/**` 가 제외돼 있음 (push 트리거). PR 생성 시에는 trigger 됨.
- frontend AGENTS.md: "Next.js you know 아니다" 경고 — 본 fix 는 기존 사용 API(`useState`/`form`/`onSubmit`) 만 사용 → 검증 불필요
- CLAUDE.md §7 새 정책: 디자인 시스템(HOW) ↔ 화면(WHAT) 분리. `preview/form-inputs.html` / `preview/form-toggles.html` 가 본 fix 의 시안 1차 정답.
