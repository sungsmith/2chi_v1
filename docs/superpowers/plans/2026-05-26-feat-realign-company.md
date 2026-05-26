# 2단계 PR 4번 (`feat/realign-company`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/company` cluster (채용공고 목록·등록·상세 / 기업분석 목록·입력·결과) 화면을 mock 과 픽셀 단위로 재정렬. 채용공고 상세 + 등록 별도 라우트 신규 추가. sidenav-rail → co-side-nav 정합.

**Architecture:** mock JSX 마크업·className 을 frontend 컴포넌트에 그대로 옮김. 9-commit 점진 분할 (각 commit 빌드 통과 보장). 큰 mock view (PostingDetailView line 446-650 ~200줄, CompanyAnalysisView line 112-311 ~200줄) 는 line range reference + 변환 규칙. 작은 자산은 전체 코드.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Vitest 4 + RTL · ESLint 9. AGENTS.md 의 Next.js breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-company-design.md`

**Branch base:** `develop` (#19 머지됨, head `a5ef7a1`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/app/(app)/company/layout.tsx` | modify | sidenav-rail → co-side-nav |
| `frontend/src/app/(app)/company/postings/new/page.tsx` | create | 채용공고 등록 라우트 |
| `frontend/src/app/(app)/company/postings/[id]/page.tsx` | create | 채용공고 상세 라우트 |
| `frontend/src/components/company/co-side-nav.tsx` | create | mock CompanySideNav (.side-nav 클래스) |
| `frontend/src/components/company/posting-detail-content.tsx` | create | mock PostingDetailView (~200줄) |
| `frontend/src/components/company/posting-new-content.tsx` | create | mock PostingNewScreen wrapper |
| `frontend/src/components/company/postings-content.tsx` | modify | mock PostingListView 마크업. "+ 등록" → /new 라우트 |
| `frontend/src/components/company/posting-card.tsx` | modify | mock posting-card 마크업 |
| `frontend/src/components/company/analysis-list-content.tsx` | modify | mock AnalysisListView |
| `frontend/src/components/company/analysis-create-form.tsx` | modify | mock CompanyAnalysisEntry |
| `frontend/src/components/company/analysis-detail-content.tsx` | modify | mock CompanyAnalysisView |
| `frontend/src/components/company/posting-tabs.tsx` / `posting-url-form.tsx` / `posting-manual-form.tsx` / `posting-fields.tsx` / `url-input-list.tsx` | modify | mock PostingNewScreen 내부 정합 |
| `frontend/src/styles/kit.css` | append | mock kit-company.css 의 .co-* selector port |
| `frontend/src/components/company/__tests__/posting-detail-content.test.tsx` | create | smoke test |
| `frontend/src/components/company/__tests__/posting-new-content.test.tsx` | create | smoke test |
| `frontend/src/components/company/__tests__/*` (5 기존) | modify | 새 마크업 셀렉터 갱신 |

**Delete (task 8 확인 후)**:
- `frontend/src/components/company/sidenav-rail.tsx` (사용처 0 시)

**유지**:
- `posting-edit-modal.tsx` (편집 흐름 유지)
- `keyword-chip-list.tsx` (그대로 재활용)

---

## Task 1: cluster shell — co-side-nav + .side-nav 클래스 (commit 1)

**Files:**
- Create: `frontend/src/components/company/co-side-nav.tsx`
- Modify: `frontend/src/app/(app)/company/layout.tsx`

mock JSX [screen-company.jsx:8-43](design_system/project/ui_kits/web/screen-company.jsx) — CO_NAV + CompanySideNav.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-company
git branch --show-current  # feat/realign-company
```

- [ ] **Step 2: co-side-nav.tsx 신규**

`frontend/src/components/company/co-side-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "postings" | "analysis"; label: string; href: string; pill?: string; pillTitle?: string };

const CO_NAV: NavItem[] = [
  { id: "postings", label: "채용공고", href: "/company/postings", pill: "—", pillTitle: "마감되지 않은 진행중 공고 수 (실제 데이터 연동 시 갱신)" },
  { id: "analysis", label: "기업분석", href: "/company/analysis" },
];

