# 2chi · Web UI Kit

The 2chi product as a click-thru prototype.

## Screens

| File | What |
|---|---|
| `index.html` | Host page — loads tokens + screens, mounts the React app. |
| `kit.css` | Top nav, buttons, panels, cards, badges, mascot, tape, form atoms, dashboard layout. |
| `kit-screens.css` | Screen-specific layout — onboarding, cover-letter editor, posting capture. |
| `kit-me.css` | Screen-specific layout — 내 정보 cluster (sidebar, list rows, PRAR cells, project cards). |
| `kit-icons.jsx` | The Lucide-style SVG icon set used everywhere (`window.Ico`). |
| `kit-shell.jsx` | `TopNav` (the sticky blurred header). |
| `screen-onboarding.jsx` | 4-step onboarding flow with split brand panel + welcome modal. |
| `screen-dashboard.jsx` | Home — greeting, 3 KPI cards, upcoming schedule, JD-match panel, shortcuts. |
| `screen-cover-letter.jsx` | 2-pane cover-letter editor with AI hallucination flags + matched/gap keywords. |
| `screen-posting-new.jsx` | "채용공고 등록" page — URL paste mode with auto-parse banner + basic fields. |
| `screen-me.jsx` | 내 정보 cluster — sidebar nav + 7 subsections (기초 / 학력 / 자격증 / 경험 / 이력서 / 경력기술(PRAR) / 포트폴리오). |
| `app.jsx` | The actual router — wires the screens together with a state machine. |

## How to use it

Open `index.html`. You land on the dashboard with the user "김소미" already onboarded. From there:

- **대시보드** → home (greeting, KPIs, schedule, match panel)
- **내 정보** → 7-section profile cluster (기초정보 / 학력 / 자격증 / 경험 · 대외활동 / 이력서 / 경력기술 / 포트폴리오 링크). The default active section is **경력기술 (PRAR)** because that's the richest pattern.
- **자소서 작성** (primary shortcut) → cover-letter editor.
- **채용공고 등록** → posting-new capture page.
- Floating black pill in the bottom-right → re-enters the 4-step onboarding flow.

Everything is a static mock — clicks navigate but don't persist data.

## What it covers

- App shell: sticky blurred top nav, brand mark, profile pill, notification dot.
- Buttons: primary / secondary / tertiary / ghost / danger / AI (gradient) in 3 sizes.
- KPI cards: 3 tones (default periwinkle / mint / lavender), bar-row breakdowns, stage chips.
- Schedule rows with the "soon" highlighted state (D-2).
- Match ring (conic-gradient % donut) + ranked gap list.
- Editor with confirmed/flagged keyword highlights (mint solid · yellow dashed).
- Cloud mascot, washi tape, memo paper — used sparingly in the brand panel.

## What it doesn't cover

Intentional omissions — the source codebase doesn't include these UIs:

- 자소서 **목록** (마스터 / 변형본 그룹핑) + 경력기술서 재구조화 결과
- 채용공고 **목록** + 상세 / 기업분석 결과
- 캘린더 (year/month/week/day views) / 칸반형 지원 대시보드 / 히스토리
- 로그인 / 회원가입 / 마이페이지 / 알림 센터
- 관리자 / Admin

Add these as new screens following the same pattern.

## Notes for editing

- All screens share the colour + type tokens from the root `colors_and_type.css` — never override colours inline.
- The icon set in `kit-icons.jsx` should be the *only* source of icons. If you need a new one, pull from Lucide and add it there.
- The mascot, tape, and memo classes are restrained on purpose. Don't add them to data-heavy screens.
- All buttons are real `<button>` with the `.btn` class + a variant; never use a div-as-button.
