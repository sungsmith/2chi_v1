# `feat/mypage-fe-wiring` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mypage FE PR #23 의 mock 데이터를 BE PR #25 의 실 API 호출로 교체 (account / noti-settings / withdraw 3 endpoint 만 — social / noti-center 는 v2 / PR B).

**Architecture:**
신규 `lib/api/mypage.ts` + `lib/types/mypage.ts` + 3 modal 컴포넌트 + `formatRelativeKo` utility. 기존 mypage view 들을 prop-based 에서 self-fetching 으로 refactor. AuthContext 의 기존 `refreshUser()` 활용 (이미 존재). 비밀번호 변경 / 탈퇴 성공 후 forced logout + `/login?password-changed=true` / `?withdrawn=true` query 기반 banner 표시.

**Tech Stack:** Next.js (App Router) · React · TypeScript · Vitest + RTL + userEvent · 기존 `lib/api/http.ts` wrapper

**Spec:** [`docs/superpowers/specs/2026-05-27-feat-mypage-fe-wiring-design.md`](../specs/2026-05-27-feat-mypage-fe-wiring-design.md)

---

## File Structure

| 파일 | 변경 | 한 줄 책임 |
|---|---|---|
| `frontend/src/lib/types/mypage.ts` | create | `MeProfile` / `NotiSettingItemDto` / `NotiSettingsResponse` / `UpdateNotiOverride` |
| `frontend/src/lib/api/mypage.ts` | create | 6 API 함수 + ErrorCode → 한국어 메시지 매핑 |
| `frontend/src/lib/utils/relative-time.ts` | create | `formatRelativeKo(date)` |
| `frontend/src/lib/utils/__tests__/relative-time.test.ts` | create | boundary 케이스 |
| `frontend/src/components/mypage/nickname-edit-modal.tsx` | create | 단일 input + PATCH /me |
| `frontend/src/components/mypage/password-change-modal.tsx` | create | 3 input + PATCH /me/password + forced logout |
| `frontend/src/components/mypage/withdraw-confirm-modal.tsx` | create | currentPassword input + DELETE /me + forced logout + redirect |
| `frontend/src/components/mypage/__tests__/nickname-edit-modal.test.tsx` | create | 통합 테스트 |
| `frontend/src/components/mypage/__tests__/password-change-modal.test.tsx` | create | 통합 테스트 |
| `frontend/src/components/mypage/__tests__/withdraw-confirm-modal.test.tsx` | create | 통합 테스트 |
| `frontend/src/components/mypage/account-view.tsx` | modify | props 제거 → fetch + modal triggers |
| `frontend/src/components/mypage/noti-settings-view.tsx` | modify | props 제거 → fetch + optimistic toggle |
| `frontend/src/components/mypage/noti-settings-row.tsx` | modify | `item` + `onToggle` props |
| `frontend/src/components/mypage/danger-view.tsx` | modify | 활성 withdraw 버튼 + modal trigger |
| `frontend/src/components/mypage/__tests__/account-view.test.tsx` | modify | fetch mocking 으로 전환 |
| `frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx` | modify | fetch mocking + toggle 인터랙션 |
| `frontend/src/app/(app)/mypage/page.tsx` | modify | `<AccountView />` (no props) |
| `frontend/src/app/(app)/mypage/notifications/page.tsx` | modify | `<NotiSettingsView />` (no props) |
| `frontend/src/components/login/login-form.tsx` | modify | `?withdrawn=true` / `?password-changed=true` banner |
| `frontend/src/lib/mock/mypage.ts` | modify | `ACCOUNT_MOCK` + `NOTI_SETTINGS_MOCK` 제거 (mock 타입 정의도 같이 정리, social/noti-center 는 유지) |

기존 `useAuth().refreshUser()` 이미 존재. 추가 API 없음.

---

## Task 1: 브랜치 + 타입 + API 함수 + relative-time utility

**Files:**
- Create: `frontend/src/lib/types/mypage.ts`
- Create: `frontend/src/lib/api/mypage.ts`
- Create: `frontend/src/lib/utils/relative-time.ts`
- Create: `frontend/src/lib/utils/__tests__/relative-time.test.ts`

- [ ] **Step 1: develop 동기화 + 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop
git pull origin develop
git checkout -b feat/mypage-fe-wiring
```

Expected: `Switched to a new branch 'feat/mypage-fe-wiring'`

- [ ] **Step 2: 타입 정의 작성**

Create `frontend/src/lib/types/mypage.ts`:

```typescript
export type MeProfile = {
  userId: number;
  email: string;
  nickname: string;
  role: string;
  onboardingCompleted: boolean;
  joinedAt: string;
  passwordChangedAt: string;
  plan: "free" | "pro";
};

export type NotiSettingItemDto = {
  id: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;
  locked: boolean;
};

export type NotiSettingsResponse = {
  settings: NotiSettingItemDto[];
};

export type UpdateNotiOverride = {
  id: string;
  enabled: boolean;
};
```

- [ ] **Step 3: API 함수 작성**

Create `frontend/src/lib/api/mypage.ts`:

```typescript
import { http } from "@/lib/api/http";
import type {
  MeProfile,
  NotiSettingsResponse,
  UpdateNotiOverride,
} from "@/lib/types/mypage";

type ErrorBody = { code?: string };

async function readCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as ErrorBody;
    return body.code;
  } catch {
    return undefined;
  }
}

export async function fetchMe(): Promise<MeProfile> {
  const res = await http("/api/v1/users/me");
  if (!res.ok) throw new Error("프로필을 불러오지 못했어요.");
  return res.json() as Promise<MeProfile>;
}

export async function updateNickname(nickname: string): Promise<MeProfile> {
  const res = await http("/api/v1/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "NICKNAME_DUPLICATE") throw new Error("이미 사용중인 닉네임이에요.");
    throw new Error("닉네임 변경에 실패했어요.");
  }
  return res.json() as Promise<MeProfile>;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await http("/api/v1/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "PASSWORD_MISMATCH") throw new Error("현재 비밀번호가 일치하지 않아요.");
    if (code === "PASSWORD_UNCHANGED") throw new Error("현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요.");
    throw new Error("비밀번호 변경에 실패했어요.");
  }
}

export async function withdraw(currentPassword: string): Promise<void> {
  const res = await http("/api/v1/users/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "PASSWORD_MISMATCH") throw new Error("현재 비밀번호가 일치하지 않아요.");
    if (code === "ALREADY_WITHDRAWN") throw new Error("이미 탈퇴 처리됐어요.");
    throw new Error("탈퇴 처리에 실패했어요.");
  }
}