export function CoSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">기업</div>
      {CO_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.id} href={item.href} className={`nav-item${active ? " active" : ""}`}>
            <span className="label">{item.label}</span>
            {item.pill && (
              <span className="pill" title={item.pillTitle}>
                {item.pill}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
```

(pill 의 카운트 `"—"` 는 임시 — BE 가 진행 공고 수 endpoint 추가 시 props 로 받아서 표시. 지금은 mock 의 8 또는 dash.)

- [ ] **Step 3: layout.tsx 갱신**

`frontend/src/app/(app)/company/layout.tsx`:

```tsx
"use client";

import { CoSideNav } from "@/components/company/co-side-nav";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="co-shell">
      <CoSideNav />
      <main className="co-main">{children}</main>
    </div>
  );
}
```

`.co-shell` / `.co-main` 가 kit.css 에 있는지 확인:

```bash
grep -n "\.co-shell\|\.co-main" frontend/src/styles/kit.css | head -5
```

없으면 mock kit-company.css / kit.css 에서 port (단순 grid 또는 flex):

```css
.co-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: calc(100vh - 56px);
}
.co-main {
  overflow: auto;
}
```

`.side-nav` / `.nav-item` / `.pill` / `.crumb` 는 me PR 에서 이미 kit.css 에 port 되어 있음. `.crumb` 만 별도 — me/career layout 에 있는지 확인 후 부족하면 port.

- [ ] **Step 4: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 148 tests passed (변동 없음). sidenav-rail 자체는 아직 삭제 안 함 (task 8) — 단지 layout 에서 사용 안 함.

- [ ] **Step 5: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/company/co-side-nav.tsx \
        frontend/src/app/\(app\)/company/layout.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(co): cluster shell — co-side-nav + .side-nav 클래스

mock 의 CompanySideNav (screen-company.jsx line 22-43) 패턴 도입.

- co-side-nav.tsx: 2-item (채용공고 + 기업분석) + crumb "기업" + pill (진행
  공고 수, BE 데이터 미연동이라 임시 dash)
- layout.tsx: sidenav-rail (inline style) 사용 중단 → co-side-nav + .co-shell
  + .co-main. me PR 에서 port 한 .side-nav / .nav-item / .pill 재사용

sidenav-rail.tsx 자체는 task 8 에서 사용처 0 확인 후 삭제 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: PostingListView 마크업 정렬 (commit 2)

**Files:**
- Modify: `frontend/src/components/company/postings-content.tsx`
- Modify: `frontend/src/components/company/posting-card.tsx`
- Modify (if test breaks): `frontend/src/components/company/__tests__/posting-card.test.tsx` / `postings-content.test.tsx`

mock JSX [screen-company.jsx:44-110](design_system/project/ui_kits/web/screen-company.jsx) — PostingListView + POSTINGS mock 데이터.

- [ ] **Step 1: mock 마크업 분석**

mock 의 PostingListView 핵심 요소:
- 헤더 strip (제목 + count + 필터/정렬 chip + "+ 등록" 버튼)
- 카드 grid (posting-card 다수)
- posting-card: 회사·직무·역할·src(saramin/url/manual)·dday·match·soon(D-3 이하)·closed·added

posting-card 의 className 1:1 mock 정렬. 기존 props (`posting: JobPosting`) 유지.

- [ ] **Step 2: postings-content.tsx 갱신**

mock 마크업으로 헤더 strip + grid 정렬. "+ 등록" 버튼은 `<Link href="/company/postings/new">` 로 (modal trigger 제거 — task 4 에서 modal 자체는 편집용으로만).

```tsx
// 헤더 영역 마크업 골격
<header className="co-list-head">
  <div className="lead">
    <h1>채용공고</h1>
    <span className="count">{postings.length}건</span>
  </div>
  <div className="actions">
    <Link href="/company/postings/new" className="btn primary">+ 공고 등록</Link>
  </div>
</header>
<div className="co-grid">
  {postings.map((p) => <PostingCard key={p.id} posting={p} />)}
