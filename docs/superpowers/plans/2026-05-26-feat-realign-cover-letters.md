# 2단계 PR 3번 (`feat/realign-cover-letters`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/cover-letters` cluster (목록 / 휴지통 / 경력기술서 재구조화 / dual-pane 에디터) 화면을 `design_system/project/ui_kits/web/screen-cover-letters.jsx` + `screen-cover-letter.jsx` mock 과 픽셀 단위로 재정렬. cluster IA 를 mock 의 sub-tabs 3-tab 구조로 변경. 신규 sub-view (휴지통 + 경력기술서 재구조화) UI mock-only 추가.

**Architecture:** mock JSX 마크업·className 을 frontend 컴포넌트에 그대로 옮김. 8-commit 점진 분할 (각 commit 빌드 통과 보장). 큰 mock 컴포넌트 (ClListView line 79-137 / TrashView line 144-202 / CareerStatementView line 212-382 / CoverLetterScreen 197줄) 은 line range reference + 변환 패턴. 작은 자산은 전체 코드.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Vitest 4 + RTL · ESLint 9. AGENTS.md 의 Next.js breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-cover-letters-design.md`

**Branch base:** `develop` (#18 retro 머지됨, head `7458c6c`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/app/(app)/cover-letters/layout.tsx` | modify | sidenav-rail 제거 → cluster shell (sub-tabs 도입) |
| `frontend/src/app/(app)/cover-letters/trash/page.tsx` | create | 휴지통 라우트 |
| `frontend/src/app/(app)/cover-letters/career-statement/page.tsx` | create | 경력기술서 재구조화 라우트 |
| `frontend/src/components/cover-letters/cl-sub-tabs.tsx` | create | sub-tabs 3-tab (목록 · 휴지통 · 재구조화) |
| `frontend/src/components/cover-letters/cl-card.tsx` | create | mock ClCard (master / variant 공용) |
| `frontend/src/components/cover-letters/list-content.tsx` | modify | master + variant 두 그룹 (mock ClListView) |
| `frontend/src/components/cover-letters/trash-content.tsx` | create | mock TrashView |
| `frontend/src/components/cover-letters/career-statement-content.tsx` | create | mock CareerStatementView |
| `frontend/src/components/cover-letters/write-content.tsx` | modify | mock CoverLetterScreen wrapper |
| `frontend/src/components/cover-letters/write-dual-pane.tsx` | modify | mock dual-pane 마크업 |
| `frontend/src/components/cover-letters/write-input-panel.tsx` | modify | mock input panel |
| `frontend/src/components/cover-letters/write-validation-panel.tsx` | modify | mock result panel (hallucination + matched/gap) |
| `frontend/src/components/cover-letters/posting-cta-modal.tsx` | modify | mock posting-cta-modal 정렬 |
| `frontend/src/lib/mock/cover-letters.ts` | create | MASTERS_MOCK / TRASH_MOCK / POSTINGS_FOR_PICKER_MOCK / CL_FILTERS |
| `frontend/src/styles/kit.css` | append | mock kit-cl.css 의 .cl-* selector port (sub-tabs / cl-card / trash / career-statement / dual-pane) |
| `frontend/src/components/cover-letters/__tests__/trash-content.test.tsx` | create | smoke test |
| `frontend/src/components/cover-letters/__tests__/career-statement-content.test.tsx` | create | smoke test |
| `frontend/src/components/cover-letters/__tests__/list-content.test.tsx` | modify | master + variant 두 그룹 셀렉터 |
| `frontend/src/components/cover-letters/__tests__/write-content.test.tsx` | modify | 새 dual-pane 셀렉터 |
| `frontend/src/components/cover-letters/__tests__/validation-panel.test.tsx` | modify | 새 result panel 셀렉터 |

**유지** (DEPRECATED 5.6 잔재):
- `(app)/cover-letters/master/page.tsx` (redirect)
- `master-content / master-editor / item-type-list / other-masters-list` (frontend 컴포넌트, 5.6 부활 PR 에서 재사용)

---

## Task 1: cluster shell — sub-tabs 3-tab IA (commit 1)

