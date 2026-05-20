# fix/career-inline-forms — 5.4 의 window.prompt → 인라인 폼 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5.4 "내정보 · 경력기술" 화면의 `window.prompt` 9건을 시안 정합 인라인 폼으로 교체.

**Architecture:** 신규 4 컴포넌트(`DateInput`, `NewCareerForm`, `NewProjectForm`, `NewMetricForm`) 추가 + 기존 3 컴포넌트(`career-content`, `career-card`, `project-card`) 의 prompt 호출부 인라인 폼으로 교체. `DateInput` 은 텍스트 마스크와 네이티브 `showPicker()` 캘린더 합성, 캘린더 교체 여지를 위해 격리.

**Tech Stack:** Next.js (App Router) + React 18 (`useState`/`useRef`) + Vitest + React Testing Library + 기존 `kit.css` (`.field`/`.input`/`.helper` 클래스).

**Spec:** `docs/superpowers/specs/2026-05-20-fix-career-inline-forms-design.md`

---

## File Structure

| 파일 | 역할 | 종류 |
|---|---|---|
| `frontend/src/components/me/career/date-input.tsx` | 마스킹+캘린더 합성 입력 (격리) | 신규 |
| `frontend/src/components/me/career/new-career-form.tsx` | 회사 추가 폼 | 신규 |
| `frontend/src/components/me/career/new-project-form.tsx` | 프로젝트 추가 폼 | 신규 |
| `frontend/src/components/me/career/new-metric-form.tsx` | 메트릭 추가 폼 (compare/delta variant) | 신규 |
| `frontend/src/components/me/icons.tsx` | `Calendar` 아이콘 추가 | 수정 |
| `frontend/src/components/me/career/career-content.tsx` | `handleAddCareer` 의 `window.prompt` 4건 제거, `NewCareerForm` 통합 | 수정 |
| `frontend/src/components/me/career/career-card.tsx` | `handleAddProject` 의 `window.prompt` 1건 제거, `NewProjectForm` 통합 | 수정 |
| `frontend/src/components/me/career/project-card.tsx` | `MetricChip variant="add"` 의 `window.prompt` 3건 제거, `NewMetricForm` 통합 | 수정 |
| `frontend/src/components/me/career/__tests__/career-content.test.tsx` | 신규 5 통합 테스트 추가, `createCareer`/`createProject` mock 외부화 | 수정 |

각 신규 컴포넌트는 stateless props 만 받고, parent 가 `adding*: boolean` state 와 API 호출 + top error banner 책임.

---

## Task 1: `DateInput` 컴포넌트 — 마스킹 + showPicker

**Files:**
- Create: `frontend/src/components/me/career/date-input.tsx`
- Modify: `frontend/src/components/me/icons.tsx` (Calendar 아이콘 추가)

본 컴포넌트는 폼들에서 leaf 로 사용되어 통합 테스트(Task 6, 추후) 의 case 2 (`20240101` → `2024-01-01`) 로 검증된다. 단위 테스트는 별도 작성하지 않는다.

- [ ] **Step 1: `Calendar` 아이콘 추가 (icons.tsx)**

`frontend/src/components/me/icons.tsx` 의 마지막 `export function ...` 다음에 다음 함수를 추가한다 (lucide-style line icon, 24×24 viewBox, stroke 1.8):

```tsx
export function Calendar({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
```

- [ ] **Step 2: `DateInput` 컴포넌트 작성**

`frontend/src/components/me/career/date-input.tsx` 신규 작성:

```tsx
"use client";

import { useRef } from "react";
import { Calendar } from "../icons";

export type DateInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
  autoFocus?: boolean;
};

export function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function DateInput({
  value, onChange, placeholder = "YYYY-MM-DD", required, error, id, autoFocus,
}: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = hiddenRef.current;
    if (el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    }
  }

  const isValidIso = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return (
    <div style={{ display: "inline-flex", alignItems: "stretch", gap: 4, width: "100%" }}>
      <input
        id={id}
        className={`input${error ? " error" : ""}`}
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        value={value}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(formatDateMask(e.target.value))}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn ghost"
        onClick={openPicker}
        aria-label="달력 열기"
        style={{ padding: "0 10px" }}
      >
        <Calendar size={16} />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={isValidIso ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 0,
          height: 0,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: typecheck 통과 확인**

Run: `cd frontend && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/me/icons.tsx frontend/src/components/me/career/date-input.tsx
git commit -m "feat(fe): DateInput 컴포넌트 — 텍스트 마스크 + 네이티브 showPicker 캘린더 합성

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `NewCareerForm` 컴포넌트