</div>
```

(implementer 가 mock 본문에서 정확한 className · 헤더 텍스트 · sort/filter chip 등 추출.)

- [ ] **Step 3: posting-card.tsx 갱신**

mock posting-card 마크업 (line 44-110 안의 카드 부분):
- header row: co 로고/약자 + 회사명 + src 배지 + dday (soon 클래스)
- body: nm (직무 제목) + role 메타
- foot: match % + added (등록일)
- closed 시 .closed 클래스 추가
- 카드 전체 클릭 시 `/company/postings/${id}` 로 이동

- [ ] **Step 4: 테스트 갱신 또는 임시 skip**

```bash
cd frontend && npm run test -- posting-card postings-content
```

깨지는 케이스 → 셀렉터 갱신 또는 `it.skip` + `// TODO Task 9` 코멘트.

- [ ] **Step 5: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 6: kit.css 의 .co-list-head / .co-grid / .posting-card 등 selector port**

```bash
grep -n "\.co-list-head\|\.co-grid\|\.posting-card" frontend/src/styles/kit.css
```

없는 selector → mock kit-company.css 에서 port.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/components/company/postings-content.tsx \
        frontend/src/components/company/posting-card.tsx \
        frontend/src/components/company/__tests__/posting-card.test.tsx \
        frontend/src/components/company/__tests__/postings-content.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(co): PostingListView 마크업 정렬

mock: screen-company.jsx 의 PostingListView (line 44-110) + posting-card.

- postings-content: header strip (제목·count·필터/정렬) + grid. "+ 등록"
  버튼이 /company/postings/new 라우트로 이동 (modal create 흐름 제거)
- posting-card: 회사·직무·src·dday·match·soon·closed·added 마크업 정합.
  카드 클릭 시 /company/postings/${id} 라우트로 이동
- kit.css 의 .co-list-head / .co-grid / .posting-card port

기존 5.5 fetchPostings API 호출 그대로. 일부 통합 테스트 임시 skip — task 9
에서 일괄 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: PostingDetailView + /company/postings/[id] 신규 (가장 무거운 task, commit 3)

**Files:**
- Create: `frontend/src/app/(app)/company/postings/[id]/page.tsx`
- Create: `frontend/src/components/company/posting-detail-content.tsx`
- Create: `frontend/src/components/company/__tests__/posting-detail-content.test.tsx`

mock JSX [screen-company.jsx:446-650](design_system/project/ui_kits/web/screen-company.jsx) — PostingDetailView ~200줄.

mock detail 마크업 핵심:
- 헤더: 뒤로 가기 + 회사 + 직무 + dday + match + "자소서 작성" / "편집" / "삭제" 액션
- 좌측 main: 직무 설명 + 우대 사항 + 키워드 (matched + gap)
- 우측 aside: 회사 메타 + 등록 정보 + 자소서 작성 CTA

- [ ] **Step 1: 실패 테스트 작성**

`frontend/src/components/company/__tests__/posting-detail-content.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostingDetailContent } from "../posting-detail-content";
import type { JobPosting } from "@/lib/types/posting";

const MOCK_POSTING: JobPosting = {
  // implementer 가 JobPosting 타입 보고 mock 데이터 채움 — 필수 필드만
  id: 1,
  company: "테스트회사",
  title: "백엔드 (Saas 팀)",
  // ... (JobPosting 타입의 다른 필드들)
} as JobPosting;

describe("PostingDetailContent", () => {
  it("renders company + title in header", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    expect(screen.getByText("테스트회사")).toBeInTheDocument();
    expect(screen.getByText("백엔드 (Saas 팀)")).toBeInTheDocument();
  });

  it("renders 자소서 작성 CTA button", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    expect(screen.getByRole("button", { name: /자소서 작성|작성하기/ })).toBeInTheDocument();
  });

  it("renders 편집 + 삭제 action buttons", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    expect(screen.getByRole("button", { name: /편집/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
  });
});
```

(implementer 가 `frontend/src/lib/types/posting.ts` 의 JobPosting 타입 보고 정확한 mock 데이터 채움.)

- [ ] **Step 2: posting-detail-content.tsx 신규**

mock JSX (line 446-650) 의 마크업을 그대로 옮김. props: `{ posting: JobPosting }`. 마크업 className 1:1 mock 일치. 액션 버튼:
- "자소서 작성" → `/cover-letters/variants/new?postingId=${id}` 또는 cover-letters 의 posting picker
- "편집" → posting-edit-modal open (modal 유지)
- "삭제" → `deletePosting(id)` 호출 후 `/company/postings` 로 이동