**Files:**
- Modify: `frontend/src/app/(app)/cover-letters/layout.tsx`
- Create: `frontend/src/components/cover-letters/cl-sub-tabs.tsx`
- Append (likely): `frontend/src/styles/kit.css` (`.sub-tabs` 가 이미 kit.css 에 있는지 확인, 없으면 port)

mock 의 `CoverLettersScreen` (line 384-419) 의 cluster shell 패턴: 상단 sub-tabs + 활성 view render.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-cover-letters
git branch --show-current  # feat/realign-cover-letters
```

- [ ] **Step 2: kit.css 의 `.sub-tabs` 정의 확인**

```bash
grep -n "\.sub-tabs\|\.sub-tab\b" frontend/src/styles/kit.css | head -10
```

만약 비어있거나 일부만 → mock 의 kit-cl.css 또는 kit.css 의 `.sub-tabs` rule 을 찾아 frontend kit.css 에 port.

```bash
grep -n "\.sub-tabs\|\.sub-tab\b" design_system/project/ui_kits/web/kit.css design_system/project/ui_kits/web/kit-cl.css | head -10
```

부족분 frontend kit.css 에 append.

- [ ] **Step 3: cl-sub-tabs.tsx 신규**

`frontend/src/components/cover-letters/cl-sub-tabs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: "list" | "trash" | "career-statement"; label: string; href: string };

const TABS: Tab[] = [
  { id: "list",              label: "자소서",         href: "/cover-letters" },
  { id: "trash",             label: "휴지통",         href: "/cover-letters/trash" },
  { id: "career-statement",  label: "경력기술서 재구조화", href: "/cover-letters/career-statement" },
];