**Files:**
- Create: `frontend/src/components/me/career/new-career-form.tsx`

폼 컴포넌트는 props 만 받고 stateful 동작 (검증·키보드)은 자체적으로. 저장 API 는 parent.

- [ ] **Step 1: `NewCareerForm` 작성**

`frontend/src/components/me/career/new-career-form.tsx` 신규 작성:

```tsx
"use client";

import { useState, useCallback } from "react";
import { DateInput } from "./date-input";
import type { CareerCreateRequest } from "@/lib/types/career";

type Props = {
  onSubmit: (req: CareerCreateRequest) => Promise<void>;
  onCancel: () => void;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

type Errors = { company?: string; startDate?: string; endDate?: string };

export function NewCareerForm({ onSubmit, onCancel }: Props) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!company.trim()) e.company = "회사명을 입력해주세요";
    if (!startDate) e.startDate = "시작일을 입력해주세요";
    else if (!ISO_RE.test(startDate)) e.startDate = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    if (endDate && !ISO_RE.test(endDate)) e.endDate = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    return e;
  }

  const handleSubmit = useCallback(async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        company: company.trim(),
        position: position.trim() || undefined,
        startDate,
        endDate: endDate || null,
      });
    } finally {
      setSaving(false);
    }
  }, [company, position, startDate, endDate, onSubmit]);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      onKeyDown={onKeyDown}
      style={{
        marginTop: 12, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="nc-company">회사명<span className="req">*</span></label>
        <input
          id="nc-company"
          className={`input${errors.company ? " error" : ""}`}
          autoFocus
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="(주)예시"
        />
        {errors.company && <div className="helper error">{errors.company}</div>}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="nc-position">직책</label>
        <input
          id="nc-position"
          className="input"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="백엔드 개발자"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="nc-start">시작일<span className="req">*</span></label>
          <DateInput id="nc-start" value={startDate} onChange={setStartDate} error={errors.startDate} />
          {errors.startDate && <div className="helper error">{errors.startDate}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="nc-end">종료일</label>
          <DateInput id="nc-end" value={endDate} onChange={setEndDate} error={errors.endDate} />
          <div className="helper">재직 중이면 비워두세요</div>
          {errors.endDate && <div className="helper error">{errors.endDate}</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: typecheck 통과 확인**

Run: `cd frontend && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/me/career/new-career-form.tsx
git commit -m "feat(fe): NewCareerForm — 회사 추가 인라인 폼

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `NewProjectForm` 컴포넌트

**Files:**
- Create: `frontend/src/components/me/career/new-project-form.tsx`

- [ ] **Step 1: `NewProjectForm` 작성**

`frontend/src/components/me/career/new-project-form.tsx` 신규 작성:

```tsx
"use client";

import { useState, useCallback } from "react";
import { DateInput } from "./date-input";
import type { ProjectCreateRequest } from "@/lib/types/career";

type Props = {
  onSubmit: (req: ProjectCreateRequest) => Promise<void>;
  onCancel: () => void;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

type Errors = { title?: string; periodStart?: string; periodEnd?: string };

export function NewProjectForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!title.trim()) e.title = "프로젝트 이름을 입력해주세요";
    if (periodStart && !ISO_RE.test(periodStart)) e.periodStart = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    if (periodEnd && !ISO_RE.test(periodEnd)) e.periodEnd = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    return e;
  }

  const handleSubmit = useCallback(async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
        role: role.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }, [title, periodStart, periodEnd, role, onSubmit]);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      onKeyDown={onKeyDown}
      style={{
        marginTop: 8, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="np-title">프로젝트 이름<span className="req">*</span></label>
        <input
          id="np-title"
          className={`input${errors.title ? " error" : ""}`}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 주문 정산 시스템"
        />
        {errors.title && <div className="helper error">{errors.title}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="np-start">시작일</label>
          <DateInput id="np-start" value={periodStart} onChange={setPeriodStart} error={errors.periodStart} />
          {errors.periodStart && <div className="helper error">{errors.periodStart}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="np-end">종료일</label>
          <DateInput id="np-end" value={periodEnd} onChange={setPeriodEnd} error={errors.periodEnd} />
          {errors.periodEnd && <div className="helper error">{errors.periodEnd}</div>}
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="np-role">역할</label>
        <input
          id="np-role"
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="예) BE 리드"
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `cd frontend && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/me/career/new-project-form.tsx
git commit -m "feat(fe): NewProjectForm — 프로젝트 추가 인라인 폼

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `NewMetricForm` 컴포넌트 (variant radio)

