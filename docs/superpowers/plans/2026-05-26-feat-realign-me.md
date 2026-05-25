# 2단계 PR 2번 (`feat/realign-me`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/me`, `/me/career`, `/me/portfolio` (신규) 화면을 `design_system/project/ui_kits/web/screen-me.jsx` mock 과 픽셀 단위로 재정렬. side-nav IA 를 mock 의 3-section 으로 변경.

**Architecture:** mock JSX 의 마크업·className 을 frontend 컴포넌트에 그대로 옮김. 7-commit 점진 분할 (각 commit 빌드 통과 보장). mock 의 큰 컴포넌트 (ProfileView 100+ 줄, PortfolioView 70+ 줄, CareerView 90+ 줄) 는 line range reference + 변환 패턴. 작은 컴포넌트 / mock 데이터 / 테스트 는 전체 코드.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Vitest 4 + RTL · ESLint 9. AGENTS.md 의 Next.js breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-me-design.md`

**Branch base:** `develop` (2단계 PR 1번 #16 머지됨, head `d04a9eb`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/styles/kit.css` | append | me-specific selector (`.me-side`, `.profile-sub-head`, `.list-row` 등) port. 정확 목록은 task 6 cross-check 후 결정 |
| `frontend/src/components/me/side-nav.tsx` | modify | 3-section ME_NAV + `.side-nav` 클래스. inline style 모두 제거 |
| `frontend/src/components/me/page-header.tsx` | modify | mock ME_TITLES 매핑 + `.page-head` 클래스 |
| `frontend/src/app/(app)/me/layout.tsx` | modify | grid container 단순화 (inline style 제거, mock 패턴) |
| `frontend/src/app/(app)/me/page.tsx` | modify | redirect 제거 → ProfileView import + 렌더 |
| `frontend/src/app/(app)/me/portfolio/page.tsx` | create | 신규 라우트 → PortfolioView |
| `frontend/src/components/me/profile-view.tsx` | create | mock line 113-216 ProfileView 마크업 (sub-section stacked) |
| `frontend/src/components/me/portfolio-view.tsx` | create | mock line 238-310 PortfolioView 마크업 (외부 링크 + 파일) |
| `frontend/src/components/me/coach-banner.tsx` | create | mock line 80-97. `<Banner variant="info" dismissible>` 래퍼 + 카피 |
| `frontend/src/lib/mock/me.ts` | create | PROFILE_MOCK, PORTFOLIO_MOCK, COACH_BANNER_MOCK 데이터 |
| `frontend/src/components/me/__tests__/profile-view.test.tsx` | create | render + 5 sub-section 표시 검증 |
| `frontend/src/components/me/__tests__/portfolio-view.test.tsx` | create | render + 링크 리스트 + 빈 상태 검증 |
| `frontend/src/components/me/career/career-content.tsx` | modify | mock 의 CareerView 마크업 정렬 |
| `frontend/src/components/me/career/career-card.tsx`, `project-card.tsx`, `prar-cell.tsx` 등 (8 파일) | modify | mock 의 CompanyBand · ProjectRow · PrarCell · ListRow 매핑 |
| `frontend/src/components/me/career/__tests__/career-content.test.tsx` | modify | 마크업 변경 따라 셀렉터 갱신 |
| `frontend/src/components/me/icons.tsx` | **delete** | 전역 `components/ui/icons.tsx` 사용 |
| `frontend/src/app/(app)/me/career.css` | **delete** | 966줄 → kit.css 로 port |

---

## Task 1: side-nav 3-section IA + .side-nav 클래스 (commit 1)

**Files:**
- Modify: `frontend/src/components/me/side-nav.tsx`
- Modify: `frontend/src/components/me/page-header.tsx`
- Modify: `frontend/src/app/(app)/me/layout.tsx`
- Append (likely): `frontend/src/styles/kit.css` (`.side-nav`·`.page-head`·`.kit-amb`·`.kit-main` 등 컨테이너 selector 가 kit.css 에 있는지 확인 후 부족분 port)

mock 의 ME_NAV/ME_TITLES 정의:

```tsx
const ME_NAV = [
  { id: "profile",    label: "내 정보" },
  { id: "career",     label: "경력기술", pill: "PRAR", pillTitle: "입력 구조: Problem · Root cause · Approach · Result" },
  { id: "portfolio",  label: "포트폴리오" },
];

const ME_TITLES = {
  profile:   { eyebrow: "ME · PROFILE",       title: "내 정보",     sub: "자소서·이력서 헤더와 채용공고 매칭에 쓰이는 정보예요. 한 번 정리해두면 모든 화면이 자동으로 채워집니다." },
  career:    { eyebrow: "ME · CAREER · PROJECTS", title: "경력기술", sub: "프로젝트 경험을 한 번 구조화해두면, 자소서·면접 답변·기업별 매칭 분석에 그대로 다시 쓸 수 있어요." },
  portfolio: { eyebrow: "ME · PORTFOLIO",     title: "포트폴리오",  sub: "외부 링크 또는 파일을 한곳에 모아두는 곳이에요. 자소서 헤더에 같이 보내져요." },
};
```

mock 의 MeSideNav (line 22-40) 의 마크업 그대로 옮김.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-me
git branch --show-current  # feat/realign-me
```

- [ ] **Step 2: kit.css 의 .side-nav / .page-head 정의 확인**

```bash
grep -n "\.side-nav\|\.page-head\|\.kit-amb\|\.kit-main" frontend/src/styles/kit.css | head -20
```

만약 결과 비어있으면 → design_system 의 kit.css 와 me 의 옛 career.css 에서 해당 selector 추출 후 task 1 안에서 kit.css 에 append. 만약 있으면 → 그대로 사용.

- [ ] **Step 3: side-nav.tsx 재작성**

`frontend/src/components/me/side-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: "profile" | "career" | "portfolio";
  label: string;
  href: string;
  pill?: string;
  pillTitle?: string;
};