export async function fetchNotiSettings(): Promise<NotiSettingsResponse> {
  const res = await http("/api/v1/users/me/noti-settings");
  if (!res.ok) throw new Error("알림 설정을 불러오지 못했어요.");
  return res.json() as Promise<NotiSettingsResponse>;
}

export async function updateNotiSettings(
  overrides: UpdateNotiOverride[],
): Promise<NotiSettingsResponse> {
  const res = await http("/api/v1/users/me/noti-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "SETTING_LOCKED") throw new Error("보안 알림은 변경할 수 없어요.");
    if (code === "UNKNOWN_SETTING") throw new Error("알 수 없는 알림 설정이에요.");
    if (code === "DUPLICATE_SETTING") throw new Error("같은 항목이 중복돼서 전송됐어요.");
    throw new Error("알림 설정 저장에 실패했어요.");
  }
  return res.json() as Promise<NotiSettingsResponse>;
}
```

- [ ] **Step 4: relative-time utility — 실패하는 테스트 먼저**

Create `frontend/src/lib/utils/__tests__/relative-time.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatRelativeKo } from "../relative-time";

describe("formatRelativeKo", () => {
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns '방금 전' for under 60 seconds", () => {
    expect(formatRelativeKo(new Date("2026-05-27T11:59:30Z"), now)).toBe("방금 전");
  });

  it("returns 'N분 전' for under 60 minutes", () => {
    expect(formatRelativeKo(new Date("2026-05-27T11:55:00Z"), now)).toBe("5분 전");
  });

  it("returns 'N시간 전' for under 24 hours", () => {
    expect(formatRelativeKo(new Date("2026-05-27T08:00:00Z"), now)).toBe("4시간 전");
  });

  it("returns '어제' for 1 day", () => {
    expect(formatRelativeKo(new Date("2026-05-26T12:00:00Z"), now)).toBe("어제");
  });

  it("returns 'N일 전' for under 30 days", () => {
    expect(formatRelativeKo(new Date("2026-05-22T12:00:00Z"), now)).toBe("5일 전");
  });

  it("returns 'N개월 전' for under 12 months", () => {
    expect(formatRelativeKo(new Date("2026-02-27T12:00:00Z"), now)).toBe("3개월 전");
  });

  it("returns 'N년 전' for over a year", () => {
    expect(formatRelativeKo(new Date("2024-05-27T12:00:00Z"), now)).toBe("2년 전");
  });
});
```

- [ ] **Step 5: 테스트가 fail 하는지 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- relative-time
```

Expected: FAIL — `Cannot find module '../relative-time'`

- [ ] **Step 6: relative-time utility 구현**

Create `frontend/src/lib/utils/relative-time.ts`:

```typescript
/**
 * 한국어 상대 시각 표현. 두 번째 인자로 now 를 받아 테스트 가능.
 */
export function formatRelativeKo(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "방금 전";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 30) return `${diffDay}일 전`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}년 전`;
}
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- relative-time
```

Expected: 7 tests passed.

- [ ] **Step 8: lint + build 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint
```

Expected: 0 errors. (build 는 Task 6 최종 검증)

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/types/mypage.ts \
    frontend/src/lib/api/mypage.ts \
    frontend/src/lib/utils/relative-time.ts \
    frontend/src/lib/utils/__tests__/relative-time.test.ts
git commit -m "$(cat <<'EOF'
feat(mp-fe): mypage 타입/API/utility — foundation

- lib/types/mypage.ts: MeProfile / NotiSettingItemDto / NotiSettingsResponse / UpdateNotiOverride
- lib/api/mypage.ts: 6 함수 (fetchMe / updateNickname / changePassword / withdraw /
  fetchNotiSettings / updateNotiSettings). ErrorCode → 한국어 메시지 매핑
- lib/utils/relative-time.ts: formatRelativeKo (단위 테스트 7건)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: AccountView refactor + NicknameEditModal

**Files:**
- Create: `frontend/src/components/mypage/nickname-edit-modal.tsx`
- Create: `frontend/src/components/mypage/__tests__/nickname-edit-modal.test.tsx`
- Modify: `frontend/src/components/mypage/account-view.tsx`
- Modify: `frontend/src/app/(app)/mypage/page.tsx`
- Modify: `frontend/src/components/mypage/__tests__/account-view.test.tsx`

- [ ] **Step 1: NicknameEditModal — 실패하는 통합 테스트 먼저**

Create `frontend/src/components/mypage/__tests__/nickname-edit-modal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NicknameEditModal } from "../nickname-edit-modal";
import type { MeProfile } from "@/lib/types/mypage";

const updateNicknameMock = vi.fn();
vi.mock("@/lib/api/mypage", () => ({
  updateNickname: (...args: unknown[]) => updateNicknameMock(...args),
}));

const updatedProfile: MeProfile = {
  userId: 1, email: "a@b.com", nickname: "new_nick", role: "USER",
  onboardingCompleted: true, joinedAt: "2026-01-01T00:00:00Z",
  passwordChangedAt: "2026-01-01T00:00:00Z", plan: "free",
};

beforeEach(() => {
  updateNicknameMock.mockReset();
});

describe("NicknameEditModal", () => {
  it("submits new nickname and calls onSuccess", async () => {
    updateNicknameMock.mockResolvedValueOnce(updatedProfile);
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "new_nick");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    await waitFor(() => expect(updateNicknameMock).toHaveBeenCalledWith("new_nick"));
    expect(onSuccess).toHaveBeenCalledWith(updatedProfile);
  });

  it("shows pattern error for 1-char nickname", async () => {
    render(<NicknameEditModal currentNickname="alice" onClose={vi.fn()} onSuccess={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "x");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/2~20자/);
    expect(updateNicknameMock).not.toHaveBeenCalled();
  });

  it("closes without calling API when nickname is unchanged", async () => {
    const onClose = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(updateNicknameMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows server error message on API failure", async () => {
    updateNicknameMock.mockRejectedValueOnce(new Error("이미 사용중인 닉네임이에요."));
    render(<NicknameEditModal currentNickname="alice" onClose={vi.fn()} onSuccess={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "bob");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 사용중인 닉네임이에요.");
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- nickname-edit-modal
```

Expected: FAIL — module not found.

- [ ] **Step 3: NicknameEditModal 구현**