**Files:**
- Create: `frontend/src/components/me/career/new-metric-form.tsx`

- [ ] **Step 1: `NewMetricForm` 작성**

`frontend/src/components/me/career/new-metric-form.tsx` 신규 작성:

```tsx
"use client";

import { useState, useCallback } from "react";
import type { Metric } from "@/lib/types/career";

type Props = {
  onSubmit: (metric: Metric) => void;
  onCancel: () => void;
};

type Variant = "compare" | "delta";
type Errors = { k?: string; before?: string; after?: string; delta?: string };

export function NewMetricForm({ onSubmit, onCancel }: Props) {
  const [variant, setVariant] = useState<Variant>("compare");
  const [k, setK] = useState("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [delta, setDelta] = useState("");
  const [dir, setDir] = useState<"up" | "down">("up");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const e: Errors = {};
    if (!k.trim()) e.k = "지표명을 입력해주세요";
    if (variant === "compare") {
      if (!before.trim()) e.before = "값을 입력해주세요";
      if (!after.trim()) e.after = "값을 입력해주세요";
    } else {
      if (!delta.trim()) e.delta = "증감 값을 입력해주세요";
    }
    return e;
  }

  const handleSubmit = useCallback(() => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const metric: Metric = variant === "compare"
      ? { k: k.trim(), before: before.trim(), after: after.trim() }
      : { k: k.trim(), delta: delta.trim(), dir };
    onSubmit(metric);
  }, [variant, k, before, after, delta, dir, onSubmit]);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      onKeyDown={onKeyDown}
      style={{
        marginTop: 8, padding: 12,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        display: "grid", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="lbl">타입</span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input
            type="radio" name="metric-variant"
            checked={variant === "compare"}
            onChange={() => setVariant("compare")}
          />
          비교 (전·후)
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input
            type="radio" name="metric-variant"
            checked={variant === "delta"}
            onChange={() => setVariant("delta")}
          />
          증감 (Δ)
        </label>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="nm-k">지표<span className="req">*</span></label>
        <input
          id="nm-k"
          className={`input${errors.k ? " error" : ""}`}
          autoFocus
          value={k}
          onChange={(e) => setK(e.target.value)}
          placeholder="예) TPS, 매출"
        />
        {errors.k && <div className="helper error">{errors.k}</div>}
      </div>
      {variant === "compare" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="lbl" htmlFor="nm-before">전<span className="req">*</span></label>
            <input
              id="nm-before"
              className={`input${errors.before ? " error" : ""}`}
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              placeholder="예) 500"
            />
            {errors.before && <div className="helper error">{errors.before}</div>}
          </div>
          <div className="field">
            <label className="lbl" htmlFor="nm-after">후<span className="req">*</span></label>
            <input
              id="nm-after"
              className={`input${errors.after ? " error" : ""}`}
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              placeholder="예) 2000"
            />
            {errors.after && <div className="helper error">{errors.after}</div>}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="lbl" htmlFor="nm-delta">증감<span className="req">*</span></label>
            <input
              id="nm-delta"
              className={`input${errors.delta ? " error" : ""}`}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="예) ₩2,000,000"
            />
            {errors.delta && <div className="helper error">{errors.delta}</div>}
          </div>
          <div className="field">
            <span className="lbl">방향</span>
            <div style={{ display: "flex", gap: 12, paddingTop: 6 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="radio" name="metric-dir" checked={dir === "up"} onChange={() => setDir("up")} />
                ↑ 증가
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="radio" name="metric-dir" checked={dir === "down"} onChange={() => setDir("down")} />
                ↓ 감소
              </label>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn">저장</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `cd frontend && pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/me/career/new-metric-form.tsx