const ME_NAV: NavItem[] = [
  { id: "profile",   label: "내 정보",   href: "/me" },
  { id: "career",    label: "경력기술",  href: "/me/career", pill: "PRAR", pillTitle: "입력 구조: Problem · Root cause · Approach · Result" },
  { id: "portfolio", label: "포트폴리오", href: "/me/portfolio" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="side-nav">
      {ME_NAV.map((item) => {
        const active =
          item.href === "/me"
            ? pathname === "/me"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item${active ? " active" : ""}`}
          >
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

- [ ] **Step 4: page-header.tsx 재작성**

`frontend/src/components/me/page-header.tsx`:

```tsx
type Section = "profile" | "career" | "portfolio";

type Props = { section: Section };

const ME_TITLES: Record<Section, { eyebrow: string; title: string; sub: string }> = {
  profile:   { eyebrow: "ME · PROFILE",            title: "내 정보",     sub: "자소서·이력서 헤더와 채용공고 매칭에 쓰이는 정보예요. 한 번 정리해두면 모든 화면이 자동으로 채워집니다." },
  career:    { eyebrow: "ME · CAREER · PROJECTS",  title: "경력기술",    sub: "프로젝트 경험을 한 번 구조화해두면, 자소서·면접 답변·기업별 매칭 분석에 그대로 다시 쓸 수 있어요." },
  portfolio: { eyebrow: "ME · PORTFOLIO",          title: "포트폴리오",  sub: "외부 링크 또는 파일을 한곳에 모아두는 곳이에요. 자소서 헤더에 같이 보내져요." },
};

export function PageHeader({ section }: Props) {
  const t = ME_TITLES[section];
  return (
    <header className="page-head">
      <div className="eyebrow">{t.eyebrow}</div>
      <h1 className="title">{t.title}</h1>
      <p className="sub">{t.sub}</p>
    </header>
  );
}
```

- [ ] **Step 5: /me/layout.tsx 갱신 (inline style 제거)**

`frontend/src/app/(app)/me/layout.tsx`:

```tsx
"use client";

import { SideNav } from "@/components/me/side-nav";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="me-shell">
      <SideNav />
      <main className="me-main">{children}</main>
    </div>
  );
}
```

`.me-shell` (grid 컨테이너) 와 `.me-main` (overflow auto) 가 kit.css 에 없다면 step 2 에서 부족분 port 단계에서 함께 추가:

```css
.me-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: calc(100vh - 64px);
}
.me-main {
  overflow: auto;
}
```

- [ ] **Step 6: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 132 tests passed (변동 없음), build 통과. 만약 PageHeader 의 props 변경 (section 단일 인자) 으로 기존 호출처가 깨지면 호출처도 수정 — 검색해서 영향 범위 파악:

```bash
grep -rn "import.*PageHeader\|PageHeader\b" frontend/src --include="*.tsx"
```

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/side-nav.tsx \
        frontend/src/components/me/page-header.tsx \
        frontend/src/app/\(app\)/me/layout.tsx \
        frontend/src/styles/kit.css
git status --short
git commit -m "$(cat <<'EOF'
refactor(me): side-nav 3-section IA + .side-nav 클래스

mock 의 ME_NAV (profile · career · portfolio) 3-section 으로 변경. inline
style 모두 제거하고 .side-nav · .nav-item · .pill · .page-head 클래스로 통합.

기존 frontend 7-item (기초/학력/자격증/경험/이력서/경력기술/포트폴리오) 은
mock 의 3-section 으로 통합 — sub-section 은 ProfileView 안에 stacked
(task 2 에서 도입).

PageHeader 의 props 가 section 단일 인자로 변경. me/career/page.tsx 호출처
영향 없음 (해당 page 가 PageHeader 직접 호출 안 함).

부족 selector (.side-nav · .page-head · .me-shell · .me-main) 는 kit.css 에
port.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ProfileView 신규 + CoachBanner + mock 데이터 (commit 2)

**Files:**
- Create: `frontend/src/components/me/profile-view.tsx`
- Create: `frontend/src/components/me/coach-banner.tsx`
- Create: `frontend/src/lib/mock/me.ts`
- Modify: `frontend/src/app/(app)/me/page.tsx`
- Create: `frontend/src/components/me/__tests__/profile-view.test.tsx`

ProfileView 의 마크업은 mock line 113-216 (대용). 5 sub-section: 기본정보 / 학력 / 자격증 / 경험·대외활동 / 이력서.

- [ ] **Step 1: mock/me.ts 신규 (PROFILE_MOCK)**

`frontend/src/lib/mock/me.ts`:

```ts
export type ProfileBasic = {
  name: string;
  email: string;
  phone: string;
  position: string;
  experienceYears: string;
};

export type ProfileEducation = {
  school: string;
  major: string;
  period: string;
  status: string;
};

export type ProfileCert = {
  name: string;
  issuer: string;
  date: string;
};

export type ProfileExperience = {
  title: string;
  org: string;
  period: string;
  description: string;
};

export type ProfileResumeNote = {
  filename: string;
  updatedAt: string;
};

export type ProfileSnapshot = {
  basic: ProfileBasic;
  educations: ProfileEducation[];
  certs: ProfileCert[];
  experiences: ProfileExperience[];
  resume: ProfileResumeNote | null;
};

export const PROFILE_MOCK: ProfileSnapshot = {
  basic: {
    name: "김소미",
    email: "somi.kim@example.com",
    phone: "010-0000-0000",
    position: "백엔드",
    experienceYears: "중고신입 (2년차)",
  },
  educations: [
    { school: "OO대학교", major: "컴퓨터공학", period: "2018.03 — 2022.02", status: "졸업" },
  ],
  certs: [
    { name: "정보처리기사", issuer: "한국산업인력공단", date: "2022.05" },
    { name: "SQLD",         issuer: "한국데이터산업진흥원", date: "2022.08" },
  ],
  experiences: [
    { title: "백엔드 스터디 리딩", org: "사내 동호회", period: "2024.03 — 진행중", description: "Spring · Kafka 학습 모임 운영 (격주, 12회 진행)" },
  ],
  resume: { filename: "kim-somi-resume-v3.pdf", updatedAt: "2026-05-10" },
};
```

PortfolioView 와 CoachBanner mock 은 task 3 에서 추가 (mock/me.ts 에 append).

- [ ] **Step 2: CoachBanner 컴포넌트**

mock line 80-97 (`CoachBanner({ onDismiss })`) 의 카피를 그대로 사용. Banner 의 dismissible 활용.

`frontend/src/components/me/coach-banner.tsx`:

```tsx
"use client";

import { Banner } from "@/components/ui/banner";

type Props = { onDismiss?: () => void };

export function CoachBanner({ onDismiss }: Props) {
  return (
    <Banner variant="info" dismissible onDismiss={onDismiss}>
      <b>여기에 정리해두면 자소서·매칭 분석이 알아서 채워집니다.</b> 비어 있어도 괜찮아요 — 한 번에 다 채우려 하지 말고, 떠오를 때 한 줄씩.
    </Banner>
  );
}
```

(mock 의 정확한 카피와 다를 수 있음. mock 파일을 읽어 실제 카피로 교체 — implementer 가 mock line 80-97 의 텍스트 추출.)

- [ ] **Step 3: ProfileView 실패 테스트**

`frontend/src/components/me/__tests__/profile-view.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProfileView } from "../profile-view";
import { PROFILE_MOCK } from "@/lib/mock/me";

describe("ProfileView", () => {
  it("renders 5 sub-sections with headings", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("기본정보")).toBeInTheDocument();
    expect(screen.getByText("학력")).toBeInTheDocument();
    expect(screen.getByText("자격증")).toBeInTheDocument();
    expect(screen.getByText(/경험.*대외활동/)).toBeInTheDocument();
    expect(screen.getByText("이력서")).toBeInTheDocument();
  });

  it("renders basic info fields", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("김소미")).toBeInTheDocument();
    expect(screen.getByText("somi.kim@example.com")).toBeInTheDocument();
    expect(screen.getByText("백엔드")).toBeInTheDocument();
  });

  it("renders cert list", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("정보처리기사")).toBeInTheDocument();
    expect(screen.getByText("SQLD")).toBeInTheDocument();
  });

  it("renders resume note when present", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("kim-somi-resume-v3.pdf")).toBeInTheDocument();
  });

  it("renders 이력서 empty state when resume is null", () => {
    render(<ProfileView data={{ ...PROFILE_MOCK, resume: null }} />);
    expect(screen.getByText(/아직 이력서가 없어요|이력서를 추가/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: ProfileView 구현**

mock line 113-216 의 ProfileView 마크업 + ProfileSubHead (line 98) + ListRow (line 217) 를 frontend 컴포넌트로 변환. mock 의 데이터는 hardcoded — 우리는 `data: ProfileSnapshot` props 로 받음.

`frontend/src/components/me/profile-view.tsx` 의 시그니처:

```tsx
type Props = { data: ProfileSnapshot };

export function ProfileView({ data }: Props) {
  // 5 sub-sections (basic / edu / certs / experiences / resume) stacked.
  // Each sub-section uses <div className="profile-sub-head"> + ListRow pattern from mock line 98-237.
  // ...
}
```

구체 마크업은 mock JSX 의 ProfileView 함수 본문 (line 113-216) 을 읽어서 PROFILE_MOCK 데이터를 매핑. 빈 상태 ("아직 이력서가 없어요" 등) 처리 추가.

implementer 는 mock 파일을 직접 읽고 마크업을 frontend 컨벤션으로 옮긴 후 PROFILE_MOCK 데이터로 채움.

테스트 통과 확인:
```bash
cd frontend && npm run test -- profile-view
```

- [ ] **Step 5: /me/page.tsx 갱신 (redirect 제거)**

`frontend/src/app/(app)/me/page.tsx`:

```tsx
import { PageHeader } from "@/components/me/page-header";
import { CoachBanner } from "@/components/me/coach-banner";
import { ProfileView } from "@/components/me/profile-view";
import { PROFILE_MOCK } from "@/lib/mock/me";

export default function MePage() {
  return (
    <>
      <PageHeader section="profile" />
      <CoachBanner />
      <ProfileView data={PROFILE_MOCK} />
    </>
  );
}
```

(CoachBanner 의 dismiss 상태는 차후 — 일단 표시만.)

`"use client";` 가 필요한지 확인 (CoachBanner 가 client component 이므로 page 는 server component 유지 가능. 단 dismiss 상태를 page 에서 관리하려면 client 로). 일단 server component 로 두고 CoachBanner 가 자체 client 처리.

- [ ] **Step 6: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 137 tests passed (132 + 5 신규).

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/mock/me.ts \
        frontend/src/components/me/profile-view.tsx \
        frontend/src/components/me/coach-banner.tsx \
        frontend/src/components/me/__tests__/profile-view.test.tsx \
        frontend/src/app/\(app\)/me/page.tsx
git commit -m "$(cat <<'EOF'
feat(me): ProfileView 신규 + CoachBanner + mock 데이터

mock: screen-me.jsx 의 ProfileView (line 113-216) + ProfileSubHead (line 98)
+ ListRow (line 217) + CoachBanner (line 80-97).

- /me/page.tsx: redirect 제거 → ProfileView 자체 화면 (PageHeader · CoachBanner
  · ProfileView 5 sub-section)
- ProfileSnapshot 타입 + PROFILE_MOCK (기본정보·학력·자격증·경험·이력서)
- CoachBanner: 1단계 Banner 컴포넌트 (variant=info, dismissible) 활용

UI mock-only — BE ProfileSummary aggregator 는 별도 issue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: PortfolioView 신규 라우트 (commit 3)

**Files:**
- Create: `frontend/src/app/(app)/me/portfolio/page.tsx`
- Create: `frontend/src/components/me/portfolio-view.tsx`
- Modify: `frontend/src/lib/mock/me.ts` (PORTFOLIO_MOCK append)
- Create: `frontend/src/components/me/__tests__/portfolio-view.test.tsx`

mock line 238-310. 외부 링크 + 파일 리스트 + 빈 상태.

- [ ] **Step 1: PORTFOLIO_MOCK 추가**

`frontend/src/lib/mock/me.ts` 끝에 append:

```ts
export type PortfolioLink = {
  title: string;
  url: string;
  kind: "github" | "notion" | "blog" | "other";
};

export type PortfolioFile = {
  filename: string;
  size: string;
  uploadedAt: string;
};

export type PortfolioSnapshot = {
  links: PortfolioLink[];
  files: PortfolioFile[];
};

export const PORTFOLIO_MOCK: PortfolioSnapshot = {
  links: [
    { title: "GitHub",      url: "https://github.com/somi-kim",           kind: "github" },
    { title: "기술 블로그", url: "https://somi.dev",                       kind: "blog" },
    { title: "Notion 정리", url: "https://www.notion.so/somi/tech-notes", kind: "notion" },
  ],
  files: [
    { filename: "portfolio-2026q2.pdf", size: "2.4MB",  uploadedAt: "2026-05-08" },
  ],
};
```

- [ ] **Step 2: PortfolioView 실패 테스트**

`frontend/src/components/me/__tests__/portfolio-view.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PortfolioView } from "../portfolio-view";
import { PORTFOLIO_MOCK } from "@/lib/mock/me";

describe("PortfolioView", () => {
  it("renders link list with titles + urls", () => {
    render(<PortfolioView data={PORTFOLIO_MOCK} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("기술 블로그")).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(3);
  });

  it("renders file list with filenames", () => {
    render(<PortfolioView data={PORTFOLIO_MOCK} />);
    expect(screen.getByText("portfolio-2026q2.pdf")).toBeInTheDocument();
  });

  it("renders empty state when no links and no files", () => {
    render(<PortfolioView data={{ links: [], files: [] }} />);
    expect(screen.getByText(/아직 등록된 포트폴리오가 없어요|첫 링크/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: PortfolioView 구현**

mock line 238-310 의 PortfolioView 마크업 그대로. data props 패턴 + 빈 상태 처리.

implementer 가 mock 파일에서 마크업 추출 후 PORTFOLIO_MOCK 데이터로 매핑.

테스트 통과:
```bash
cd frontend && npm run test -- portfolio-view
```

- [ ] **Step 4: /me/portfolio/page.tsx 신규**

```tsx
import { PageHeader } from "@/components/me/page-header";
import { PortfolioView } from "@/components/me/portfolio-view";
import { PORTFOLIO_MOCK } from "@/lib/mock/me";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader section="portfolio" />
      <PortfolioView data={PORTFOLIO_MOCK} />
    </>
  );
}
```

- [ ] **Step 5: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 140 tests passed (137 + 3).

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/mock/me.ts \
        frontend/src/components/me/portfolio-view.tsx \
        frontend/src/components/me/__tests__/portfolio-view.test.tsx \
        frontend/src/app/\(app\)/me/portfolio/
git commit -m "$(cat <<'EOF'
feat(me): PortfolioView 신규 라우트

mock: screen-me.jsx 의 PortfolioView (line 238-310).

- /me/portfolio/page.tsx: 신규 라우트
- PortfolioView: 외부 링크 리스트 + 파일 리스트 + 빈 상태
- PortfolioSnapshot 타입 + PORTFOLIO_MOCK (GitHub·블로그·Notion + 1 파일)

UI mock-only — BE Portfolio CRUD 는 별도 issue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: CareerView 마크업 mock 정렬 (가장 무거운 task, commit 4)

**Files:**
- Modify: `frontend/src/components/me/career/career-content.tsx` (97줄)
- Modify: `frontend/src/components/me/career/career-card.tsx` (166줄)
- Modify: `frontend/src/components/me/career/project-card.tsx` (151줄)
- Modify: `frontend/src/components/me/career/prar-cell.tsx` (43줄)
- Modify (필요 시): `assistant-note.tsx`, `date-input.tsx`, `metric-chip.tsx`, `tech-tag.tsx`, `new-*-form.tsx` (마크업 정합)
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (it.skip 적용)

mock JSX:
- CareerView: `screen-me.jsx` line 383-477
- CompanyBand: line 356-381
- ProjectRow: line 329-354
- PrarCell: line 312-327
- CareerMeta: line 66-78
- ListRow: line 217-237

변환 규칙:
- 각 컴포넌트의 마크업·className 을 mock JSX 그대로
- 기존 props 시그니처는 유지 (data flow 변경 X)
- `Ico.X` 사용을 모두 `import { X } from "@/components/ui/icons"` 로 교체 (task 5 에서 일괄 처리도 가능하나 이 task 에서 마크업 변경 시 자연스럽게 진행)

- [ ] **Step 1: career-content.tsx 갱신**

mock 의 CareerView (line 383-477) 마크업 그대로. 기존 props (career list, project list, API hooks) 유지. mock 의 hardcoded `CompanyBand` 인스턴스를 frontend 의 career-card 컴포넌트로 매핑.

implementer 는 mock 파일을 직접 읽어 마크업 매핑.

- [ ] **Step 2: career-card.tsx 갱신 (mock 의 CompanyBand)**

mock line 356-381 의 CompanyBand JSX 그대로. props mapping:
- `mark` → 회사 약자 / 로고 첫 글자
- `markTone` → tone 색 (`""` / `"mint"` / `"lav"` 등)
- `name` → 회사명
- `statusPill` → 상태 (현직 등)
- `role` / `period` / `duration` → 직무·기간
- `projectCount` → 프로젝트 수
- `current` → 현직 여부
- `children` → ProjectRow 들

기존 career-card.tsx 의 데이터 flow 유지.

- [ ] **Step 3: project-card.tsx 갱신 (mock 의 ProjectRow)**

mock line 329-354 의 ProjectRow JSX 그대로. props:
- `open` → 열림 상태
- `name` / `tags` / `period` / `contribution` / `role` / `prarStatus`
- `children` → PrarCell 들

- [ ] **Step 4: prar-cell.tsx 갱신**

mock line 312-327 의 PrarCell JSX 그대로. props: `tone`, `glyph`, `ko`, `en`, `max`, `value`.

- [ ] **Step 5: 기타 컴포넌트 (필요 시)**

assistant-note, date-input, metric-chip, tech-tag, new-*-form 등 마크업이 mock 의 ListRow / PrarCell 등과 일치하는지 확인 후 정합. 큰 변경 없으면 skip.

- [ ] **Step 6: career-content.test 의 깨지는 케이스 it.skip**

```bash
cd frontend && npm run test -- career-content
```

Failing test 케이스를 식별 후 `it.skip` 으로 표시 + `// TODO Task 7: 최종 마크업으로 갱신` 코멘트.

- [ ] **Step 7: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: skip 있어도 모든 active test 통과 + build OK.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/career/
git status --short
git commit -m "$(cat <<'EOF'
refactor(me): CareerView 마크업 mock 정렬

mock: screen-me.jsx 의 CareerView (line 383-477) + CompanyBand (line 356) +
ProjectRow (line 329) + PrarCell (line 312) + ListRow (line 217).

- career-content.tsx: 메인 CareerView 마크업 정렬
- career-card.tsx: CompanyBand 마크업 (mark · markTone · name · statusPill ·
  role · period · duration · projectCount · current · children)
- project-card.tsx: ProjectRow 마크업 (open · name · tags · period · ...)
- prar-cell.tsx: PrarCell 마크업 (tone · glyph · ko · en · max · value)
- assistant-note · date-input · metric-chip · tech-tag · new-*-form: mock
  ListRow 와 정합 확인 후 작은 마크업 조정

기존 data flow 와 API 호출은 모두 유지. 일부 career-content 통합 테스트
임시 it.skip — task 7 에서 일괄 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: icons.tsx 제거 + 전역 Ico 사용 (commit 5)

**Files:**
- **Delete**: `frontend/src/components/me/icons.tsx`
- Modify: 모든 me 컴포넌트의 `import` (cluster-local → 전역)

- [ ] **Step 1: 사용처 식별**

```bash
grep -rn "from \"./icons\"\|from \"@/components/me/icons\"" frontend/src/components/me/
```

- [ ] **Step 2: 각 사용처의 import 갱신**

cluster-local `import { X, Y } from "./icons"` → `import { X, Y } from "@/components/ui/icons"`.

전역 `components/ui/icons.tsx` 에 해당 아이콘이 있는지 확인:
```bash
grep -oE "^export function [A-Z][a-zA-Z]+" frontend/src/components/ui/icons.tsx
```

만약 me 의 cluster-local icons 가 전역에 없는 새 아이콘을 export 하고 있다면, **전역 icons.tsx 에 추가** (mock 의 `kit-icons.jsx` 카탈로그에서 가져옴 — design_system 본을 update 하지 말고 frontend 만).

- [ ] **Step 3: cluster-local 파일 삭제**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git rm frontend/src/components/me/icons.tsx
```

- [ ] **Step 4: 잔재 import 확인**

```bash
grep -rn 'from "./icons"\|from "@/components/me/icons"' frontend/src/
```

Expected: 결과 없음.

- [ ] **Step 5: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/ frontend/src/components/ui/icons.tsx
git status --short
git commit -m "$(cat <<'EOF'
refactor(me): icons.tsx 제거 + 전역 Ico 사용

me/icons.tsx (99줄) 삭제. 모든 me 컴포넌트의 import 를
@/components/ui/icons (1단계에서 도입한 전역 카탈로그) 로 교체.

me 의 cluster-local 에만 있던 아이콘은 전역 카탈로그에 추가 (design_system
kit-icons.jsx 본의 다른 항목에서 가져옴).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: career.css 966줄 삭제 + kit.css port (commit 6)

**Files:**
- Append: `frontend/src/styles/kit.css` (me-specific selector port)
- **Delete**: `frontend/src/app/(app)/me/career.css`

dashboard.css 와 동일 패턴.

- [ ] **Step 1: career.css selector 추출**

```bash
cd /Users/sungjiwon/claude/2chi_v1
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" "frontend/src/app/(app)/me/career.css" | sort -u > /tmp/career_selectors.txt
wc -l /tmp/career_selectors.txt
```

- [ ] **Step 2: kit.css cross-check**

```bash
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_selectors.txt
comm -23 /tmp/career_selectors.txt /tmp/kit_selectors.txt > /tmp/missing_in_kit.txt
wc -l /tmp/missing_in_kit.txt
```

For each missing selector:
- 실제 사용 중인지 grep (`grep -rn "\.{selector}\b" frontend/src --include="*.tsx" --include="*.css"`)
- 사용 중 + me-specific 이면 → kit.css 에 port (해당 CSS rule 복사)
- 미사용이면 → orphan, drop (career.css 삭제로 자연스럽게 사라짐)

- [ ] **Step 3: dev 서버 200 OK 확인**

```bash
cd frontend && (npm run dev &)
sleep 8
curl -sI http://localhost:3000/me | head -1
curl -sI http://localhost:3000/me/career | head -1
curl -sI http://localhost:3000/me/portfolio | head -1
pkill -f "next dev"
sleep 2
```

Expected: 3 routes 모두 `HTTP/1.1 200 OK`.

- [ ] **Step 4: career.css 삭제**

```bash
cd /Users/sungjiwon/claude/2chi_v1
# /me/page.tsx 또는 /me/career/page.tsx 가 career.css 를 import 하는지 확인
grep -rn "career.css" frontend/src/
# 만약 import 가 있으면 제거
```

```bash
git rm "frontend/src/app/(app)/me/career.css"
```

- [ ] **Step 5: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 통과. 시각 회귀는 controller 최종 sanity 에서 확인.

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/styles/kit.css frontend/src/app/\(app\)/me/ 2>/dev/null
git status --short
git commit -m "$(cat <<'EOF'
chore(fe): career.css 966줄 삭제 + kit.css port

966줄 career.css 의 me-specific selector 를 kit.css 와 cross-check.
사용 중인 selector 만 kit.css 에 port, 나머지는 orphan drop.

me 화면의 모든 시각 정의는 design_system 본의 kit.css 한 곳으로 통합.

dashboard.css (788줄) 와 동일 패턴.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 통합 테스트 갱신 (commit 7)

**Files:**
- Modify: `frontend/src/components/me/career/__tests__/career-content.test.tsx` (275줄)
- 신규 ProfileView / PortfolioView 테스트는 task 2,3 에서 이미 추가됨

- [ ] **Step 1: skip 된 테스트 식별**

```bash
cd frontend && grep -rn "it.skip\|test.skip" src/components/me/
```

- [ ] **Step 2: 각 skip 케이스를 새 마크업에 맞춰 갱신**

각 `it.skip` → `it` 로 변경 + 셀렉터 갱신 (className 기반 + mock JSX 의 카피).

implementer 가 현재 마크업과 mock JSX 비교 후 결정.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 모든 테스트 PASS, skip 0.

```bash
grep -rn "skip" frontend/src/components/me/__tests__/ frontend/src/components/me/career/__tests__/
```

Expected: 결과 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/career/__tests__/
git commit -m "$(cat <<'EOF'
test(me): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

task 4 에서 임시 it.skip 처리한 career-content 케이스들을 모두 최종 마크업에
맞춰 정합. className 기반 셀렉터 + mock JSX 의 카피 텍스트 사용. skip 0건.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR 생성

7 commit 완료 후 controller 수행:

- [ ] develop 동기화
- [ ] dev 서버 sanity check (3 routes: /me, /me/career, /me/portfolio)
- [ ] `git push -u origin feat/realign-me`
- [ ] `gh pr create --base develop --title "feat: realign me cluster — design_system mock 픽셀 재현 (2단계 2번)" --body "..."`

---

## 완료 조건

- 7 task commit 완료
- 각 commit 단위 build/lint/test 통과
- 최종 skip 0건
- 신규 컴포넌트 3 (CoachBanner, ProfileView, PortfolioView) + 신규 mock 데이터 + 신규 라우트 (`/me/portfolio`)
- me/icons.tsx 삭제 + career.css 966줄 삭제
- mock JSX 의 3-section IA + 마크업 정합
- PR 생성 + CI 통과