Create `frontend/src/components/mypage/nickname-edit-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { updateNickname } from "@/lib/api/mypage";
import type { MeProfile } from "@/lib/types/mypage";

const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_-]{2,20}$/;

type Props = {
  currentNickname: string;
  onClose: () => void;
  onSuccess: (updated: MeProfile) => void | Promise<void>;
};

export function NicknameEditModal({ currentNickname, onClose, onSuccess }: Props) {
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (value === currentNickname) {
      onClose();
      return;
    }
    if (!NICKNAME_PATTERN.test(value)) {
      setError("닉네임은 2~20자의 한글/영문/숫자 및 -, _ 만 가능해요.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateNickname(value);
      await onSuccess(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>닉네임 변경</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl" htmlFor="nickname-input">닉네임 <span className="req">*</span></label>
            <input
              id="nickname-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <div className="hint">2~20자의 한글/영문/숫자 및 - _ 만 가능해요.</div>
          </div>
          {error && <div className="error-text" role="alert">{error}</div>}
        </div>

        <footer className="actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: NicknameEditModal 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- nickname-edit-modal
```

Expected: 5 tests passed.

- [ ] **Step 5: 기존 AccountView 테스트 갱신 — 실패하는 테스트 먼저**

Modify `frontend/src/components/mypage/__tests__/account-view.test.tsx` — 전체 교체:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountView } from "../account-view";
import type { MeProfile } from "@/lib/types/mypage";

const fetchMeMock = vi.fn();
const refreshUserMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "alice@example.com", nickname: "alice", onboardingCompleted: true },
    initialized: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: refreshUserMock,
  }),
}));

const profile: MeProfile = {
  userId: 1,
  email: "alice@example.com",
  nickname: "alice",
  role: "USER",
  onboardingCompleted: true,
  joinedAt: "2026-01-01T00:00:00Z",
  passwordChangedAt: "2026-01-01T00:00:00Z",  // same as joinedAt → "가입 후 변경하지 않았어요"
  plan: "free",
};

beforeEach(() => {
  fetchMeMock.mockReset();
  refreshUserMock.mockReset();
});