git commit -m "feat(fe): NewMetricForm — 메트릭 추가 인라인 폼 (compare/delta variant radio)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 테스트 mock 보강 (createCareer/createProject 외부화)

**Files:**
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx:14-27`

기존 `vi.mock` 의 `createCareer`, `createProject` 가 익명 `vi.fn()` 으로 노출돼 있어 Task 6 의 신규 테스트에서 호출 검증이 불가하다. 외부 `vi.fn` 으로 끌어올린다.

- [ ] **Step 1: mock 보강 패치**

`frontend/src/components/me/career/__tests__/career-content.test.tsx` 의 line 14~27 의 mock 블록을 다음으로 교체한다 (변경: `createCareerMock`, `createProjectMock` 외부화 + `beforeEach` reset 에 추가):

```ts
const fetchCareersMock = vi.fn();
const patchProjectMock = vi.fn();
const createCareerMock = vi.fn();
const createProjectMock = vi.fn();
vi.mock("@/lib/api/career", () => ({
  fetchCareers: (...args: unknown[]) => fetchCareersMock(...args),
  createCareer: (...args: unknown[]) => createCareerMock(...args),
  updateCareer: vi.fn(),
  deleteCareer: vi.fn(),
  createProject: (...args: unknown[]) => createProjectMock(...args),
  patchProject: (...args: unknown[]) => patchProjectMock(...args),
  deleteProject: vi.fn(),
}));
```

그리고 동일 파일의 `beforeEach(() => { ... })` 블록을 다음으로 교체:

```ts
beforeEach(() => {
  fetchCareersMock.mockReset();
  patchProjectMock.mockReset();
  createCareerMock.mockReset();
  createProjectMock.mockReset();
});
```

- [ ] **Step 2: 기존 테스트 5건 통과 유지 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 5 passed (기존 케이스 모두 통과).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/me/career/__tests__/career-content.test.tsx
git commit -m "test(fe): career-content 테스트 mock — createCareer/createProject 외부화

후속 인라인 폼 통합 테스트에서 호출 인자 검증을 위해 명시적 vi.fn 으로 분리.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `career-content.tsx` 통합 — 회사 추가 폼 + 통합 테스트 2건

**Files:**
- Modify: `frontend/src/components/me/career/career-content.tsx`
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (신규 테스트 2건 추가)

TDD 순서: 실패하는 통합 테스트 작성 → career-content.tsx 의 prompt 호출부 제거 후 `NewCareerForm` 통합 → 통과.

- [ ] **Step 1: 실패하는 통합 테스트 2건 추가**

`frontend/src/components/me/career/__tests__/career-content.test.tsx` 의 `describe("CareerContent", () => { ... })` 블록 마지막 `test(...)` 다음에 다음 두 케이스를 추가한다:

```ts
  test("회사 추가 — 빈 값 시 검증 에러, createCareer 호출 없음", async () => {
    fetchCareersMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/회사 추가/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /회사 추가/ }));
    // 폼 노출 확인
    const companyInput = await screen.findByLabelText(/회사명/);
    expect(companyInput).toBeInTheDocument();

    // 빈 값으로 저장 시도
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    expect(await screen.findByText(/회사명을 입력해주세요/)).toBeInTheDocument();
    expect(createCareerMock).not.toHaveBeenCalled();
  });

  test("회사 추가 — 마스킹 적용 + 저장 성공 + 리스트 refetch", async () => {
    fetchCareersMock.mockResolvedValue([]);
    createCareerMock.mockResolvedValue({
      id: 999, company: "(주)신규", position: null,
      startDate: "2024-01-01", endDate: null, isCurrent: true,
      summary: null, orderIndex: 0, projects: [],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/회사 추가/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /회사 추가/ }));
    await user.type(await screen.findByLabelText(/회사명/), "(주)신규");

    const startInput = screen.getByLabelText(/시작일/);
    await user.type(startInput, "20240101");
    expect(startInput).toHaveValue("2024-01-01");

    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createCareerMock).toHaveBeenCalledWith({
        company: "(주)신규",
        position: undefined,
        startDate: "2024-01-01",
        endDate: null,
      });
    });

    // 폼 사라짐
    await waitFor(() => expect(screen.queryByLabelText(/회사명/)).not.toBeInTheDocument());
  });