implementer 가 mock 본문에서 정확한 마크업 + 키워드 chip 표시 추출.

- [ ] **Step 3: /company/postings/[id]/page.tsx 신규**

```tsx
import { notFound } from "next/navigation";
import { fetchPosting } from "@/lib/api/posting";
import { PostingDetailContent } from "@/components/company/posting-detail-content";

export default async function PostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postingId = Number(id);
  if (Number.isNaN(postingId)) notFound();

  // server component 면 BE 호출. client component 라면 useEffect + useState.
  // Next.js 16 의 server fetch 패턴 확인 (AGENTS.md 의 node_modules/next/dist/docs 참조)
  const posting = await fetchPosting(postingId);
  return <PostingDetailContent posting={posting} />;
}
```

(server component vs client component 결정 — fetchPosting 이 server 에서 호출 가능한지 확인. http util 이 cookie 기반이면 server 에서 호출 어려울 수 있음. 그 경우 client component 로 + useEffect + loading state.)

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd frontend && npm run test -- posting-detail-content
```

- [ ] **Step 5: 빌드 + lint + test + kit.css port**

mock kit-company.css 의 detail 관련 selector (`.co-detail-shell` / `.co-detail-main` / `.co-detail-side` / `.kw-row` 등) port 필요 시.

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 151 tests passed (148 + 3 신규).

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/app/\(app\)/company/postings/\[id\]/ \
        frontend/src/components/company/posting-detail-content.tsx \
        frontend/src/components/company/__tests__/posting-detail-content.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(co): PostingDetailView + /company/postings/[id] 신규

mock: screen-company.jsx 의 PostingDetailView (line 446-650, ~200줄).

- /company/postings/[id] 신규 라우트 — fetchPosting(id) 호출
- posting-detail-content.tsx: 헤더 (뒤로·회사·직무·dday·match·액션) + 좌측
  main (직무 설명·우대·키워드) + 우측 aside (회사 메타·등록 정보·자소서 작성
  CTA)
- 액션 버튼: 자소서 작성 (cover-letters 라우트 이동), 편집 (modal open),
  삭제 (deletePosting 후 목록 이동)
- smoke test 3개

mock kit-company.css 의 detail selector kit.css 에 port.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: PostingNewContent + /company/postings/new 별도 라우트 (commit 4)

**Files:**
- Create: `frontend/src/app/(app)/company/postings/new/page.tsx`
- Create: `frontend/src/components/company/posting-new-content.tsx`
- Modify: `posting-tabs.tsx` / `posting-url-form.tsx` / `posting-manual-form.tsx` / `posting-fields.tsx` / `url-input-list.tsx` (mock 정합)
- Modify: `postings-content.tsx` (이미 task 2 에서 "+ 등록" 링크로 변경됨, modal create 흐름 정리)
- Create: `frontend/src/components/company/__tests__/posting-new-content.test.tsx`

mock JSX `screen-posting-new.jsx` (141줄 전체) + `screen-company.jsx:439-444` (PostingNewScreenEmbedded wrapper).

mock 의 PostingNewScreen 핵심:
- 헤더: "공고 등록" + 뒤로 가기
- 탭 3개: URL 붙여넣기 (active) · 직접 작성 · 채용공고 검색 (v2-locked)
- 탭별 form (mock 마크업)

- [ ] **Step 1: posting-new-content.tsx 신규**

기존 form 컴포넌트들 (posting-tabs / posting-url-form / posting-manual-form / posting-fields) 을 그대로 wrap. 마크업 골격:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { PostingTabs } from "./posting-tabs";
import { PostingUrlForm } from "./posting-url-form";
import { PostingManualForm } from "./posting-manual-form";
import { createPosting } from "@/lib/api/posting";
import type { JobPostingCreateRequest } from "@/lib/types/posting";
import { useState } from "react";

export function PostingNewContent() {
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "manual" | "search">("url");

  async function handleCreate(req: JobPostingCreateRequest) {
    const posting = await createPosting(req);
    router.push(`/company/postings/${posting.id}`);
  }

  return (
    <div className="co-posting-new">
      <header className="po-head">
        {/* mock 헤더 마크업 — 뒤로 + 제목 */}
        <h1>공고 등록</h1>
      </header>
      <PostingTabs active={tab} onChange={setTab} />
      {tab === "url"    && <PostingUrlForm    onSubmit={handleCreate} />}
      {tab === "manual" && <PostingManualForm onSubmit={handleCreate} />}
      {tab === "search" && <div className="locked-tab">v2 에서 제공 예정</div>}
    </div>
  );
}
```