export function ClSubTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="sub-tabs" aria-label="자소서 sub-navigation">
      {TABS.map((tab) => {
        const active =
          tab.id === "list"
            ? pathname === "/cover-letters"
            : pathname.startsWith(tab.href);
        return (
          <Link key={tab.id} href={tab.href} className={`sub-tab${active ? " active" : ""}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: layout.tsx 갱신 (sidenav-rail 제거)**

`frontend/src/app/(app)/cover-letters/layout.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { ClSubTabs } from "@/components/cover-letters/cl-sub-tabs";

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  // editor route 진입 시 sub-tabs 비활성 (별도 화면)
  const inEditor = pathname.startsWith("/cover-letters/variants");
  return (
    <div className="cl-shell">
      {!inEditor && <ClSubTabs />}
      <div className="cl-main">{children}</div>
    </div>
  );
}
```

`.cl-shell` / `.cl-main` 이 kit.css 에 없다면 mock 의 패턴에서 port (단순 grid 또는 flex column).

- [ ] **Step 5: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 139 tests passed (변동 없음 — 마크업만 일부 변경, 셀렉터 영향 없음 기대). 만약 layout test 가 sidenav-rail 셀렉터 검증 중이면 갱신.

```bash
grep -rn "sidenav-rail\|SidenavRail" frontend/src --include="*.test.tsx" | head -5
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/app/\(app\)/cover-letters/layout.tsx \
        frontend/src/components/cover-letters/cl-sub-tabs.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(cl): cluster shell — sub-tabs 3-tab IA

mock 의 CoverLettersScreen (line 384-419) cluster shell 패턴 도입.

- sidenav-rail (cross-category "자소서 / 경력기술서") 제거
- cl-sub-tabs.tsx: 자소서 / 휴지통 / 경력기술서 재구조화 3-tab
- layout.tsx: .cl-shell + .cl-main. editor route (/cover-letters/variants/*)
  진입 시 sub-tabs 비활성
- 부족 selector (.sub-tabs / .sub-tab / .cl-shell / .cl-main) kit.css port

cross-category "경력기술서" 링크는 TopNav 의 "내 정보 > 경력기술" 진입으로 대체.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ClListView 정렬 — master + variant 두 그룹 (commit 2)

**Files:**
- Create: `frontend/src/components/cover-letters/cl-card.tsx`
- Create: `frontend/src/lib/mock/cover-letters.ts`
- Modify: `frontend/src/components/cover-letters/list-content.tsx`
- Modify: `frontend/src/components/cover-letters/__tests__/list-content.test.tsx`

mock JSX: ClCard (line 43-77) + ClListView (line 79-137). 두 그룹 (`MASTERS` line 23-29 + `VARIANTS` line 30-42) 카드.

- [ ] **Step 1: mock 데이터 신규**

`frontend/src/lib/mock/cover-letters.ts`:

```ts
export type ClMasterMock = {
  id: string;
  title: string;
  itemType: string;
  updatedAt: string;
  preview: string;
};

export type ClVariantMock = {
  id: string;
  title: string;
  postingTitle: string;
  company: string;
  updatedAt: string;
  preview: string;
  matchPct: number;
};

export const MASTERS_MOCK: ClMasterMock[] = [
  { id: "m-1", title: "마스터 자소서 (백엔드)", itemType: "지원동기 · 입사 후 포부 · 강약점", updatedAt: "2026-05-08", preview: "API 캐시 적중률 개선 · 결제 정산 도메인 …" },
  { id: "m-2", title: "마스터 자소서 (개발자 일반)",       itemType: "협업 · 갈등 해결 · 성장 경험",  updatedAt: "2026-04-22", preview: "팀 6명, 스프린트 단위 회고 운영 …" },
];

export const CL_FILTERS = [
  { id: "all",     label: "전체"     },
  { id: "draft",   label: "초안"     },
  { id: "review",  label: "검토중"   },
  { id: "final",   label: "완성"     },
];
```

- [ ] **Step 2: ClCard 컴포넌트 신규**

`frontend/src/components/cover-letters/cl-card.tsx`:

mock JSX [screen-cover-letters.jsx:43-77](design_system/project/ui_kits/web/screen-cover-letters.jsx) 의 ClCard 마크업 그대로 옮김.

```tsx
"use client";

type Props = {
  item: {
    id: string;
    title: string;
    updatedAt: string;
    preview: string;
    /* variant 전용 */ postingTitle?: string;
    /* variant 전용 */ company?: string;
    /* variant 전용 */ matchPct?: number;
    /* master 전용 */  itemType?: string;
  };
  master?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
};

export function ClCard({ item, master = false, disabled = false, onOpen }: Props) {
  const className = `cl-card${master ? " master" : ""}${disabled ? " disabled" : ""}`;
  return (
    <article
      className={className}
      onClick={disabled ? undefined : onOpen}
      role={onOpen && !disabled ? "button" : undefined}
      tabIndex={onOpen && !disabled ? 0 : undefined}
      aria-disabled={disabled ? true : undefined}
      title={disabled ? "준비중" : undefined}
    >
      {/* mock 마크업 — line 44-76 의 마크업을 ClCard props 로 데이터 바인딩 */}
      {/* implementer 가 mock 본문을 참조하여 카드 내부 마크업 구현 */}
      {/* 마스터: title + itemType + updatedAt + preview + (mock 의 master 배지) */}
      {/* 변형: title + postingTitle + company + matchPct + updatedAt + preview */}
      <div className="cl-card-head">
        <h3 className="cl-card-title">{item.title}</h3>
        {master && <span className="cl-card-badge">마스터</span>}
      </div>
      <div className="cl-card-meta">
        {master ? item.itemType : `${item.company} · ${item.postingTitle}`}
      </div>
      <p className="cl-card-preview">{item.preview}</p>
      <div className="cl-card-foot">
        <span className="cl-card-updated">최근 수정 {item.updatedAt}</span>
        {!master && typeof item.matchPct === "number" && (
          <span className="cl-card-match">매칭 {item.matchPct}%</span>
        )}
      </div>
    </article>
  );
}
```

(implementer 는 mock 의 정확한 className 과 마크업 디테일을 mock 본문에서 다시 확인하고 위 골격을 정합.)

- [ ] **Step 3: list-content.tsx 갱신**

기존 list-content.tsx 의 props 와 API 호출 유지하되 마크업을 mock ClListView (line 79-137) 패턴으로:
- 필터 strip (CL_FILTERS, 옵션 — mock 에 있으면)
- 마스터 그룹 (MASTERS_MOCK 의 카드 + disabled)
- 변형 그룹 (기존 API 데이터)

- [ ] **Step 4: list-content.test 셀렉터 갱신**

기존 테스트가 옛 마크업 검증 시 새 className 으로 갱신. 갱신 어려운 케이스는 임시 `it.skip` + `// TODO Task 8` 코멘트.

- [ ] **Step 5: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/cover-letters/cl-card.tsx \
        frontend/src/components/cover-letters/list-content.tsx \
        frontend/src/components/cover-letters/__tests__/list-content.test.tsx \
        frontend/src/lib/mock/cover-letters.ts \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(cl): ClListView 목록 정렬 — master + variant 두 그룹

mock: screen-cover-letters.jsx 의 ClListView (line 79-137) + ClCard (line 43-77).

- cl-card.tsx 신규: master / variant 공용 카드 (props 기반 분기)
- list-content.tsx: master 그룹 (MASTERS_MOCK, disabled) + variant 그룹
  (기존 5.7 variant API 데이터) 두 그룹 마크업
- mock/cover-letters.ts 신규: ClMasterMock·ClVariantMock 타입 + MASTERS_MOCK
  + CL_FILTERS
- master 카드는 disabled — 클릭 시 "준비중" 표시. master CRUD 부활은 별도 PR

kit.css 의 .cl-card 관련 selector 부족 시 mock kit-cl.css 에서 port.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TrashView + /cover-letters/trash 신규 (commit 3)

**Files:**
- Create: `frontend/src/app/(app)/cover-letters/trash/page.tsx`
- Create: `frontend/src/components/cover-letters/trash-content.tsx`
- Create: `frontend/src/components/cover-letters/__tests__/trash-content.test.tsx`
- Modify: `frontend/src/lib/mock/cover-letters.ts` (TRASH_MOCK append)

mock: TRASH_ITEMS (line 138-143) + TrashView (line 144-202).

- [ ] **Step 1: TRASH_MOCK 추가**

`frontend/src/lib/mock/cover-letters.ts` 끝에 append:

```ts
export type ClTrashItemMock = {
  id: string;
  title: string;
  kind: "master" | "variant";
  deletedAt: string;     // ISO date
  daysUntilPurge: number;
};

export const TRASH_MOCK: ClTrashItemMock[] = [
  { id: "t-1", title: "변형본 — 네이버 백엔드 (2026-04)", kind: "variant", deletedAt: "2026-05-12", daysUntilPurge: 22 },
  { id: "t-2", title: "변형본 — 카카오 백엔드 (2026-04)", kind: "variant", deletedAt: "2026-05-05", daysUntilPurge: 15 },
  { id: "t-3", title: "마스터 자소서 (지난 버전)",          kind: "master",  deletedAt: "2026-04-28", daysUntilPurge: 8  },
];
```

- [ ] **Step 2: 실패 테스트 작성**

`frontend/src/components/cover-letters/__tests__/trash-content.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrashContent } from "../trash-content";
import { TRASH_MOCK } from "@/lib/mock/cover-letters";

describe("TrashContent", () => {
  it("renders all trash items with title + days-until-purge", () => {
    render(<TrashContent data={TRASH_MOCK} />);
    expect(screen.getByText(/네이버 백엔드/)).toBeInTheDocument();
    expect(screen.getByText(/카카오 백엔드/)).toBeInTheDocument();
    expect(screen.getByText(/지난 버전/)).toBeInTheDocument();
    expect(screen.getByText(/22일/)).toBeInTheDocument();
  });

  it("renders empty state when no trash items", () => {
    render(<TrashContent data={[]} />);
    expect(screen.getByText(/휴지통이 비어있어요|아직 휴지통/)).toBeInTheDocument();
  });

  it("restore + delete buttons are disabled (UI mock-only)", () => {
    render(<TrashContent data={TRASH_MOCK} />);
    const restoreButtons = screen.getAllByRole("button", { name: /복원/ });
    restoreButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
```

Run `npm run test -- trash-content` → FAIL (모듈 없음).

- [ ] **Step 3: trash-content.tsx 신규**

mock 의 TrashView (line 144-202) 마크업 그대로. data props 패턴. 모든 action 버튼은 disabled (UI mock-only, BE 부재).

implementer 는 mock 마크업을 읽어 frontend 컴포넌트로 변환. 마크업 className 1:1 일치.

테스트 통과 확인.

- [ ] **Step 4: trash 라우트 신규**

`frontend/src/app/(app)/cover-letters/trash/page.tsx`:

```tsx
import { TrashContent } from "@/components/cover-letters/trash-content";
import { TRASH_MOCK } from "@/lib/mock/cover-letters";

export default function CoverLettersTrashPage() {
  return <TrashContent data={TRASH_MOCK} />;
}
```

- [ ] **Step 5: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 142 tests passed (139 + 3 신규).

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/app/\(app\)/cover-letters/trash/ \
        frontend/src/components/cover-letters/trash-content.tsx \
        frontend/src/components/cover-letters/__tests__/trash-content.test.tsx \
        frontend/src/lib/mock/cover-letters.ts \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(cl): TrashView + /cover-letters/trash 신규 (UI mock-only)

mock: screen-cover-letters.jsx 의 TRASH_ITEMS (line 138) + TrashView
(line 144-202).

- /cover-letters/trash 신규 라우트
- trash-content.tsx: 삭제된 자소서 리스트 + 복원/영구삭제 버튼 (disabled)
  + 30일 카운트다운 표시 + 빈 상태
- mock/cover-letters.ts: ClTrashItemMock 타입 + TRASH_MOCK 3건
- smoke test 3개: 리스트 / 빈 상태 / 복원 버튼 disabled

UI mock-only — BE soft-delete endpoint + 30일 자동 삭제 schedule 은 별도
issue spawn 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: CareerStatementView + /cover-letters/career-statement 신규 (commit 4)

**Files:**
- Create: `frontend/src/app/(app)/cover-letters/career-statement/page.tsx`
- Create: `frontend/src/components/cover-letters/career-statement-content.tsx`
- Create: `frontend/src/components/cover-letters/__tests__/career-statement-content.test.tsx`
- Modify: `frontend/src/lib/mock/cover-letters.ts` (POSTINGS_FOR_PICKER_MOCK + CAREER_STATEMENT_RESULT_MOCK append)

mock: POSTINGS_FOR_PICKER (line 205-211) + CareerStatementView (line 212-382, ~170줄). 가장 큰 신규 view.

- [ ] **Step 1: POSTINGS_FOR_PICKER_MOCK + 결과 mock 추가**

`frontend/src/lib/mock/cover-letters.ts` 끝에 append:

```ts
export type PostingPickerMock = {
  id: string;
  company: string;
  title: string;
  selected?: boolean;
};

export type CareerStatementSection = {
  heading: string;       // 예: "Problem", "Approach", "Result"
  bullets: string[];
};

export type CareerStatementResultMock = {
  projectName: string;
  sections: CareerStatementSection[];
  status: "draft" | "ready";
};

export const POSTINGS_FOR_PICKER_MOCK: PostingPickerMock[] = [
  { id: "p-1", company: "네이버",   title: "백엔드 신입 / 주니어",  selected: true },
  { id: "p-2", company: "카카오",   title: "백엔드 (Saas 팀)" },
  { id: "p-3", company: "토스",     title: "Server Engineer" },
  { id: "p-4", company: "(주)테크", title: "백엔드 (경력 2~5년)" },
];

export const CAREER_STATEMENT_RESULT_MOCK: CareerStatementResultMock = {
  projectName: "식권 정산 API · 캐시 적중률 개선",
  sections: [
    { heading: "Problem", bullets: ["월말 정산 API 평균 응답 340ms · 캐시 적중률 23%"] },
    { heading: "Approach", bullets: ["Redis hot-key 분석", "TTL 정책 + write-through 도입"] },
    { heading: "Result",   bullets: ["응답 340ms → 110ms (68% ↓)", "캐시 적중률 71% (3.1x)"] },
  ],
  status: "draft",
};
```

- [ ] **Step 2: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CareerStatementContent } from "../career-statement-content";
import { POSTINGS_FOR_PICKER_MOCK, CAREER_STATEMENT_RESULT_MOCK } from "@/lib/mock/cover-letters";

describe("CareerStatementContent", () => {
  it("renders posting picker with all postings", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    expect(screen.getByText("네이버")).toBeInTheDocument();
    expect(screen.getByText("카카오")).toBeInTheDocument();
    expect(screen.getByText("토스")).toBeInTheDocument();
  });

  it("renders selected posting highlight", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    const selected = document.querySelector(".posting-picker .item.selected");
    expect(selected).not.toBeNull();
  });

  it("renders result project name + 3 sections (Problem · Approach · Result)", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    expect(screen.getByText(/식권 정산 API/)).toBeInTheDocument();
    expect(screen.getByText("Problem")).toBeInTheDocument();
    expect(screen.getByText("Approach")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

Run `npm run test -- career-statement-content` → FAIL.

- [ ] **Step 3: career-statement-content.tsx 신규**

mock 의 CareerStatementView (line 212-382) 마크업을 frontend 컴포넌트로 변환. 큰 view 라 implementer 가 mock 본문을 직접 읽어 className 1:1 정합:
- 좌측: posting-picker (POSTINGS_FOR_PICKER 리스트)
- 중앙/우측: 재구조화 결과 (Problem / Approach / Result 3 sections)
- 액션 버튼: "재추출" / "경력기술서 항목으로 저장" 등 (disabled — UI mock-only)

Props:
```tsx
type Props = {
  postings: PostingPickerMock[];
  result: CareerStatementResultMock;
};
```

테스트 통과 확인.

- [ ] **Step 4: career-statement 라우트 신규**

```tsx
import { CareerStatementContent } from "@/components/cover-letters/career-statement-content";
import { POSTINGS_FOR_PICKER_MOCK, CAREER_STATEMENT_RESULT_MOCK } from "@/lib/mock/cover-letters";

export default function CoverLettersCareerStatementPage() {
  return <CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />;
}
```

- [ ] **Step 5: 빌드 + lint + test 통과**

Expected: 145 tests passed (142 + 3).

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/app/\(app\)/cover-letters/career-statement/ \
        frontend/src/components/cover-letters/career-statement-content.tsx \
        frontend/src/components/cover-letters/__tests__/career-statement-content.test.tsx \
        frontend/src/lib/mock/cover-letters.ts \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(cl): CareerStatementView + /cover-letters/career-statement 신규 (UI mock-only)

mock: screen-cover-letters.jsx 의 POSTINGS_FOR_PICKER (line 205) +
CareerStatementView (line 212-382, ~170줄).

- /cover-letters/career-statement 신규 라우트
- career-statement-content.tsx: posting-picker (좌측, 4개) + 재구조화 결과
  (Problem · Approach · Result 3 sections) + 액션 버튼 (disabled)
- mock/cover-letters.ts: PostingPickerMock / CareerStatementSection /
  CareerStatementResultMock 타입 + 4개 picker + 1개 결과
- smoke test 3개

UI mock-only — BE 경력기술서 재구조화 LLM service 는 별도 issue spawn 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: dual-pane 에디터 mock 정렬 (가장 무거운 task, commit 5)

**Files:**
- Modify: `frontend/src/components/cover-letters/write-content.tsx`
- Modify: `frontend/src/components/cover-letters/write-dual-pane.tsx`
- Modify: `frontend/src/components/cover-letters/write-input-panel.tsx`
- Modify: `frontend/src/components/cover-letters/write-validation-panel.tsx`
- Modify: `frontend/src/components/cover-letters/__tests__/write-content.test.tsx` (it.skip 가능)
- Modify: `frontend/src/components/cover-letters/__tests__/validation-panel.test.tsx` (it.skip 가능)

mock: `screen-cover-letter.jsx` (197줄 전체). DRAFT_PARAGRAPH (line 6-18) + CoverLetterScreen (line 19-196).

mock 의 dual-pane 구조:
- 좌측 input panel: 공고 정보 + 요청사항 + 사용자 답변 textarea
- 우측 result panel: AI 초안 (DRAFT_PARAGRAPH) + hallucination 플래그 + matched 키워드 (mint) + gap 키워드 (peach)

변환 규칙:
- 마크업 className 1:1 mock 정렬
- 기존 props (write store) 그대로 유지
- `Ico.X` 사용을 전역 `@/components/ui/icons` 로 (cluster-local 이 있다면)

- [ ] **Step 1: write-content.tsx 갱신**

mock 의 CoverLetterScreen wrapper (line 19-30, line 190-196) 마크업 그대로. 기존 props·API 호출 유지.

- [ ] **Step 2: write-dual-pane.tsx 갱신**

mock 의 dual-pane 컨테이너 마크업 (.cl-edit-shell / .cl-edit-main / .cl-pane.left / .cl-pane.right 등 — mock 본문 확인).

- [ ] **Step 3: write-input-panel.tsx 갱신**

mock 좌측 input panel 마크업: 공고 정보 + 항목 헤더 + 사용자 답변 textarea + 키워드 hint.

- [ ] **Step 4: write-validation-panel.tsx 갱신**

mock 우측 result panel 마크업: AI 초안 paragraph (DRAFT_PARAGRAPH 패턴 — `.cl-result-para`) + hallucination 플래그 (`.cl-hallucination`) + 키워드 chip (`.cl-kw.match` / `.cl-kw.gap`) + AI verify 액션 버튼.

- [ ] **Step 5: 통합 테스트 임시 skip**

write-content.test 와 validation-panel.test 의 기존 셀렉터 가 새 마크업과 안 맞으면 임시 `it.skip` + `// TODO Task 8` 코멘트.

```bash
cd frontend && npm run test -- write-content validation-panel
```

깨지는 케이스만 skip 처리. 셀렉터를 자연스럽게 갱신 가능하면 즉시 갱신.

- [ ] **Step 6: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: lint 0 errors, all active tests pass (skip 있음), build OK.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/components/cover-letters/write-content.tsx \
        frontend/src/components/cover-letters/write-dual-pane.tsx \
        frontend/src/components/cover-letters/write-input-panel.tsx \
        frontend/src/components/cover-letters/write-validation-panel.tsx \
        frontend/src/components/cover-letters/__tests__/write-content.test.tsx \
        frontend/src/components/cover-letters/__tests__/validation-panel.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(cl): dual-pane 에디터 mock 정렬

mock: screen-cover-letter.jsx (197줄 전체) — CoverLetterScreen
(line 19-196) 의 dual-pane 마크업.

- write-content: CoverLetterScreen wrapper 정렬
- write-dual-pane: .cl-edit-shell / .cl-pane.left / .cl-pane.right 컨테이너
- write-input-panel: 좌측 input panel 마크업 (공고 정보 · 항목 헤더 ·
  textarea · 키워드 hint)
- write-validation-panel: 우측 result panel 마크업 (AI 초안 paragraph ·
  hallucination 플래그 · matched/gap 키워드 chip · AI verify 버튼)

기존 props · API 호출 (5.7 write store) 모두 유지. 마크업만 정렬.

일부 통합 테스트 임시 it.skip — task 8 에서 일괄 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: posting-cta-modal 정렬 (commit 6)

**Files:**
- Modify: `frontend/src/components/cover-letters/posting-cta-modal.tsx`

mock 의 posting-cta-modal 또는 이와 비슷한 modal 패턴 (CoverLetterScreen 안 또는 ClListView 안에서 호출) 확인 후 정합.

- [ ] **Step 1: mock 의 posting-cta 패턴 확인**

```bash
grep -n "posting-cta\|posting_cta\|PostingCta" design_system/project/ui_kits/web/screen-cover-letters.jsx design_system/project/ui_kits/web/screen-cover-letter.jsx
```

만약 직접적인 mock 컴포넌트가 없으면 frontend 의 기존 modal 마크업이 mock 의 modal 패턴 (예: PortfolioModal 의 .pf-modal 같은 generic modal) 과 정합하는지 확인. 만약 정합이 충분하면 변경 최소화 — 클래스명만 mock 패턴으로 정리.

- [ ] **Step 2: posting-cta-modal.tsx 갱신**

mock 의 modal 패턴 (.modal / .modal-backdrop / .modal-head / .modal-body / .modal-foot 또는 비슷한 generic modal class) 정합. 기존 props · onClose 로직 유지.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/cover-letters/posting-cta-modal.tsx \
        frontend/src/styles/kit.css 2>/dev/null
git commit -m "$(cat <<'EOF'
refactor(cl): posting-cta-modal mock 패턴 정렬

mock 의 modal 패턴 (.modal-backdrop / .modal / .head / .body / .foot 또는
이미 도입한 .pf-modal 비슷 generic class) 으로 className 정렬. 기존 props·
onClose 로직 유지.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: cluster-local 자산 정리 + kit.css port (commit 7)

**Files:**
- Modify: `frontend/src/styles/kit.css` (mock kit-cl.css 의 잔여 selector port)
- Modify: 모든 cluster 컴포넌트의 cluster-local icons import (있다면 → 전역)

dashboard.css / career.css 패턴.

- [ ] **Step 1: cluster CSS 추출 + cross-check**

```bash
cd /Users/sungjiwon/claude/2chi_v1
ls frontend/src/app/\(app\)/cover-letters/*.css 2>/dev/null  # 별도 cluster CSS 가 있는지
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" design_system/project/ui_kits/web/kit-cl.css | sort -u > /tmp/cl_mock.txt
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_fe.txt
comm -23 /tmp/cl_mock.txt /tmp/kit_fe.txt > /tmp/cl_missing.txt
cat /tmp/cl_missing.txt
```

mock kit-cl.css 의 selector 중 frontend kit.css 에 없는 것 + 실제 사용 중인 것 → port. 사용 안 하는 것은 drop.

- [ ] **Step 2: cluster-local icons 정리**

```bash
grep -rn "from \"./icons\"\|from \"../icons\"\|from \"@/components/cover-letters/icons\"" frontend/src/components/cover-letters/
```

cluster-local icons 가 있다면 전역 `@/components/ui/icons` 로 import 교체 + 파일 삭제.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/cover-letters/ frontend/src/styles/kit.css
git status --short
git commit -m "$(cat <<'EOF'
chore(cl): cluster-local 자산 정리 + kit.css port

dashboard.css / career.css 패턴 — mock kit-cl.css 의 cl-specific selector
중 사용 중인 것만 frontend kit.css 에 port. cluster-local icons 가 있다면
전역 @/components/ui/icons 로 교체.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 통합 테스트 갱신 (commit 8)

**Files:**
- Modify: `frontend/src/components/cover-letters/__tests__/list-content.test.tsx`
- Modify: `frontend/src/components/cover-letters/__tests__/write-content.test.tsx`
- Modify: `frontend/src/components/cover-letters/__tests__/validation-panel.test.tsx`

task 2 / 5 에서 임시 `it.skip` 처리한 케이스 일괄 갱신.

- [ ] **Step 1: skip 식별**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
grep -rn "it.skip\|test.skip" src/components/cover-letters/__tests__/
```

- [ ] **Step 2: 각 skip 케이스를 새 마크업에 맞춰 갱신**

implementer 가 mock JSX 와 frontend 의 현재 마크업을 비교 후 셀렉터를 className/카피 기반으로 갱신.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 모든 테스트 PASS, skip 0건.

```bash
grep -rn "it.skip\|test.skip" src/components/cover-letters/__tests__/
```

Expected: empty.

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/cover-letters/__tests__/
git commit -m "$(cat <<'EOF'
test(cl): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

task 2 / task 5 에서 임시 it.skip 처리한 케이스들을 모두 최종 마크업에 맞춰
정합. className 기반 셀렉터 + mock JSX 의 카피 텍스트 사용. skip 0건.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR 생성

8 commit 완료 후 controller 수행:

- [ ] develop 동기화
- [ ] dev 서버 sanity check (4 routes: `/cover-letters`, `/cover-letters/trash`, `/cover-letters/career-statement`, `/cover-letters/variants/new`)
- [ ] `git push -u origin feat/realign-cover-letters`
- [ ] `gh pr create --base develop --title "feat: realign cover-letters cluster — design_system mock 픽셀 재현 (2단계 3번)" --body "..."`

---

## 완료 조건

- 8 task commit 완료
- 각 commit 단위 build/lint/test 통과
- 최종 skip 0건
- 신규 컴포넌트 4 (ClSubTabs / ClCard / TrashContent / CareerStatementContent) + 신규 라우트 2 (/trash + /career-statement) + 신규 mock 데이터
- master 카드는 mock JSON disabled (5.6 master CRUD 부활은 별도 PR)
- 5.6 잔재 컴포넌트 보존 (DEPRECATED)
- mock JSX 의 cluster sub-tabs IA + 마크업 정합
- PR 생성 + CI 통과