```

- [ ] **Step 2: 신규 테스트 실패 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 5 passed + 2 failed (회사 추가 폼 미통합 상태).

- [ ] **Step 3: career-content.tsx 통합**

`frontend/src/components/me/career/career-content.tsx` 의 다음을 변경:

(a) 파일 상단 import 블록에 다음 한 줄을 추가 (`fetchCareers, createCareer` 임포트는 이미 존재):
```tsx
import { NewCareerForm } from "./new-career-form";
```

(b) `useState` 블록 끝 (현재 `error` state 다음) 에 다음 한 줄 추가:
```tsx
const [addingCareer, setAddingCareer] = useState(false);
```

(c) line 31~46 의 `handleAddCareer` 함수를 다음으로 교체:
```tsx
async function handleAddCareer(req: {
  company: string;
  position?: string;
  startDate: string;
  endDate?: string | null;
}) {
  try {
    const created = await createCareer(req);
    const withProjects: Career = { ...created, projects: created.projects ?? [] };
    setCareers((prev) => prev ? [withProjects, ...prev] : [withProjects]);
    setAddingCareer(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "회사 추가에 실패했어요.");
  }
}
```

(d) line 86~88 의 "회사 추가" 버튼을 다음으로 교체:
```tsx
{!addingCareer ? (
  <button className="btn" onClick={() => setAddingCareer(true)} style={{ marginTop: 12 }}>
    <Plus size={14} /> 회사 추가
  </button>
) : (
  <NewCareerForm
    onSubmit={handleAddCareer}
    onCancel={() => setAddingCareer(false)}
  />
)}
```

- [ ] **Step 4: 통합 테스트 통과 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/me/career/career-content.tsx frontend/src/components/me/career/__tests__/career-content.test.tsx
git commit -m "fix(fe): career-content — 회사 추가 window.prompt 4건 → NewCareerForm

통합 테스트 2건 추가 (빈 값 검증 + 마스킹 적용 저장).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `career-card.tsx` 통합 — 프로젝트 추가 폼 + 통합 테스트 1건

**Files:**
- Modify: `frontend/src/components/me/career/career-card.tsx`
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (신규 테스트 1건 추가)

- [ ] **Step 1: 실패하는 통합 테스트 추가**

`career-content.test.tsx` 의 `describe` 블록 마지막에 추가:

```ts
  test("프로젝트 추가 — 저장 성공 → createProject 호출", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    createProjectMock.mockResolvedValue({
      id: 300, careerHistoryId: 100, title: "신규 프로젝트",
      periodStart: null, periodEnd: null, role: null,
      techStack: [], structureType: "PRAR",
      prar: { problem: null, rootCause: null, approach: null, result: null },
      metrics: [], orderIndex: 1,
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("(주)현재회사")).toBeInTheDocument());

    // 회사 카드의 "프로젝트 추가" 버튼 (이미 defaultOpen=true)
    await user.click(screen.getByRole("button", { name: /프로젝트 추가/ }));
    await user.type(await screen.findByLabelText(/프로젝트 이름/), "신규 프로젝트");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith(100, {
        title: "신규 프로젝트",
        periodStart: null,
        periodEnd: null,
        role: null,
      });
    });
  });