describe("AccountView", () => {
  it("renders profile data after fetch", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("shows 'never-changed' hint when passwordChangedAt === joinedAt", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);

    expect(await screen.findByText(/가입 후 변경하지 않았어요/)).toBeInTheDocument();
  });

  it("nickname '편집' button opens NicknameEditModal", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);
    await screen.findByText("alice");

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    expect(screen.getByRole("heading", { name: "닉네임 변경" })).toBeInTheDocument();
  });

  it("shows error message when fetchMe fails", async () => {
    fetchMeMock.mockRejectedValueOnce(new Error("프로필을 불러오지 못했어요."));
    render(<AccountView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("프로필을 불러오지 못했어요.");
  });

  it("email change button remains disabled (v2)", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);
    await screen.findByText("alice@example.com");

    const emailRow = screen.getByText("이메일").closest(".mp-row")!;
    const emailBtn = emailRow.querySelector("button")!;
    expect(emailBtn).toBeDisabled();
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- account-view
```

Expected: FAIL — 기존 AccountView 가 `data` prop 받는데 새 테스트는 prop 없이 render.

- [ ] **Step 7: AccountView refactor — 전체 교체**

Modify `frontend/src/components/mypage/account-view.tsx` — 전체 교체:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchMe } from "@/lib/api/mypage";
import type { MeProfile } from "@/lib/types/mypage";
import { formatRelativeKo } from "@/lib/utils/relative-time";
import { Edit } from "@/components/ui/icons";
import { NicknameEditModal } from "./nickname-edit-modal";

export function AccountView() {
  const { refreshUser } = useAuth();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [editingNickname, setEditingNickname] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : "프로필을 불러오지 못했어요."));
  }, []);

  if (error && !me) {
    return <div role="alert" className="error-banner">{error}</div>;
  }
  if (!me) {
    return <div className="loading">불러오는 중...</div>;
  }

  const isPasswordNeverChanged = me.passwordChangedAt === me.joinedAt;
  const passwordHint = isPasswordNeverChanged
    ? "가입 후 변경하지 않았어요 · 90일마다 변경을 권장해요"
    : `마지막 변경 ${formatRelativeKo(new Date(me.passwordChangedAt))} · 90일마다 변경을 권장해요`;

  return (
    <>
      <section className="mp-head">
        <h1>계정 정보</h1>
        <div className="sub">이메일·닉네임·비밀번호 같은 계정 자체 정보를 관리해요.</div>
      </section>
      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">기본 정보</span>
          <span className="sec-sub">소셜 가입 계정은 비밀번호 변경이 불가해요</span>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">이메일</span>
            <span className="desc"><b>{me.email}</b> · 이메일 인증 완료</span>
          </div>
          <button className="btn ghost sm" disabled title="이메일 변경은 v2 에서 지원해요">변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">닉네임</span>
            <span className="desc"><b>{me.nickname}</b> · UI · 자소서 · 알림에서 사용</span>
          </div>
          <button className="btn ghost sm" onClick={() => setEditingNickname(true)}>
            <Edit size={12}/> 편집
          </button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">비밀번호</span>
            <span className="desc">{passwordHint}</span>
          </div>
          {/* Task 3 에서 password modal trigger 로 변경됨. 현재는 disabled. */}
          <button className="btn secondary sm" disabled>비밀번호 변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">2단계 인증</span>
            <span className="desc">로그인 시 이메일로 인증 코드를 한 번 더 확인해요. <b>v2 준비 중</b></span>
          </div>
          <span className="value-pill">곧 출시</span>
        </div>
      </section>

      {editingNickname && (
        <NicknameEditModal
          currentNickname={me.nickname}
          onClose={() => setEditingNickname(false)}
          onSuccess={async (updated) => {
            setMe(updated);
            await refreshUser();
            setEditingNickname(false);
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 8: page entry 갱신**

Modify `frontend/src/app/(app)/mypage/page.tsx`:

```typescript
import { AccountView } from "@/components/mypage/account-view";

export default function MyPageAccount() {
  return <AccountView />;
}
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- account-view
```

Expected: 5 tests passed.

- [ ] **Step 10: 전체 회귀 + lint**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test
```

Expected: 0 lint errors, 모든 테스트 통과.

- [ ] **Step 11: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/nickname-edit-modal.tsx \
    frontend/src/components/mypage/__tests__/nickname-edit-modal.test.tsx \
    frontend/src/components/mypage/account-view.tsx \
    frontend/src/components/mypage/__tests__/account-view.test.tsx \
    frontend/src/app/(app)/mypage/page.tsx
git commit -m "$(cat <<'EOF'
feat(mp-fe): AccountView fetch + NicknameEditModal — 닉네임 변경 wiring

- NicknameEditModal 신규 (단일 input + signup 규칙 동일 pattern 검증)
- AccountView refactor: prop-driven → self-fetching (useEffect + fetchMe)
- 닉네임 변경 성공 시 useAuth().refreshUser() 호출 → TopNav/ProfileMenu 동기화
- passwordChangedAt === joinedAt 분기 표시 ("가입 후 변경하지 않았어요")
- formatRelativeKo 로 "3개월 전" 같은 상대 시각
- 이메일 변경 / 2FA / 비밀번호 변경 버튼은 disabled 유지 (Task 3 에서 password 활성화)
- 테스트 5건 (nickname modal) + 5건 (account view) 추가/갱신

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: PasswordChangeModal + login banner

**Files:**
- Create: `frontend/src/components/mypage/password-change-modal.tsx`
- Create: `frontend/src/components/mypage/__tests__/password-change-modal.test.tsx`
- Modify: `frontend/src/components/mypage/account-view.tsx` (password modal trigger 활성화)
- Modify: `frontend/src/components/login/login-form.tsx` (?password-changed banner)

- [ ] **Step 1: PasswordChangeModal — 실패하는 테스트 먼저**

Create `frontend/src/components/mypage/__tests__/password-change-modal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordChangeModal } from "../password-change-modal";

const changePasswordMock = vi.fn();
const setAccessTokenMock = vi.fn();
const pushMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));
vi.mock("@/lib/api/http", () => ({
  setAccessToken: (...args: unknown[]) => setAccessTokenMock(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true, login: vi.fn(), logout: logoutMock, refreshUser: vi.fn(),
  }),
}));

beforeEach(() => {
  changePasswordMock.mockReset();
  setAccessTokenMock.mockReset();
  pushMock.mockReset();
  logoutMock.mockReset();
});

describe("PasswordChangeModal", () => {
  it("submits and triggers forced logout + redirect on success", async () => {
    changePasswordMock.mockResolvedValueOnce(undefined);
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "OldPass1!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass2!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledWith("OldPass1!", "NewPass2!"));
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
    expect(logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login?password-changed=true");
  });

  it("shows mismatch error when new != confirm", async () => {
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "OldPass1!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "Different!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/일치하지 않/);
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("shows server error on PASSWORD_MISMATCH", async () => {
    changePasswordMock.mockRejectedValueOnce(new Error("현재 비밀번호가 일치하지 않아요."));
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "WrongPass!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass2!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("현재 비밀번호가 일치하지 않아요.");
    expect(setAccessTokenMock).not.toHaveBeenCalled();
  });

  it("requires all 3 fields", async () => {
    render(<PasswordChangeModal onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/입력해주세요/);
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<PasswordChangeModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- password-change-modal
```

Expected: FAIL — module not found.

- [ ] **Step 3: PasswordChangeModal 구현**

Create `frontend/src/components/mypage/password-change-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { changePassword } from "@/lib/api/mypage";
import { setAccessToken } from "@/lib/api/http";

type Props = {
  onClose: () => void;
};

export function PasswordChangeModal({ onClose }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("새 비밀번호가 일치하지 않아요.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      // forced logout — 옛 access token 이 ~15분 유효한 known limitation 회피
      setAccessToken(null);
      await logout();
      router.push("/login?password-changed=true");
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>비밀번호 변경</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl" htmlFor="current-password">현재 비밀번호 <span className="req">*</span></label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="new-password">새 비밀번호 <span className="req">*</span></label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="confirm-new-password">새 비밀번호 확인 <span className="req">*</span></label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="hint">변경 후 보안을 위해 자동으로 로그아웃돼요. 다시 로그인해주세요.</div>
          {error && <div className="error-text" role="alert">{error}</div>}
        </div>

        <footer className="actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "변경 중..." : "변경"}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- password-change-modal
```

Expected: 5 tests passed.

- [ ] **Step 5: AccountView 의 password modal trigger 활성화**

Modify `frontend/src/components/mypage/account-view.tsx`:

기존 `import { NicknameEditModal } from "./nickname-edit-modal";` 아래에 추가:
```typescript
import { PasswordChangeModal } from "./password-change-modal";
```

기존 `const [editingNickname, setEditingNickname] = useState(false);` 아래에 추가:
```typescript
  const [changingPassword, setChangingPassword] = useState(false);
```

기존 비밀번호 row 의 disabled 버튼:
```tsx
<button className="btn secondary sm" disabled>비밀번호 변경</button>
```
을 다음으로 교체:
```tsx
<button className="btn secondary sm" onClick={() => setChangingPassword(true)}>비밀번호 변경</button>
```

기존 `{editingNickname && (...)}` 뒤에 추가:
```tsx
      {changingPassword && (
        <PasswordChangeModal onClose={() => setChangingPassword(false)} />
      )}
```

- [ ] **Step 6: login form 의 password-changed banner 추가**

Read first: `frontend/src/components/login/login-form.tsx`. 컴포넌트 시작부의 `searchParams` 사용 위치를 확인. JSX return 시작 직후에 banner 삽입.

`useSearchParams()` 반환 객체를 활용해 다음 banner 를 컴포넌트의 JSX 의 폼 위에 추가:

```tsx
{searchParams.get("password-changed") === "true" && (
  <div className="info-banner" role="status">
    비밀번호가 변경됐어요. 새 비밀번호로 다시 로그인해주세요.
  </div>
)}
```

(정확한 위치는 LoginForm 컴포넌트의 form/wrapper 시작 부분. inline 으로 form 위/제목 아래에 삽입.)

- [ ] **Step 7: 전체 회귀 + lint**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test
```

Expected: 0 lint errors, 모든 테스트 통과.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/password-change-modal.tsx \
    frontend/src/components/mypage/__tests__/password-change-modal.test.tsx \
    frontend/src/components/mypage/account-view.tsx \
    frontend/src/components/login/login-form.tsx
git commit -m "$(cat <<'EOF'
feat(mp-fe): PasswordChangeModal + login banner — 비밀번호 변경 wiring

- PasswordChangeModal 신규 (3 input: current/new/confirm)
- AccountView 의 "비밀번호 변경" 버튼 활성화 + modal trigger
- 성공 시 forced logout (setAccessToken(null) + useAuth().logout()) + /login?password-changed=true redirect
  → BE PR #25 의 JWT revocation 미구현 known limitation 회피 (옛 token ~15분 유효 문제)
- LoginForm 에 ?password-changed=true 쿼리 감지 banner 추가
- 테스트 5건 (정상 / new != confirm / PASSWORD_MISMATCH / blank / 취소)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: WithdrawConfirmModal + DangerView + login banner

**Files:**
- Create: `frontend/src/components/mypage/withdraw-confirm-modal.tsx`
- Create: `frontend/src/components/mypage/__tests__/withdraw-confirm-modal.test.tsx`
- Modify: `frontend/src/components/mypage/danger-view.tsx`
- Modify: `frontend/src/components/login/login-form.tsx` (?withdrawn=true banner)

- [ ] **Step 1: WithdrawConfirmModal — 실패하는 테스트 먼저**

Create `frontend/src/components/mypage/__tests__/withdraw-confirm-modal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WithdrawConfirmModal } from "../withdraw-confirm-modal";