(implementer 가 기존 form 컴포넌트의 props 시그니처에 맞춰 정확히 wrap.)

- [ ] **Step 2: posting-tabs / posting-url-form / posting-manual-form / posting-fields / url-input-list 마크업 정합**

mock screen-posting-new.jsx 의 form 마크업 (URL paste, manual fields) 과 비교 후 className 정합. 기존 props · onSubmit 핸들러 유지.

- [ ] **Step 3: 실패 테스트 작성**

`frontend/src/components/company/__tests__/posting-new-content.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostingNewContent } from "../posting-new-content";

describe("PostingNewContent", () => {
  it("renders URL tab by default", () => {
    render(<PostingNewContent />);
    expect(screen.getByRole("heading", { name: "공고 등록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /URL/ })).toHaveClass("active");
  });

  it("switches to manual tab", () => {
    render(<PostingNewContent />);
    const manualTab = screen.getByRole("button", { name: /직접 작성/ });
    fireEvent.click(manualTab);
    expect(manualTab).toHaveClass("active");
  });

  it("v2 search tab is locked", () => {
    render(<PostingNewContent />);
    const searchTab = screen.getByRole("button", { name: /채용공고 검색/ });
    fireEvent.click(searchTab);
    expect(screen.getByText(/v2|준비중/)).toBeInTheDocument();
  });
});
```

(implementer 가 PostingTabs 의 정확한 active class 패턴 확인 후 셀렉터 조정.)

- [ ] **Step 4: /company/postings/new/page.tsx 신규**

```tsx
import { PostingNewContent } from "@/components/company/posting-new-content";

export default function PostingNewPage() {
  return <PostingNewContent />;
}
```

- [ ] **Step 5: postings-content 의 modal create 흐름 제거**

기존 postings-content 의 PostingEditModal 의 create 모드 호출을 제거. modal 자체는 편집용 (patch) 으로만 호출되도록 정리. 통합 테스트 회귀 가능성 — 갱신 또는 skip.

- [ ] **Step 6: 빌드 + lint + test + kit.css port**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 154 tests passed (151 + 3).

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/app/\(app\)/company/postings/new/ \
        frontend/src/components/company/posting-new-content.tsx \
        frontend/src/components/company/posting-tabs.tsx \
        frontend/src/components/company/posting-url-form.tsx \
        frontend/src/components/company/posting-manual-form.tsx \
        frontend/src/components/company/posting-fields.tsx \
        frontend/src/components/company/url-input-list.tsx \
        frontend/src/components/company/postings-content.tsx \
        frontend/src/components/company/__tests__/posting-new-content.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(co): PostingNewContent + /company/postings/new 별도 라우트

mock: screen-posting-new.jsx (141줄) + screen-company.jsx 의 PostingNewScreenEmbedded.

- /company/postings/new 신규 라우트
- posting-new-content: 헤더 + 탭 3개 (URL · 직접 작성 · 검색 v2-locked) +
  기존 form 컴포넌트 (posting-tabs / posting-url-form / posting-manual-form
  / posting-fields / url-input-list) wrap. 마크업 mock 정합
- 생성 성공 시 /company/postings/${id} 라우트로 이동
- postings-content 의 modal create 흐름 제거 — modal 은 편집 (PATCH) 흐름
  으로만 유지
- smoke test 3개 (URL 탭 default · manual 탭 전환 · v2 lock)

기존 createPosting / parsePosting API 그대로 사용.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: AnalysisListView 마크업 정렬 (commit 5)

**Files:**
- Modify: `frontend/src/components/company/analysis-list-content.tsx`
- Modify (필요 시): `frontend/src/components/company/__tests__/analysis-list-content.test.tsx`