```

- [ ] **Step 2: 실패 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 7 passed + 1 failed.

- [ ] **Step 3: career-card.tsx 통합**

`frontend/src/components/me/career/career-card.tsx` 의 다음을 변경:

(a) 파일 상단 import 블록에 다음 한 줄을 추가 (`ProjectCard` 임포트는 이미 존재):
```tsx
import { NewProjectForm } from "./new-project-form";
```

(b) `useState` 블록 끝 (현재 `draft` state 다음) 에 다음 한 줄 추가:
```tsx
const [addingProject, setAddingProject] = useState(false);
```

(c) line 52~67 의 `handleAddProject` 함수를 다음으로 교체:
```tsx
async function handleAddProject(req: {
  title: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  role?: string | null;
}) {
  try {
    const newProject = await createProject(career.id, req);
    onChange({ ...career, projects: [newProject, ...career.projects] });
    setAddingProject(false);
  } catch (err) {
    onError(err instanceof Error ? err.message : "프로젝트 추가에 실패했어요.");
  }
}
```

(d) line 157~159 의 "프로젝트 추가" 버튼을 다음으로 교체:
```tsx
{!addingProject ? (
  <button className="btn ghost" onClick={() => setAddingProject(true)} style={{ marginTop: 8 }}>
    <Plus size={14} /> 프로젝트 추가
  </button>
) : (
  <NewProjectForm
    onSubmit={handleAddProject}
    onCancel={() => setAddingProject(false)}
  />
)}
```

- [ ] **Step 4: 통합 테스트 통과 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/me/career/career-card.tsx frontend/src/components/me/career/__tests__/career-content.test.tsx
git commit -m "fix(fe): career-card — 프로젝트 추가 window.prompt 1건 → NewProjectForm

통합 테스트 1건 추가.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `project-card.tsx` 통합 — 메트릭 폼 + 통합 테스트 2건

**Files:**
- Modify: `frontend/src/components/me/career/project-card.tsx`
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (신규 테스트 2건 추가)

- [ ] **Step 1: 실패하는 통합 테스트 2건 추가**

`career-content.test.tsx` 의 `describe` 블록 마지막에 추가:

```ts
  test("메트릭 추가 — compare 저장 → patchProject 호출", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    patchProjectMock.mockResolvedValue({
      ...sampleCareer.projects[0],
      metrics: [{ k: "TPS", before: "500", after: "2000" }],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /성과 지표 추가/ }));

    await user.type(await screen.findByLabelText(/지표/), "TPS");
    await user.type(screen.getByLabelText(/^전/), "500");
    await user.type(screen.getByLabelText(/^후/), "2000");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchProjectMock).toHaveBeenCalledWith(100, 200, {
        metrics: [{ k: "TPS", before: "500", after: "2000" }],
      });
    });
  });

  test("메트릭 추가 — delta 토글 + 저장 → patchProject 호출 (dir 기본 up)", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    patchProjectMock.mockResolvedValue({
      ...sampleCareer.projects[0],
      metrics: [{ k: "매출", delta: "₩2,000,000", dir: "up" }],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /성과 지표 추가/ }));

    // delta 라디오 토글
    await user.click(await screen.findByLabelText(/증감 \(Δ\)/));
    // before/after 사라지고 delta/방향 노출
    expect(screen.queryByLabelText(/^전/)).not.toBeInTheDocument();

    // "증감" 은 라디오와 필드 둘 다 매치되므로 textbox role 로 명시
    await user.type(screen.getByRole("textbox", { name: /지표/ }), "매출");
    await user.type(screen.getByRole("textbox", { name: /^증감/ }), "₩2,000,000");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchProjectMock).toHaveBeenCalledWith(100, 200, {
        metrics: [{ k: "매출", delta: "₩2,000,000", dir: "up" }],
      });
    });
  });
```

- [ ] **Step 2: 실패 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 8 passed + 2 failed.

- [ ] **Step 3: project-card.tsx 통합**

`frontend/src/components/me/career/project-card.tsx` 의 다음을 변경:

(a) 파일 상단 import 블록에 다음 한 줄을 추가 (`MetricChip`, `TechTag` 임포트는 이미 존재):
```tsx
import { NewMetricForm } from "./new-metric-form";
```

(b) `useState` 블록 끝 (현재 `saving` state 다음) 에 다음 한 줄 추가:
```tsx
const [addingMetric, setAddingMetric] = useState(false);
```

(c) line 116~141 의 `.metric-row` 와 add chip 부분을 다음으로 교체:
```tsx
<div className="metric-row">
  {project.metrics.map((m, i) => (
    <MetricChip
      key={i}
      variant="metric"
      metric={m}
      onDelete={() => {
        const next = project.metrics.filter((_, j) => j !== i);
        autosave({ metrics: next });
      }}
    />
  ))}
  {!addingMetric && (
    <MetricChip
      variant="add"
      onAdd={() => setAddingMetric(true)}
    />
  )}