const withdrawMock = vi.fn();
const setAccessTokenMock = vi.fn();
const pushMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  withdraw: (...args: unknown[]) => withdrawMock(...args),
}));
vi.mock("@/lib/api/http", () => ({
  setAccessToken: (...args: unknown[]) => setAccessTokenMock(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true, login: vi.fn(), logout: logoutMock, refreshUser: vi.fn(),
  }),
}));

beforeEach(() => {
  withdrawMock.mockReset();
  setAccessTokenMock.mockReset();
  pushMock.mockReset();
  logoutMock.mockReset();
});

describe("WithdrawConfirmModal", () => {
  it("withdraws and triggers forced logout + redirect on success", async () => {
    withdrawMock.mockResolvedValueOnce(undefined);
    render(<WithdrawConfirmModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/현재 비밀번호/), "Pass1234!");
    await userEvent.click(screen.getByRole("button", { name: /회원 탈퇴/ }));

    await waitFor(() => expect(withdrawMock).toHaveBeenCalledWith("Pass1234!"));
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
    expect(logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login?withdrawn=true");
  });

  it("shows error on PASSWORD_MISMATCH", async () => {
    withdrawMock.mockRejectedValueOnce(new Error("현재 비밀번호가 일치하지 않아요."));
    render(<WithdrawConfirmModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/현재 비밀번호/), "Wrong!");
    await userEvent.click(screen.getByRole("button", { name: /회원 탈퇴/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("현재 비밀번호가 일치하지 않아요.");
    expect(setAccessTokenMock).not.toHaveBeenCalled();
  });

  it("requires password input", async () => {
    render(<WithdrawConfirmModal onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /회원 탈퇴/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/입력해주세요/);
    expect(withdrawMock).not.toHaveBeenCalled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<WithdrawConfirmModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- withdraw-confirm-modal
```

Expected: FAIL — module not found.

- [ ] **Step 3: WithdrawConfirmModal 구현**

Create `frontend/src/components/mypage/withdraw-confirm-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { withdraw } from "@/lib/api/mypage";
import { setAccessToken } from "@/lib/api/http";

type Props = {
  onClose: () => void;
};

export function WithdrawConfirmModal({ onClose }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (!currentPassword) {
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await withdraw(currentPassword);
      setAccessToken(null);
      await logout();
      router.push("/login?withdrawn=true");
    } catch (e) {
      setError(e instanceof Error ? e.message : "탈퇴 처리에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>회원 탈퇴 확인</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="warn-box">
            <b>탈퇴 시 영구 삭제되는 데이터</b>
            <div>· 회원 정보 (이메일, 닉네임, 연결된 소셜 계정)</div>
            <div>· 자소서 · 경력기술 · 포트폴리오 링크</div>
            <div>· 지원 일정 · 히스토리 로그 · 알림 기록</div>
            <div className="grace">30일간 휴면 상태로 유예 후 영구 삭제됩니다. 그 안에 다시 로그인하면 복구할 수 있어요.</div>
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="withdraw-password">현재 비밀번호 <span className="req">*</span></label>
            <input
              id="withdraw-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          {error && <div className="error-text" role="alert">{error}</div>}
        </div>

        <footer className="actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn danger" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "처리 중..." : "회원 탈퇴"}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- withdraw-confirm-modal
```

Expected: 4 tests passed.

- [ ] **Step 5: DangerView 활성화**

Modify `frontend/src/components/mypage/danger-view.tsx`. 기존 `import { Download } from "@/components/ui/icons";` 아래에 추가:

```typescript
import { useState } from "react";
import { WithdrawConfirmModal } from "./withdraw-confirm-modal";
```

기존 `export function DangerView() {` 직후에 추가:
```typescript
  const [confirmOpen, setConfirmOpen] = useState(false);
```

(주의: `"use client"` directive 가 파일 상단에 있어야 함. 없으면 추가.)

기존 `<button className="btn danger" disabled>회원 탈퇴</button>` 를 다음으로 교체:
```tsx
<button className="btn danger" onClick={() => setConfirmOpen(true)}>회원 탈퇴</button>
```

기존 마지막 `</section>` 뒤, fragment close `</>` 직전에 추가:
```tsx
      {confirmOpen && (
        <WithdrawConfirmModal onClose={() => setConfirmOpen(false)} />
      )}
```

- [ ] **Step 6: login form 의 withdrawn banner 추가**

Modify `frontend/src/components/login/login-form.tsx`. Task 3 에서 추가한 `password-changed` banner 옆에 다음 추가:

```tsx
{searchParams.get("withdrawn") === "true" && (
  <div className="info-banner" role="status">
    탈퇴 처리됐어요. 30일 이내에 같은 이메일로 로그인하면 복구할 수 있어요.
  </div>
)}
```

- [ ] **Step 7: 전체 회귀 + lint**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test
```

Expected: 0 lint errors, 모든 테스트 통과.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/withdraw-confirm-modal.tsx \
    frontend/src/components/mypage/__tests__/withdraw-confirm-modal.test.tsx \
    frontend/src/components/mypage/danger-view.tsx \
    frontend/src/components/login/login-form.tsx
git commit -m "$(cat <<'EOF'
feat(mp-fe): WithdrawConfirmModal + DangerView 활성화 + login banner — 탈퇴 wiring

- WithdrawConfirmModal 신규 (currentPassword input + 삭제 데이터 안내 박스)
- DangerView 의 "회원 탈퇴" 버튼 활성화 + modal trigger
- 성공 시 forced logout + /login?withdrawn=true redirect
- LoginForm 에 ?withdrawn=true 쿼리 감지 banner 추가 (30일 복구 약속 — 복구 자체는 v2)
- 테스트 4건 (정상 / PASSWORD_MISMATCH / blank / 취소)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: NotiSettingsView + NotiSettingsRow refactor (optimistic toggle)

**Files:**
- Modify: `frontend/src/components/mypage/noti-settings-row.tsx`
- Modify: `frontend/src/components/mypage/noti-settings-view.tsx`
- Modify: `frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx`
- Modify: `frontend/src/app/(app)/mypage/notifications/page.tsx`

- [ ] **Step 1: NotiSettingsView 테스트 전체 교체 — 실패하는 테스트 먼저**

Modify `frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx` — 전체 교체:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotiSettingsView } from "../noti-settings-view";
import type { NotiSettingItemDto, NotiSettingsResponse } from "@/lib/types/mypage";

const fetchNotiSettingsMock = vi.fn();
const updateNotiSettingsMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  fetchNotiSettings: (...args: unknown[]) => fetchNotiSettingsMock(...args),
  updateNotiSettings: (...args: unknown[]) => updateNotiSettingsMock(...args),
}));

const sampleItems: NotiSettingItemDto[] = [
  { id: "deadline-d3", category: "전형 일정 · 마감", label: "채용공고 마감 D-3", description: "마감 3일 전 09:00에 받기", enabled: true, locked: false },
  { id: "weekly-summary", category: "제품 안내", label: "주간 요약", description: "이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)", enabled: false, locked: false },
  { id: "signup-verify", category: "계정 보안", label: "회원가입 인증", description: "가입 직후 이메일 인증 코드 발송", enabled: true, locked: true },
];

beforeEach(() => {
  fetchNotiSettingsMock.mockReset();
  updateNotiSettingsMock.mockReset();
});

describe("NotiSettingsView", () => {
  it("renders 3 items after fetch", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems } satisfies NotiSettingsResponse);
    render(<NotiSettingsView />);

    expect(await screen.findByText("채용공고 마감 D-3")).toBeInTheDocument();
    expect(screen.getByText("주간 요약")).toBeInTheDocument();
    expect(screen.getByText("회원가입 인증")).toBeInTheDocument();
  });

  it("toggle calls updateNotiSettings with single override (optimistic)", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    const updatedItems = sampleItems.map((i) => i.id === "deadline-d3" ? { ...i, enabled: false } : i);
    updateNotiSettingsMock.mockResolvedValueOnce({ settings: updatedItems });

    render(<NotiSettingsView />);
    await screen.findByText("채용공고 마감 D-3");

    const toggle = screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ });
    await userEvent.click(toggle);

    await waitFor(() => expect(updateNotiSettingsMock).toHaveBeenCalledWith([{ id: "deadline-d3", enabled: false }]));
    // BE 응답으로 sync — 토글이 꺼짐 상태로 표시
    await waitFor(() => expect(screen.getByRole("button", { name: /채용공고 마감 D-3 알림 꺼짐/ })).toBeInTheDocument());
  });

  it("reverts on API failure and shows error banner", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    updateNotiSettingsMock.mockRejectedValueOnce(new Error("저장에 실패했어요."));

    render(<NotiSettingsView />);
    await screen.findByText("채용공고 마감 D-3");

    const toggle = screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ });
    await userEvent.click(toggle);

    expect(await screen.findByRole("alert")).toHaveTextContent("저장에 실패했어요.");
    // revert — 다시 켜짐 상태
    await waitFor(() => expect(screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ })).toBeInTheDocument());
  });

  it("locked items render as '강제 ON' pill (not button)", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    render(<NotiSettingsView />);
    await screen.findByText("회원가입 인증");

    const signupRow = screen.getByText("회원가입 인증").closest(".mp-row")!;
    expect(signupRow.querySelector(".value-pill")).toHaveTextContent("강제 ON");
    expect(signupRow.querySelector("button[aria-label*='회원가입 인증']")).toBeNull();
  });

  it("shows error on fetch failure", async () => {
    fetchNotiSettingsMock.mockRejectedValueOnce(new Error("알림 설정을 불러오지 못했어요."));
    render(<NotiSettingsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("알림 설정을 불러오지 못했어요.");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- noti-settings-view
```

Expected: FAIL — 기존 컴포넌트가 prop-based 라 새 테스트 패턴과 안 맞음.

- [ ] **Step 3: NotiSettingsRow refactor — props 변경**

Modify `frontend/src/components/mypage/noti-settings-row.tsx` — 전체 교체:

```typescript
"use client";

import type { NotiSettingItemDto } from "@/lib/types/mypage";

type Props = {
  item: NotiSettingItemDto;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
};

export function NotiSettingsRow({ item, onToggle, disabled = false }: Props) {
  return (
    <div className="mp-row">
      <div className="body">
        <span className="nm">{item.label}</span>
        <span className="desc">{item.description}</span>
      </div>
      {item.locked ? (
        <span className="value-pill" title="계정 보안 알림은 끌 수 없어요">강제 ON</span>
      ) : (
        <button
          type="button"
          className={`switch${item.enabled ? " on" : ""}`}
          aria-label={`${item.label} 알림 ${item.enabled ? "켜짐" : "꺼짐"}`}
          onClick={() => onToggle(!item.enabled)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: NotiSettingsView refactor — 전체 교체**

Modify `frontend/src/components/mypage/noti-settings-view.tsx` — 전체 교체:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Bell } from "@/components/ui/icons";
import { fetchNotiSettings, updateNotiSettings } from "@/lib/api/mypage";
import type { NotiSettingItemDto } from "@/lib/types/mypage";
import { NotiSettingsRow } from "./noti-settings-row";

const CATEGORY_SUB: Record<string, string | undefined> = {
  "전형 일정 · 마감": "채용공고와 면접 일정 관련 알림",
  "계정 보안": "중요 안내라 끌 수 없어요",
  "알림 채널": "받고 싶은 채널을 골라주세요",
};

function groupByCategory(items: NotiSettingItemDto[]): Map<string, NotiSettingItemDto[]> {
  const map = new Map<string, NotiSettingItemDto[]>();
  for (const item of items) {
    const group = map.get(item.category) ?? [];
    group.push(item);
    map.set(item.category, group);
  }
  return map;
}

export function NotiSettingsView() {
  const [items, setItems] = useState<NotiSettingItemDto[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchNotiSettings()
      .then((r) => setItems(r.settings))
      .catch((e) => setError(e instanceof Error ? e.message : "알림 설정을 불러오지 못했어요."));
  }, []);

  async function handleToggle(id: string, nextEnabled: boolean): Promise<void> {
    const previous = items;
    // optimistic
    setItems((prev) => prev?.map((i) => i.id === id ? { ...i, enabled: nextEnabled } : i) ?? null);

    try {
      const response = await updateNotiSettings([{ id, enabled: nextEnabled }]);
      setItems(response.settings);
    } catch (e) {
      setItems(previous);
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      setTimeout(() => setError(undefined), 3000);
    }
  }

  if (error && !items) {
    return <div role="alert" className="error-banner">{error}</div>;
  }
  if (!items) {
    return <div className="loading">불러오는 중...</div>;
  }

  const groups = groupByCategory(items);

  return (
    <>
      <section className="mp-head">
        <h1>알림 설정</h1>
        <div className="sub">받고 싶은 알림 채널과 카테고리를 카테고리별로 정리할 수 있어요.</div>
      </section>

      {error && (
        <div role="alert" className="error-banner inline">{error}</div>
      )}

      {/* Web-push banner — 정적 (FCM 통합은 v2) */}
      <div className="push-card">
        <span className="ico"><Bell size={24} /></span>
        <div className="body">
          <span className="ttl">웹푸시 알림을 켜시겠어요?</span>
          <span className="desc">
            마감 임박 알림과 면접 일정을 브라우저에서 바로 받아볼 수 있어요.
            브라우저 권한 동의 한 번이면 됩니다.
          </span>
        </div>
        <div className="actions">
          <button className="btn ghost sm" disabled>나중에</button>
          <button className="btn primary sm" disabled>
            <Bell size={12} /> 권한 요청하기
          </button>
        </div>
      </div>

      {Array.from(groups.entries()).map(([category, categoryItems]) => (
        <section key={category} className="mp-section">
          <div className="sec-head">
            <span className="sec-title">{category}</span>
            {CATEGORY_SUB[category] && (
              <span className="sec-sub">{CATEGORY_SUB[category]}</span>
            )}
          </div>
          {categoryItems.map((item) => (
            <NotiSettingsRow
              key={item.id}
              item={item}
              onToggle={(next) => handleToggle(item.id, next)}
            />
          ))}
        </section>
      ))}
    </>
  );
}
```

- [ ] **Step 5: page entry 갱신**

Modify `frontend/src/app/(app)/mypage/notifications/page.tsx`:

```typescript
import { NotiSettingsView } from "@/components/mypage/noti-settings-view";

export default function MyPageNotifications() {
  return <NotiSettingsView />;
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- noti-settings-view
```

Expected: 5 tests passed.

- [ ] **Step 7: 전체 회귀 + lint**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test
```

Expected: 0 lint errors, 모든 테스트 통과.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/noti-settings-row.tsx \
    frontend/src/components/mypage/noti-settings-view.tsx \
    frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx \
    frontend/src/app/(app)/mypage/notifications/page.tsx
git commit -m "$(cat <<'EOF'
feat(mp-fe): NotiSettingsView fetch + optimistic toggle — 알림 설정 wiring

- NotiSettingsRow refactor: defOn/locked props → item + onToggle callback. switch 가 button (클릭/space/enter 토글)
- NotiSettingsView refactor: prop-driven → self-fetching (useEffect + fetchNotiSettings)
- handleToggle: optimistic update → updateNotiSettings([{id, enabled}]) → BE 응답으로 sync. 실패 시 revert + error banner (3초 auto dismiss)
- locked 3개 (계정 보안) 는 "강제 ON" pill — button 자체가 렌더되지 않음
- 통합 테스트 5건 (default render / toggle success / toggle revert / locked / fetch error)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Mock cleanup + 최종 검증 + PR

**Files:**
- Modify: `frontend/src/lib/mock/mypage.ts` (ACCOUNT_MOCK + NOTI_SETTINGS_MOCK 제거, social + noti-center 유지)

- [ ] **Step 1: mock 파일 cleanup**

Modify `frontend/src/lib/mock/mypage.ts` — 다음 4 블록 제거:

1. `export type AccountSnapshot = { ... }` (전체 타입 제거)
2. `export const ACCOUNT_MOCK: AccountSnapshot = { ... }` (전체 const 제거)
3. `export type NotiChannel = "push" | "email" | "in_app";` (사용처 없음, 제거)
4. `export type NotiSettingItem = { ... }` + `export const NOTI_SETTINGS_MOCK: NotiSettingItem[] = [ ... ]` (전체 제거)

다음 4 블록은 **유지** (social/noti-center 는 v2/PR B):
- `SocialProvider` / `SocialConnection` / `SOCIAL_MOCK`
- `NotiCenterEntry` / `NOTI_CENTER_MOCK`

파일 최종 상태 (참고):

```typescript
export type SocialProvider = "google" | "kakao" | "naver" | "github";

export type SocialConnection = {
  provider: SocialProvider;
  label: string;
  connected: boolean;
  email?: string;
};

export const SOCIAL_MOCK: SocialConnection[] = [
  { provider: "google", label: "Google", connected: true, email: "somi.kim@gmail.com" },
  { provider: "kakao",  label: "카카오", connected: false },
  { provider: "naver",  label: "네이버", connected: false },
  { provider: "github", label: "GitHub", connected: true, email: "somi-kim" },
];

export type NotiCenterEntry = {
  id: string;
  time: string;
  icon: string;
  iconTone: "default" | "mint" | "lav" | "pink" | "warn";
  msg: string;
  unread: boolean;
};

export const NOTI_CENTER_MOCK: NotiCenterEntry[] = [
  // (기존 6 entry 그대로)
];
```

- [ ] **Step 2: 사용처 잔존 검사 — 깨진 import 가 있으면 build 가 실패**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && grep -rn "ACCOUNT_MOCK\|NOTI_SETTINGS_MOCK\|AccountSnapshot\|NotiSettingItem\b" src/ 2>&1 | head -20
```

Expected: **검색 결과 0** (모두 위 task 들에서 제거됨). 만약 남아있으면 해당 파일을 고치고 다시 검색.

- [ ] **Step 3: develop 최신과 rebase**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git fetch origin
git rebase origin/develop
```

Expected: `Successfully rebased and updated` 또는 conflict 없음.

- [ ] **Step 4: 전체 build · lint · test 통과**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test && npm run build
```

Expected: lint 0 errors / 모든 테스트 통과 (기존 + 신규) / `Compiled successfully`.

- [ ] **Step 5: 수동 sanity check (선택)**

```bash
cd /Users/sungjiwon/claude/2chi_v1 && docker-compose up -d postgres redis
# 별도 터미널: cd backend && ./gradlew bootRun
cd frontend && npm run dev
```

브라우저로 다음 흐름 확인:
1. `http://localhost:3000/login` → 가입한 사용자로 로그인
2. `/mypage` 접속 → 신규 필드 (이메일, 닉네임, "가입 후 변경하지 않았어요") 표시
3. 닉네임 "편집" → modal → 새 닉네임 입력 → 저장 → TopNav 도 즉시 갱신
4. 비밀번호 "변경" → modal → 3 input → 저장 → 자동 로그아웃 + login 페이지 banner "비밀번호가 변경됐어요"
5. 새 비밀번호로 다시 로그인 → `/mypage/notifications` → 토글 클릭 (즉시 시각 반영) → 새로고침 후 유지 확인
6. 계정 보안 알림 (강제 ON pill) → 클릭 가능한 영역 자체가 없음 확인
7. `/mypage/withdraw` → "회원 탈퇴" → modal → 비밀번호 입력 → 탈퇴 → /login redirect + banner "탈퇴 처리됐어요"
8. 같은 이메일로 다시 로그인 시도 → 410 USER_WITHDRAWN_GRACE 응답 → FE 가 에러 메시지 표시 (현재 generic — out of scope, 별도 follow-up)

dev 서버 종료.

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/mock/mypage.ts
git commit -m "$(cat <<'EOF'
chore(mp-fe): mock 정리 — ACCOUNT_MOCK / NOTI_SETTINGS_MOCK / AccountSnapshot / NotiSettingItem 제거

PR A 가 wiring 한 두 영역의 mock 데이터 + 관련 타입 제거. social / noti-center 는
v2 OAuth / PR B 가 아직 wiring 안 했으므로 SOCIAL_MOCK + NOTI_CENTER_MOCK 유지.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: push + PR 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git push -u origin feat/mypage-fe-wiring
gh pr create --base develop --title "feat(mp-fe): mypage cluster — mock → 실 API wiring (account / noti-settings / withdraw)" --body "$(cat <<'EOF'
## Summary

BE PR #25 의 endpoint 를 FE 와 wiring. mypage cluster 의 3 영역이 실제로 동작하게 됨.

- 닉네임 변경 (Modal → PATCH /me)
- 비밀번호 변경 (Modal → PATCH /me/password → forced logout + redirect)
- 회원 탈퇴 (Modal → DELETE /me → forced logout + redirect)
- 알림 설정 12개 토글 (optimistic update → PATCH /me/noti-settings)
- GET /me 의 신규 필드 표시 (joinedAt / passwordChangedAt / plan)

## Files

- 신규: `lib/types/mypage.ts` · `lib/api/mypage.ts` · `lib/utils/relative-time.ts` · 3 modal 컴포넌트
- 수정: `AccountView` / `NotiSettingsView` / `NotiSettingsRow` / `DangerView` (prop-driven → self-fetching)
- 수정: `LoginForm` (`?withdrawn=true` / `?password-changed=true` banner)
- 정리: `lib/mock/mypage.ts` 의 `ACCOUNT_MOCK` / `NOTI_SETTINGS_MOCK` 제거

## 핵심 결정 (spec 참조)

- **modal pattern** (nickname + password edit) — 기존 portfolio-modal / event-create-modal 스타일 매칭
- **optimistic toggle** — noti-settings 12 항목 빠른 연속 클릭에 자연스러움. 실패 시 revert + 3초 auto-dismiss error
- **forced logout** (비밀번호 변경 / 탈퇴 후) — BE PR #25 의 JWT revocation 미구현 known limitation 해소
- **inline-only feedback** — toast 시스템 도입은 v2 별도 PR
- **per-view fetch + selective AuthContext sync** — 닉네임 변경 후 `refreshUser()` 만 호출
- **social / noti-center mock 유지** — v2 OAuth / PR B 까지 미변경

## Out of Scope (다음 작업)

- social 4 provider 연결 wiring — v2 OAuth
- noti-center entries 표시 — PR B (BE noti-center API 와 같이)
- 이메일 변경 — v2 (BE endpoint 가 v2)
- 데이터 내보내기 / 2FA — v2 (BE 미구현)
- Toast 시스템 도입 — v2 별도 PR
- restore-on-login (탈퇴 후 30일 내 복구) — v2 (BE cron 과 같이)
- 410 USER_WITHDRAWN_GRACE 의 FE generic 표시 → 명시적 한국어 메시지 → 별도 작은 follow-up

## Test plan

- [x] `npm run lint` 0 errors
- [x] `npm run test` 전체 통과 (신규 4 modal test + 갱신 2 view test + 신규 1 util test)
- [x] `npm run build` Compiled successfully
- [ ] 수동 sanity: login → /mypage → 닉네임 변경 → TopNav 갱신 확인
- [ ] 수동: 비밀번호 변경 → 자동 로그아웃 + login banner → 새 비번 로그인
- [ ] 수동: noti-settings 토글 → 새로고침 후 유지
- [ ] 수동: 탈퇴 → /login banner → 410 재로그인 차단 확인

## Spec / Plan

- spec: `docs/superpowers/specs/2026-05-27-feat-mypage-fe-wiring-design.md`
- plan: `docs/superpowers/plans/2026-05-27-feat-mypage-fe-wiring.md`
- BE 의존: PR #25 (df8fcc9)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력. CI 통과 + 리뷰 진행.

- [ ] **Step 8: 사용자에게 PR URL 보고**

PR URL 보고. 이 plan 완료.

---

## 완료 조건 (Done definition)

- 6 task 모두 commit · push 완료
- PR 이 develop 기준으로 생성 + CI 통과 (frontend lint + test + build)
- 신규 통합 테스트 통과: relative-time (7) + nickname-edit-modal (5) + password-change-modal (5) + withdraw-confirm-modal (4) + 갱신 account-view (5) + 갱신 noti-settings-view (5) = 31 신규/갱신
- 기존 FE 테스트 회귀 0
- `frontend/src/lib/mock/mypage.ts` 에 `ACCOUNT_MOCK`/`NOTI_SETTINGS_MOCK` 잔존 0
- 수동 sanity (선택): 6 흐름 모두 정상 동작