mock JSX [screen-company.jsx:313-374](design_system/project/ui_kits/web/screen-company.jsx) — AnalysisListView.

- [ ] **Step 1: mock 마크업 분석**

mock 의 AnalysisListView 핵심:
- 헤더 strip (제목 + count + "+ 신규" 버튼)
- 카드 grid (이전 분석 결과 카드들 — 회사명 + 분석일 + 키워드 미리보기 + 상태)

- [ ] **Step 2: analysis-list-content.tsx 갱신**

기존 props · API 호출 (`fetchAnalyses()` 등) 유지. 마크업만 mock 정합. "+ 신규" → `/company/analysis/new`.

- [ ] **Step 3: 테스트 갱신 또는 임시 skip**

- [ ] **Step 4: 빌드 + lint + test + kit.css port**

Expected: 154 tests passed (변동 없음, 마크업 변경만).

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/company/analysis-list-content.tsx \
        frontend/src/components/company/__tests__/analysis-list-content.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(co): AnalysisListView 마크업 정렬

mock: screen-company.jsx 의 AnalysisListView (line 313-374).

기존 5.9 fetchAnalyses API 호출 그대로. 마크업 className 1:1 mock 정합 +
"+ 신규" 버튼이 /company/analysis/new 로 이동.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: CompanyAnalysisEntry 마크업 정렬 (commit 6)

**Files:**
- Modify: `frontend/src/components/company/analysis-create-form.tsx`
- Modify (필요 시): `frontend/src/components/company/__tests__/analysis-create-form.test.tsx`

mock JSX [screen-company.jsx:651-746](design_system/project/ui_kits/web/screen-company.jsx) — CompanyAnalysisEntry.

mock 의 CompanyAnalysisEntry 핵심:
- 헤더 (제목 + 안내 카피)
- 회사명 input
- DART API mock 검색 결과 + 선택
- 사용자 URL 입력 (최대 5개)
- "분석 시작" 버튼

- [ ] **Step 1: analysis-create-form.tsx 갱신**

기존 props · API 호출 (`createAnalysis`) 유지. 마크업 className 1:1 mock 정합.

- [ ] **Step 2: 테스트 갱신**

- [ ] **Step 3: 빌드 + lint + test + kit.css port**

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/company/analysis-create-form.tsx \
        frontend/src/components/company/__tests__/analysis-create-form.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(co): CompanyAnalysisEntry 마크업 정렬

mock: screen-company.jsx 의 CompanyAnalysisEntry (line 651-746).

기존 5.9 createAnalysis API 호출 그대로. 마크업 mock 정합:
- 회사명 input · DART 검색 결과 + 선택 · 사용자 URL 입력 (최대 5개) ·
  "분석 시작" 버튼

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: CompanyAnalysisView 마크업 정렬 (commit 7)

**Files:**
- Modify: `frontend/src/components/company/analysis-detail-content.tsx`
- Modify (필요 시): `frontend/src/components/company/keyword-chip-list.tsx` (마크업 mock 정합)
- Modify (필요 시): `frontend/src/components/company/__tests__/analysis-detail-content.test.tsx`

mock JSX [screen-company.jsx:112-311](design_system/project/ui_kits/web/screen-company.jsx) — CompanyAnalysisView (~200줄).

mock 의 CompanyAnalysisView 핵심:
- 헤더 (회사명 + 분석일 + 액션)
- 좌측: 회사 정보 (DART 데이터 + URL 출처)
- 중앙/우측: LLM 액션 포인트 + 키워드 (matched + gap)
- 시각 그룹: 비즈니스 모델 · 도메인 · 채용 트렌드 등 섹션

- [ ] **Step 1: analysis-detail-content.tsx 갱신**

기존 props · API 호출 (`fetchAnalysis(id)`) 유지. 마크업 className 1:1 mock 정합. keyword-chip-list 재활용.

- [ ] **Step 2: keyword-chip-list 마크업 정합 (필요 시)**

mock 의 키워드 chip 마크업과 비교. matched (mint) + gap (peach) tone 정합.

- [ ] **Step 3: 테스트 갱신**

- [ ] **Step 4: 빌드 + lint + test + kit.css port**

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/company/analysis-detail-content.tsx \
        frontend/src/components/company/keyword-chip-list.tsx \
        frontend/src/components/company/__tests__/analysis-detail-content.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(co): CompanyAnalysisView 마크업 정렬

