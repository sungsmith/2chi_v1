# Spec — fix/career-inline-forms (5.4 의 window.prompt → 인라인 폼 교체)

작성일: 2026-05-20
브랜치: `fix/career-inline-forms`
직전 베이스: `9c448c8` (PR #8 design-system-v2 머지 후 develop)

---

## 1. 배경 / 문제

5.4 (PR #7) 의 "내정보 · 경력기술" 화면에서 사용자가 회사·프로젝트·메트릭을 추가할 때 `window.prompt` 9건이 직렬로 호출된다.

| 위치 | prompt 횟수 | 입력 항목 |
|---|---|---|
| `career-content.tsx` (회사 추가) | 4 | company / position / startDate / endDate |
| `career-card.tsx` (프로젝트 추가) | 1 | title |
| `project-card.tsx` (메트릭 추가) | 3 | k / before / after |
| (관련) `confirm` 삭제 다이얼로그 | 2 | — 본 fix 스코프 외, 유지 |

문제:
- 브랜드 톤(`해요체`·`이취가 …해드릴게요`) 과 거리가 먼 OS native dialog
- `Esc` 한 번이면 후속 입력 전부 폐기됨 (회사 4개 prompt 시 더 심각)
- 메트릭은 `window.prompt` 한계상 `compare` variant 만 지원, `delta` 입력 불가
- 디자인 시스템(`preview/form-inputs.html`·`form-toggles.html`) 의 일관성 깨짐

## 2. 목표 / 비목표

### 목표
- 9건의 `window.prompt` 를 시안 정합 인라인 폼으로 교체
- 메트릭에 `compare` / `delta` variant 선택 UI 도입 (radio)
- 날짜 입력은 텍스트 마스크(`20240101` → `2024-01-01`) + 네이티브 캘린더 popup 둘 다 지원

### 비목표
- 삭제 확인 `window.confirm` 2건 교체 (v1 베타 적절·최소 설수)
- 모달 다이얼로그 도입
- 메트릭 편집 (현재도 미지원, 본 fix 스코프 외)
- 캘린더 라이브러리 도입 (단순성 원칙 — 추후 교체 여지를 `DateInput` 격리로 보존)

## 3. 결정 내역 (브레인스토밍 합의 사항)

1. **스코프**: `window.prompt` 9건만 교체. `confirm` 2건 유지
2. **표시 방식**: 인라인 폼 (modal 아님). 브랜치명에 반영
3. **메트릭 variant UI**: radio (`form-toggles.html` 패턴) — `○ 비교(전·후) ○ 증감(Δ)`
4. **날짜 입력**: 보이는 input 은 `type="text"` (마스킹) + 우측 캘린더 버튼 → hidden `<input type="date">` 의 `showPicker()` 호출 (라이브러리 X). `DateInput` 컴포넌트로 격리 → 추후 캘린더 교체 시 1곳만 수정.

## 4. 아키텍처

### 신규 컴포넌트 4개

```
frontend/src/components/me/career/
├── new-career-form.tsx        # 회사 추가 인라인 폼
├── new-project-form.tsx       # 프로젝트 추가 인라인 폼
├── new-metric-form.tsx        # 메트릭 추가 인라인 폼 (variant radio)
└── date-input.tsx             # 텍스트 마스크 + showPicker 캘린더 합성
```

### 수정 컴포넌트 3개

```
frontend/src/components/me/career/
├── career-content.tsx         # "+회사 추가" 클릭 시 NewCareerForm 표시 (parent state `addingCareer`)
├── career-card.tsx            # "+프로젝트 추가" 클릭 시 NewProjectForm 표시 (`addingProject`)
└── project-card.tsx           # "+성과 지표 추가" 칩 클릭 시 NewMetricForm 표시 (`addingMetric`)
```

### 공통 원칙

- 폼 컴포넌트는 stateless (initialValues 없음, 항상 빈 폼). 자체 useState 로 입력값만 보유, 저장 후 unmount 로 자연 reset
- props: `onSubmit(payload)`, `onCancel()`, `onError?(msg)`
- Parent 가 `adding*` boolean state 관리 + API 호출 + top error banner
- 스타일: `kit.css` 의 `.field` / `.lbl` / `.input` / `.helper` / `.btn-*` 사용. 신규 CSS 추가 없음
- 모든 텍스트는 해요체·청유형. 톤 키워드(`정리/검토/맞춤`) 우선

## 5. 컴포넌트 상세

### 5.1 `DateInput` (신규)

위치: `frontend/src/components/me/career/date-input.tsx`

Props:
```ts
type DateInputProps = {
  value: string;                  // ""(빈값) 또는 부분/완전 YYYY-MM-DD
  onChange: (next: string) => void;
  placeholder?: string;           // default "YYYY-MM-DD"
  required?: boolean;
  error?: string;                 // 외부 검증 메시지 (있으면 helper.error)
  id?: string;                    // label 연결용
};
```

내부 구조:
```jsx
<div className="date-input">
  <input
    type="text" inputMode="numeric" maxLength={10}
    placeholder={placeholder ?? "YYYY-MM-DD"}
    value={value}
    onChange={(e) => onChange(formatDateMask(e.target.value))}
  />
  <button type="button" className="date-input__picker" onClick={openPicker} aria-label="달력 열기">
    <svg>...calendar icon...</svg>
  </button>
  <input
    ref={hiddenRef}
    type="date" className="date-input__hidden"
    value={value.length === 10 ? value : ""}
    onChange={(e) => onChange(e.target.value)}
  />
</div>
```

마스킹 함수:
```ts
function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
```

`openPicker` 동작:
```ts
function openPicker() {
  const el = hiddenRef.current;
  if (el && typeof el.showPicker === "function") el.showPicker();
}
```
- `showPicker()` 미지원 환경(Firefox <101 등)에서는 no-op. 텍스트 입력은 정상 작동.

검증:
- 외부에서 길이 10 + 정규식 `/^\d{4}-\d{2}-\d{2}$/` 매치 안 되면 `error` prop 전달

스타일: 신규 CSS 최소. `.date-input { display: inline-flex; }` 정도. hidden input 은 `position: absolute; opacity: 0; pointer-events: none;` (showPicker 호출 가능하면서 시각적 비표시). kit.css 에 추가하지 않고 component-local CSS module 또는 inline style.

### 5.2 `NewCareerForm` (신규)

Props:
```ts
type NewCareerFormProps = {
  onSubmit: (req: CareerCreateRequest) => Promise<void>;
  onCancel: () => void;
};
```

필드:
- `company` (필수, text)
- `position` (선택, text)
- `startDate` (필수, DateInput)
- `endDate` (선택, DateInput)

`isCurrent` 는 폼에는 미노출 (5.4 기존 정책 — endDate 빈 값이면 isCurrent=true, BE 가 추론). 본 fix 도 동일.

검증 (submit 시도 후만):
- `company.trim()` 빈 값 → "회사명을 입력해주세요"
- `startDate` 빈 값 → "시작일을 입력해주세요"
- `startDate` 길이 10 인데 `/^\d{4}-\d{2}-\d{2}$/` 매치 안 됨 → "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)"
- `endDate` 입력됐는데 형식 오류 → 동일 메시지

레이아웃:
```
회사명 *      [                    ]
직책          [                    ]
시작일 *      [YYYY-MM-DD] [📅]
종료일        [YYYY-MM-DD] [📅]  (재직 중이면 비워두세요)

                                 [취소] [저장]
```
- 카드 형태 (`.surface-card` 또는 `.kit-card` 패턴, kit.css 기존 유틸)
- `submit` 중 저장 버튼 `disabled` + "저장 중…"

### 5.3 `NewProjectForm` (신규)

Props:
```ts
type NewProjectFormProps = {
  onSubmit: (req: ProjectCreateRequest) => Promise<void>;
  onCancel: () => void;
};
```

필드:
- `title` (필수, text)
- `periodStart` (선택, DateInput)
- `periodEnd` (선택, DateInput)
- `role` (선택, text)

검증 (submit 시도 후만):
- `title.trim()` 빈 값 → "프로젝트 이름을 입력해주세요"
- `periodStart`/`periodEnd` 입력됐는데 형식 오류 → "날짜 형식이 올바르지 않아요"

### 5.4 `NewMetricForm` (신규)

Props:
```ts
type NewMetricFormProps = {
  onSubmit: (metric: Metric) => void;   // 동기 — parent 가 autosave 큐로 합침
  onCancel: () => void;
};
```

State:
```ts
const [variant, setVariant] = useState<"compare" | "delta">("compare");
const [k, setK] = useState("");
const [before, setBefore] = useState("");
const [after, setAfter] = useState("");
const [delta, setDelta] = useState("");
const [dir, setDir] = useState<"up" | "down">("up");
```

레이아웃:
```
타입   ○ 비교(전·후)  ○ 증감(Δ)

[variant === "compare"]
  지표 *    [TPS                ]
  전 *      [500    ]   후 *  [2000   ]

[variant === "delta"]
  지표 *    [매출               ]
  증감 *    [₩2,000,000  ]   방향  ○ ↑ 증가  ○ ↓ 감소

                                     [취소] [저장]
```

저장 페이로드:
```ts
variant === "compare" ? { k: k.trim(), before: before.trim(), after: after.trim() }
                      : { k: k.trim(), delta: delta.trim(), dir };
```

검증 (submit 시도 후만):
- `k.trim()` 빈 값 → "지표명을 입력해주세요"
- compare: `before` / `after` 중 빈 값 → 각 필드 "값을 입력해주세요"
- delta: `delta` 빈 값 → "증감 값을 입력해주세요"

칩 자리 morphing (project-card.tsx 변경):
```jsx
<div className="metrics">
  <div className="metrics-head">...</div>
  <div className="metric-row">
    {project.metrics.map(...)}
    {!addingMetric && <MetricChip variant="add" onAdd={() => setAddingMetric(true)} />}
  </div>
  {addingMetric && (
    <NewMetricForm
      onSubmit={(m) => { autosave({ metrics: [...project.metrics, m] }); setAddingMetric(false); }}
      onCancel={() => setAddingMetric(false)}
    />
  )}
</div>
```

## 6. 폼 동작 — 공통 규약

### 열기
- Parent 의 `adding*: boolean` state. `true` 시 폼 표시 + 같은 자리의 "+추가" 버튼/칩 숨김
- Mount 시 첫 input `autoFocus`

### 저장
- Form 의 `onSubmit` 콜백 → parent 가 API 호출 (`createCareer` / `createProject` / `patchProject`)
- 성공: parent 가 `setAdding*(false)` + 5.4 의 `loadCareers()` 재호출
- 실패: parent 가 `onError(message)` 호출 → 5.4 top error banner
- 저장 중: 폼 내부 submit 버튼 `disabled` + "저장 중…"

### 취소
- Form 의 `onCancel` → parent `setAdding*(false)`. 입력값 폐기, 확인 다이얼로그 없음
- `Esc` 키 동일 (`onKeyDown` 으로 form root 에 listener)

### 키보드
- `Enter` (input only, textarea 아님) → submit
- `Esc` → cancel
- Tab: 자연 DOM 순서

### 에러 표시
- 필드 단위: `.helper.error` (`preview/form-inputs.html` 패턴). **submit 시도 후에만** 노출
- API 실패: parent top error banner (5.4 기존 인프라)

## 7. 데이터 흐름 & 기존 호환성

API:
- `createCareer({ company, position?, startDate, endDate?: string | null })` — 기존 사용
- `createProject({ title, periodStart?, periodEnd?, role? })` — 기존 사용
- `patchProject(projectId, { metrics: [...] })` — 기존 사용 (metric 추가 시 autosave queue 통과)

빈 옵션 필드 처리:
- 모든 폼: 빈 문자열 입력은 페이로드에서 **omit** (또는 `null` 전달, 기존 `??` undefined 처리에 맞춤)
- 5.4 의 기존 prompt 로직과 동일한 형태로 페이로드 만들어 전달

## 8. 테스트 회귀

### 기존 케이스 (영향 없음)
- 직전 42 케이스 통과 유지 — 5.4 통합 테스트는 `window.prompt` 를 mock 하지 않음 (로딩/빈 목록/노출/AssistantNote/PRAR 5건)
- mock 제거나 selector 조정 **불필요**

### 신규 케이스 — 5건 (career-content.test.tsx 에 통합 추가)

1. **회사 추가 — 빈 값 검증**
   - "회사 추가" 클릭 → 폼 노출
   - `company` 비운 채 "저장" → `.helper.error` 노출, `createCareer` 호출 없음

2. **회사 추가 — 저장 성공 + 마스킹 검증**
   - `회사명: "(주)신규"`, `시작일` 인풋에 `20240101` 타이핑 → 값이 `2024-01-01` 로 표시
   - "저장" → `createCareer({ company: "(주)신규", startDate: "2024-01-01" })` 호출
   - 폼 사라짐 + `fetchCareers` 재호출

3. **프로젝트 추가 — 저장 성공**
   - 카드 펼친 후 "프로젝트 추가" → 폼 노출
   - `title: "신규 프로젝트"` → 저장 → `createProject({ careerHistoryId: 100, title: "신규 프로젝트" })` 호출

4. **메트릭 추가 — compare 저장**
   - "+성과 지표 추가" → 폼 노출 + compare 기본 선택 확인
   - `k="TPS"`, `before="500"`, `after="2000"` → 저장
   - `patchProject(200, { metrics: [{ k:"TPS", before:"500", after:"2000" }] })` 호출

5. **메트릭 추가 — delta 토글 후 저장**
   - 폼 열기 → delta radio 클릭
   - before/after 사라지고 delta/dir 노출
   - `k="매출"`, `delta="₩2,000,000"`, dir 기본 up 유지 → 저장
   - `patchProject(200, { metrics: [{ k:"매출", delta:"₩2,000,000", dir:"up" }] })` 호출

### Mock 보강
기존 `vi.mock("@/lib/api/career", ...)` 에 `createCareer` / `createProject` 를 외부 vi.fn 으로 노출 (현재 익명 `vi.fn()`).

### 범위 밖
- `DateInput.showPicker()` 캘린더 popup 자체 동작은 jsdom 에서 작동 안 함 → 미테스트. 마스킹 동작은 위 케이스 2 가 통합 검증
- `Esc` 키, autoFocus 등은 통합 테스트 케이스 5건 안에서 필요한 한도만 검증 (별도 케이스 추가 X)

### 회귀 목표
- BE 테스트: 영향 없음 (서버 코드 무수정)
- FE 테스트: 직전 42 + 신규 5 = **47** 통과

## 9. 디자인 정합 (CLAUDE.md §7)

- `kit.css` 의 `.field` / `.lbl` / `.input` / `.helper` / `.btn-primary` / `.btn-ghost` 활용 (신규 토큰·클래스 추가 없음)
- `DateInput` 만 컴포넌트-local 미니멀 CSS (inline style 또는 module). kit.css 오염 없음
- 톤 키워드 hit: 폼 안내문에 `정리·검토·맞춤` 중 2개 이상 노출 (예: "조금씩 정리해 두면 자소서에 바로 옮겨드릴 수 있어요")
- 카피: 해요체·청유형. 합쇼체·명령형 금지

## 10. 핵심 참조

- `frontend/src/components/me/career/{career-content,career-card,project-card}.tsx` — 수정 대상
- `frontend/src/components/me/career/__tests__/career-content.test.tsx` — 신규 5케이스 추가 대상
- `frontend/src/lib/api/career.ts` — `createCareer`/`createProject`/`patchProject`
- `frontend/src/lib/types/career.ts` — `CareerCreateRequest`/`ProjectCreateRequest`/`Metric`
- `design_system/preview/form-inputs.html` — `.field`/`.lbl`/`.input`/`.helper` 패턴
- `design_system/preview/form-toggles.html` — radio 패턴
- `frontend/src/styles/kit.css` — 베이스 스타일

## 11. 리스크 / 미해결

- `showPicker()` 호환성: Firefox <101 사용자가 0%에 가깝다는 가정. 미동작 시 텍스트 입력만 가능 (graceful degradation).
- 메트릭 폼이 chip 자리에서 별도 row 로 끼어드는 morphing 패턴 — 시안에 정확히 일치하는 ref 없음. 가장 보수적으로 `.metric-row` 다음 신규 row 로 처리.
- `isCurrent` 추론은 BE 책임 (5.4 기존). 폼 UX 에서 "재직 중" 토글을 노출하지 않는 선택은 사용자 혼동 가능성 — placeholder/helper 문구 ("재직 중이면 비워두세요") 로 보완.