</div>
{addingMetric && (
  <NewMetricForm
    onSubmit={(m) => {
      autosave({ metrics: [...project.metrics, m] });
      setAddingMetric(false);
    }}
    onCancel={() => setAddingMetric(false)}
  />
)}
```

`<NewMetricForm />` 은 `.metric-row` 와 형제로 `.metrics` 안에 위치 (chip row 다음 신규 row 로 끼어듦, 스펙 §5.4 layout 일치).

- [ ] **Step 4: 통합 테스트 통과 확인**

Run: `cd frontend && pnpm vitest run src/components/me/career/__tests__/career-content.test.tsx`
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/me/career/project-card.tsx frontend/src/components/me/career/__tests__/career-content.test.tsx
git commit -m "fix(fe): project-card — 메트릭 추가 window.prompt 3건 → NewMetricForm (compare/delta)

통합 테스트 2건 추가 (compare 저장, delta 토글 저장).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 전체 회귀 검증 + 수동 스모크 + handoff 문서 정리

**Files:**
- (검증만 — 코드 변경 없음 또는 사소한 수정)
- Modify: `docs/superpowers/handoffs/2026-05-20-fix-career-inline-forms-handoff.md` (완료 마킹) — 선택

- [ ] **Step 1: 전체 FE 테스트 회귀**

Run: `cd frontend && pnpm vitest run`
Expected: 직전 42 + 신규 5 = **47 passed**. 0 failed.

- [ ] **Step 2: 전체 BE 테스트 회귀 (선택)**

Run: `cd backend && ./gradlew test`
Expected: 기존 통과 상태 유지 (서버 코드 무수정).
실패 시: BE 변경 없는데 깨졌다면 인프라 이슈 — 사용자에게 보고 후 중단.

- [ ] **Step 3: lint·typecheck**

Run: `cd frontend && pnpm tsc --noEmit && pnpm next lint`
Expected: 0 errors, 0 warnings (또는 직전 baseline 동일).

- [ ] **Step 4: 수동 스모크 (FE dev server)**

Run: `cd frontend && pnpm dev`

브라우저에서 `/me/career` 접속 후 다음 8개 케이스 실제 확인:

1. 빈 목록에서 "회사 추가" 클릭 → 폼 노출
2. 빈 값으로 "저장" → `회사명을 입력해주세요` 노출
3. 회사명·시작일에 `20240101` 타이핑 → 입력란이 `2024-01-01` 로 자동 변환
4. 캘린더 📅 버튼 클릭 → 네이티브 캘린더 popup (Chrome/Edge/Safari 16.4+)
5. 저장 → 카드 노출 + 폼 사라짐
6. 카드 펼친 후 "프로젝트 추가" → 폼 → 저장
7. 프로젝트 펼친 후 "+성과 지표 추가" 칩 → 폼 → compare 저장 시 칩 추가
8. 동일 폼 다시 열어 delta 토글 → 저장 시 dir up 칩 추가

각 동작에서 `window.prompt` dialog 가 한 번도 뜨지 않아야 함.

- [ ] **Step 5: handoff 문서 완료 마킹 (선택)**

`docs/superpowers/handoffs/2026-05-20-fix-career-inline-forms-handoff.md` 의 진행 상태 표 모든 행을 ✅ 로 변경하고 다음 한 줄 추가 (파일 끝):

```
---
**완료**: 2026-05-20. PR 생성 단계로 이동.
```

- [ ] **Step 6: Commit (있다면)**

handoff 갱신 시:
```bash
git add docs/superpowers/handoffs/2026-05-20-fix-career-inline-forms-handoff.md
git commit -m "docs: fix/career-inline-forms 핸드오프 완료 마킹

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: 사용자에게 PR 생성 여부 확인**

본 plan 의 모든 task 가 통과한 시점에서 사용자에게 다음을 묻는다:

> "fix/career-inline-forms 구현 완료. develop 대상 PR 생성할까요? (또는 추가 확인 필요?)"

PR 생성 동의 시 `gh pr create` 로 develop 대상 PR.