mock: screen-company.jsx 의 CompanyAnalysisView (line 112-311, ~200줄).

기존 5.9 fetchAnalysis API 호출 그대로. 마크업 mock 정합:
- 헤더 (회사명 + 분석일 + 액션)
- 좌측 회사 정보 (DART + URL 출처)
- 중앙/우측 LLM 액션 포인트 + 키워드 (matched mint + gap peach) +
  비즈니스/도메인/채용 트렌드 섹션
- keyword-chip-list 재활용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: cluster-local 자산 정리 + kit.css port (commit 8)

**Files:**
- Delete (사용처 0 확인 후): `frontend/src/components/company/sidenav-rail.tsx`
- Modify: `frontend/src/styles/kit.css` (mock kit-company.css 잔여 selector port)

- [ ] **Step 1: sidenav-rail 사용처 확인**

```bash
grep -rn "SidenavRail\|sidenav-rail" frontend/src
```

만약 결과가 0 → 삭제. 결과가 있으면 해당 화면 cleanup 별도 PR.

```bash
git rm frontend/src/components/company/sidenav-rail.tsx
```

- [ ] **Step 2: cluster CSS cross-check**

```bash
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" design_system/project/ui_kits/web/kit-company.css | sort -u > /tmp/co_mock.txt
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_fe.txt
comm -23 /tmp/co_mock.txt /tmp/kit_fe.txt > /tmp/co_missing.txt
wc -l /tmp/co_missing.txt
cat /tmp/co_missing.txt
```

각 missing selector 의 사용처 확인:
- 사용 중 + co-specific → port
- 미사용 → orphan drop

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/company/ frontend/src/styles/kit.css
git status --short
git commit -m "$(cat <<'EOF'
chore(co): cluster-local 자산 정리 + kit.css port

- sidenav-rail.tsx 삭제 (사용처 0 확인). cover-letters PR 에서 이미
  사용 중단, company 가 마지막 사용처였음
- mock kit-company.css 의 co-specific selector 중 사용 중인 것 port,
  미사용 orphan drop

dashboard.css (788줄) / career.css (966줄) 와 같은 패턴.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: 통합 테스트 갱신 (commit 9)

**Files:**
- Modify: `frontend/src/components/company/__tests__/*.test.tsx` (skip 된 케이스 일괄 갱신)

- [ ] **Step 1: skip 식별**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
grep -rn "it.skip\|test.skip" src/components/company/__tests__/
```

- [ ] **Step 2: 각 skip 케이스 갱신**

새 마크업에 맞춰 셀렉터 갱신 (className · 카피 텍스트). 갱신 어려운 케이스는 새 의미있는 케이스로 교체.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 모든 테스트 PASS, skip 0건.

```bash
grep -rn "skip" src/components/company/__tests__/
```

Expected: empty.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/company/__tests__/
git commit -m "$(cat <<'EOF'
test(co): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

task 2/3/4/5/6/7 에서 임시 it.skip 처리한 케이스들을 모두 최종 마크업에
맞춰 정합. className 기반 셀렉터 + mock JSX 의 카피 텍스트 사용. skip 0건.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR 생성

9 commit 완료 후 controller 수행:

- [ ] develop 동기화
- [ ] dev 서버 sanity check (6 routes: `/company/postings`, `/postings/new`, `/postings/[id]`, `/company/analysis`, `/analysis/new`, `/analysis/[id]`)
- [ ] `git push -u origin feat/realign-company`
- [ ] `gh pr create --base develop --title "feat: realign company cluster — design_system mock 픽셀 재현 (2단계 4번)" --body "..."`

---

## 완료 조건

- 9 task commit 완료
- 각 commit 단위 build/lint/test 통과
- 최종 skip 0건
- 신규 컴포넌트 3 (CoSideNav · PostingDetailContent · PostingNewContent) + 신규 라우트 2 (/postings/[id] + /postings/new)
- sidenav-rail 삭제 + 6 화면 마크업 mock 정합
- 기존 5.5 posting CRUD + 5.9 analysis CRUD 동작 유지
- PR 생성 + CI 통과
