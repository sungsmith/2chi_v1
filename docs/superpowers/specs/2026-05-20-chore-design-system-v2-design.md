# chore/design-system-v2 — Claude Design hand-off 번들 통합 설계

작성일: 2026-05-20
상태: 초안
참조:
- 새 번들 (압축 풀린 위치): `/tmp/claude-design/2chi-design-system/`
- 새 번들 README: `/tmp/claude-design/2chi-design-system/project/README.md` (212줄, 톤·시각·iconography 가이드)
- 현 design_system/: 기존 tokens.css/doc.css/index.html/pages/{기능}.*/uploads/*
- CLAUDE.md §7 (디자인 시스템 참조 규칙) — 본 PR 에서 갱신

---

## 1. 범위

**정책 변경**:
- "디자인 시스템 (HOW: 토큰·컴포넌트·시각 가이드)" 과 "화면 (WHAT: 와이어프레임의 IA·흐름)" 명시적 분리
- 디자인 시스템 source = Claude Design hand-off 번들 (`colors_and_type.css` + `preview/` + `ui_kits/web/` + `README.md`)
- 화면 source = 기존 wireframes (`design_system/uploads/...wireframes-v0.1.html` 또는 `scraps/wireframes-v0.1.html` 이동본)
- 기존 `design_system/pages/{기능}.{html,css,jsx}` 는 정답지에서 제외 — 동등 자료가 `scraps/source-*.{css,jsx}` 와 `ui_kits/web/index.html` 에 보존됨

**포함**:
- `design_system/` 디렉토리 전체 재구성 — 새 번들이 superset
- frontend FE 즉시 마이그레이션 — `styles/{tokens.css, doc.css}` → `styles/{colors_and_type.css, kit.css}`, `globals.css` import 라인 교체
- `design_system/SKILL.md` 신규 작성 — Claude Code skill (`/skill 2chi-design` invoke)
- `CLAUDE.md §7` 전체 갱신 — 새 구조에 맞춰
- 자산 정리 (Git mv/rm/add) — 히스토리 보존
- 토큰·베이스 클래스 호환성 검증 — 비호환 시 page CSS 변환 작업 추가

**제외 (다음 브랜치)**:
- 새 utility classes (`.font-hand`, `.hand-underline` 등) 활용한 기존 페이지 시각 개선
- preview/ 의 새 컴포넌트 (`form-toggles`, `bubbles-tone`, `progress` 등) 적용
- `window.prompt` 제거 (5.4 의 회사·프로젝트·메트릭 추가) — **별도 fix 브랜치 (`fix/career-inline-forms`)** 에서 새 디자인 시스템의 `form-inputs.html` / `form-toggles.html` 정합성 보장하며 인라인 폼으로 교체
- `brand-mood-{1,2}.png` 활용한 마케팅·온보딩 헤드라인 — 별도 작업
- next/image 마이그레이션 / a11y modal Escape 등 5.0 잔여 — 별도

---

## 2. 디렉토리 매핑

### 2.1 design_system/ 최종 구조

```
design_system/
├── README.md                          # NEW (212줄) — 톤·시각·iconography·voice 가이드
├── SKILL.md                           # NEW — Claude Code skill (frontmatter + 짧은 안내)
├── colors_and_type.css                # NEW (334줄) — 토큰 + 폰트 import + 헤딩 + utility classes
│
├── assets/                            # 확장
│   ├── logo.svg                       # 기존 그대로
│   ├── logo-alt.svg                   # NEW
│   ├── brand-mood-1.png               # NEW
│   └── brand-mood-2.png               # NEW
│
├── fonts/                             # NEW (design_system 자체 보존)
│   ├── MemomentKkukkukk.ttf
│   ├── MemomentKkukkukkR.woff
│   └── MemomentKkukkukkR.woff2
│
├── preview/                           # NEW (28 파일: 27 카드 + _card.css 공유)
│   ├── _card.css
│   ├── ai-verify.html
│   ├── alerts.html
│   ├── badges-chips.html
│   ├── border-divider.html
│   ├── bubbles-tone.html
│   ├── buttons.html
│   ├── cards-kpi.html
│   ├── colors-brand.html / colors-lavender-scale.html / colors-mint-scale.html
│   ├── colors-neutral-scale.html / colors-primary-scale.html / colors-semantic.html
│   ├── colors-surface-text.html / colors-warm-scale.html
│   ├── form-inputs.html / form-toggles.html
│   ├── iconography.html / logo.html / mascot-cloud.html
│   ├── progress.html / radius-scale.html / shadow-scale.html / spacing-scale.html
│   ├── stickers-tape.html / tone-keywords.html
│   ├── type-body.html / type-display.html / type-dual-system.html
│   ├── type-headings.html / type-utility.html
│
├── ui_kits/web/                       # NEW
│   ├── index.html                     # 통합 인덱스 (4개 page 시안 대체)
│   ├── kit.css                        # 463줄 — 베이스 컴포넌트 + UI kit 클래스
│   └── kit-screens.css                # 311줄 — 화면 단위 추가 스타일
│
├── scraps/                            # 옛 자료 origin 보존 (git mv)
│   ├── source-career.{css,jsx}        # ← pages/career.{css,jsx}
│   ├── source-dashboard.{css,jsx}     # ← pages/dashboard.{css,jsx}
│   ├── source-onboarding.{css,jsx}    # ← pages/onboarding.{css,jsx}
│   ├── source-posting-new.{css,jsx}   # ← pages/posting-new.{css,jsx}
│   ├── source-tokens.css              # ← tokens.css
│   ├── source-doc.css                 # ← doc.css
│   ├── source-index.html              # ← index.html
│   ├── wireframes-v0.1.html           # ← uploads/2chi_v1_wireframes_v0.1.html
│   └── spec.txt                       # 기존 그대로
│
└── uploads/                           # 일부 유지 (원본 자료)
    ├── ChatGPT Image *.png (2)
    └── 이취_로고 2.svg
```

### 2.2 Git 동작 매핑

**git mv (12 파일 — 히스토리 보존)**:
| 옛 위치 | 새 위치 |
|---|---|
| `pages/career.css` | `scraps/source-career.css` |
| `pages/career.jsx` | `scraps/source-career.jsx` |
| `pages/dashboard.css` | `scraps/source-dashboard.css` |
| `pages/dashboard.jsx` | `scraps/source-dashboard.jsx` |
| `pages/onboarding.css` | `scraps/source-onboarding.css` |
| `pages/onboarding.jsx` | `scraps/source-onboarding.jsx` |
| `pages/posting-new.css` | `scraps/source-posting-new.css` |
| `pages/posting-new.jsx` | `scraps/source-posting-new.jsx` |
| `tokens.css` | `scraps/source-tokens.css` |
| `doc.css` | `scraps/source-doc.css` |
| `index.html` | `scraps/source-index.html` |
| `uploads/2chi_v1_wireframes_v0.1.html` | `scraps/wireframes-v0.1.html` |

**git rm (8 파일 — 폐기)**:
- `pages/career.html`, `pages/dashboard.html`, `pages/onboarding.html`, `pages/posting-new.html` (4 — ui_kits/web/index.html 로 대체)
- `pages/` 빈 폴더 (1)
- `uploads/MemomentKkukkukk.ttf`, `uploads/MemomentKkukkukkR.woff`, `uploads/MemomentKkukkukkR.woff2` (3 — `fonts/` 와 중복)

**git add (신규 32 파일)**:
- README.md (212줄)
- SKILL.md (신규 작성)
- colors_and_type.css (334줄)
- assets/: logo-alt.svg, brand-mood-1.png, brand-mood-2.png (3)
- fonts/: MemomentKkukkukk{.ttf, R.woff, R.woff2} (3)
- preview/: 28 파일
- ui_kits/web/: index.html, kit.css, kit-screens.css (3)

**유지 (변경 없음)**:
- assets/logo.svg
- scraps/spec.txt (기존)
- uploads/ChatGPT Image *.png (2)
- uploads/이취_로고 2.svg

---

## 3. FE Migration 매핑

### 3.1 파일 변경

```
frontend/src/styles/tokens.css        → 삭제
frontend/src/styles/doc.css           → 삭제
frontend/src/styles/colors_and_type.css  → NEW (design_system/colors_and_type.css 복사)
frontend/src/styles/kit.css           → NEW (design_system/ui_kits/web/kit.css 복사)
```

`frontend/public/fonts/MemomentKkukkukk{R.woff, R.woff2}` — 변경 없음 (FE 가 직접 서빙).

### 3.2 globals.css 변경

**Before**:
```css
@import url('https://cdn.jsdelivr.net/.../pretendard.../...');
@import url('https://fonts.googleapis.com/...Caveat...');
@import "../styles/tokens.css";
@import "../styles/doc.css";

@font-face { font-family: "MemomentKkukkukk"; src: url("/fonts/MemomentKkukkukkR.woff2") format("woff2"), url("/fonts/MemomentKkukkukkR.woff") format("woff"); font-weight: 400; font-style: normal; font-display: swap; }

html, body { padding: 0; margin: 0; font-family: var(--font-family-sans); font-size: var(--fs-body); line-height: var(--lh-body); color: var(--color-text-primary); background: var(--color-bg); -webkit-font-smoothing: antialiased; }

* { box-sizing: border-box; }
```

**After**:
```css
@import "../styles/colors_and_type.css";   /* 토큰 + 폰트 CDN import + 헤딩 + utility */
@import "../styles/kit.css";               /* 베이스 컴포넌트 .btn/.card/.badge/.input + UI kit 클래스 */

@font-face { font-family: "MemomentKkukkukk"; src: url("/fonts/MemomentKkukkukkR.woff2") format("woff2"), url("/fonts/MemomentKkukkukkR.woff") format("woff"); font-weight: 400; font-style: normal; font-display: swap; }
/* 로컬 폰트 (MemomentKkukkukk) — colors_and_type.css 의 CDN import 와 별개로 frontend 가 자체 서빙 */

html, body { padding: 0; margin: 0; }     /* font-family/color/background 은 colors_and_type.css 의 :root + h*/body 셀렉터가 담당 */

* { box-sizing: border-box; }
```

(`html, body` 의 font-family/color/background 가 colors_and_type.css 에서 정의됐는지 plan Task 3 첫 step 에서 확인 — 정의돼있으면 globals.css 에서 제거, 아니면 유지.)

### 3.3 토큰 호환성 검증 (구현 plan Task 2)

```bash
# 옛 변수명
grep -oE "^  --[a-z][a-z0-9-]*" design_system/scraps/source-tokens.css | sort -u > /tmp/old-vars.txt

# 새 변수명
grep -oE "^  --[a-z][a-z0-9-]*" design_system/colors_and_type.css | sort -u > /tmp/new-vars.txt

diff /tmp/old-vars.txt /tmp/new-vars.txt
```

결과 분류:
- (a) 100% 호환: 추가 작업 0
- (b) 신규 변수만 추가: 기존 코드 무영향
- (c) 변수명 변경/삭제: 영향 받는 page CSS 4개 (dashboard.css / onboarding.css / career.css / me/career.css) + TopNav 같은 inline style 사용처 — grep+sed 일괄 변환 작업 plan 에 추가

### 3.4 베이스 클래스 (`.btn` 등) 시그니처 호환

```bash
# 옛 doc.css 의 .btn / .card / .badge / .input / .field 시그니처
grep -A3 "^\.btn\b\|^\.card\b\|^\.badge\b\|^\.input\b\|^\.field\b" design_system/scraps/source-doc.css

# 새 kit.css 의 동일 시그니처
grep -A3 "^\.btn\b\|^\.card\b\|^\.badge\b\|^\.input\b\|^\.field\b" design_system/ui_kits/web/kit.css
```

기대: 거의 동일 (같은 시안 의도). 다른 부분 — modifier 클래스 (`.btn.lg`/`.sm` 패딩·높이) 또는 hover 토큰 — 발견 시 plan 에 명시.

---

## 4. CLAUDE.md §7 갱신 + SKILL.md

### 4.1 CLAUDE.md §7 새 본문

```markdown
## 7. 디자인 시스템 참조 규칙

**모든 프론트엔드/디자인 작업은 `design_system/` 디렉토리 내부 자료를 1차 레퍼런스로 한다.** 코드를 짜기 전에 해당 컴포넌트·페이지 레퍼런스를 먼저 읽고 시작할 것. 추측으로 UI 구성·레이아웃·문구를 만들지 말 것.

**정책 — 두 source 분리**:
- **디자인 시스템 (HOW: 토큰·컴포넌트·시각·톤)** — Claude Design hand-off 번들 (`design_system/README.md` + `colors_and_type.css` + `preview/` + `ui_kits/web/`)
- **화면 (WHAT: IA·흐름·페이지별 위젯 배치)** — wireframes (`design_system/uploads/.../wireframes-v0.1.html` 또는 `design_system/scraps/wireframes-v0.1.html`)

핵심 파일 (작업 전 반드시 확인):
- `design_system/README.md` — **톤·시각·iconography·voice 가이드** (1차 정답지)
- `design_system/colors_and_type.css` — 토큰·폰트·heading·utility classes (frontend 의 globals.css 에 통합)
- `design_system/preview/{영역}.html` — **컴포넌트별 spec 카드 27개** (buttons / cards-kpi / form-inputs / form-toggles / badges-chips / alerts / colors-* / type-* / spacing/radius/shadow 등)
- `design_system/ui_kits/web/{index.html, kit.css, kit-screens.css}` — **통합 UI kit** (옛 pages/{기능}.html 의 대체)
- `design_system/scraps/wireframes-v0.1.html` — 화면 흐름·IA
- `design_system/SKILL.md` — Claude Code skill (자동 로드 시 본 시스템 활용)
- `design_system/scraps/source-{기능}.{css,jsx}` — 옛 page 구현 source (역사적 참조용, 정답지 아님)

작업 절차 (필수):
1. **시각 가이드 확인** — `design_system/README.md` §VISUAL FOUNDATIONS, §CONTENT FUNDAMENTALS, §ICONOGRAPHY 의 톤·색·타입·doodle·iconography 규칙
2. **컴포넌트 spec 확인** — 사용할 위젯이 있는 `preview/*.html` 파일 (예: 버튼 작업 시 `preview/buttons.html`)
3. **화면 흐름 확인** — `scraps/wireframes-v0.1.html` 의 해당 §섹션 (대시보드 §2 / 내정보 §3 / 등)
4. **통합 UI kit 참조** — `ui_kits/web/index.html` 의 실제 화면 데모 (필요 시)
5. 위 자료에 없는 요소를 임의로 추가하지 말 것. 누락된 경우 사용자에게 질문.

필수 준수:
- 색상: `var(--color-*)` 토큰만 사용 (colors_and_type.css 가 정의). 하드코딩 hex 금지.
- 타이포: **Pretendard Variable (UI/body/data)** + **MemomentKkukkukk (titles only, 1~2 places/screen)** + **JetBrains Mono (eyebrows/dates/percentages)**. 본문 hand 폰트 사용 금지.
- 아이콘: Lucide-style line icons (1.8 stroke, round caps), 24×24 viewBox. 컴포넌트별 인라인 SVG `const Ico = { ... }` 패턴.
- 감성 요소 (washi tape / mascot cloud / hand-underline / memo paper) — 환영·온보딩·빈 상태 화면에만. 자소서·이력서·데이터 테이블에는 금지.
- spacing: `var(--space-*)` 토큰
- radius: `var(--radius-{md|lg|xl|full})` 토큰 (square corners 금지)
- 컴포넌트명: PascalCase / 파일명: kebab-case
- **톤 키워드** (`정리·연결·안심·준비·성장·맞춤·검토`) — UI 문구·CTA 작성 시 2개 이상 hit 권장
- **카피 톤**: 해요체·청유형 (합쇼체·명령형 금지). 사용자는 "내", 시스템 페르소나는 "이취가 …해드릴게요"
```

### 4.2 SKILL.md 본문

`design_system/SKILL.md`:

```markdown
---
name: 2chi-design
description: 2chi (이취) 디자인 시스템 — tokens, base components, voice/tone guide, integrated UI kit. Use when creating UI, prototypes, or mocks that should match the 2chi brand.
user-invocable: true
---

# 2chi · 이취 Design System

For full brand context, read `README.md` (tone, voice, visual foundations, iconography).

## Quickstart

1. **Tokens + base type + utilities**: `colors_and_type.css` is the one CSS file to load.
   - Pretendard Variable (UI) from jsdelivr CDN
   - Caveat / JetBrains Mono from Google Fonts CDN
   - MemomentKkukkukk from local `fonts/` (must be served by host app)
2. **Base components**: `ui_kits/web/kit.css` (`.btn` / `.card` / `.badge` / `.input` / `.field` 등).
3. **Component specs**: `preview/*.html` — one card per concept (buttons / cards-kpi / form-inputs / form-toggles / badges-chips / colors-{primary,lavender,mint,neutral,semantic,surface-text,warm}-scale / type-{body,display,dual-system,headings,utility} / spacing/radius/shadow / iconography / logo / mascot-cloud / stickers-tape / tone-keywords / ai-verify / progress / alerts).
4. **Integrated UI kit**: `ui_kits/web/index.html` + `kit.css` + `kit-screens.css` — click-thru demonstration of the actual product surface.
5. **Source archive**: `scraps/source-*.{css,jsx,html}` — original page implementations the system was distilled from. Read for historical context only.

## Voice + tone (must follow)

- 해요체 · 청유형. 합쇼체 / 명령형 금지.
- AI 는 helper (저자 아님). User 는 "내" (당신 X). Product 페르소나 — "이취가 …해드릴게요"
- 톤 키워드 (`정리·연결·안심·준비·성장·맞춤·검토`) 중 ≥ 2 hit
- See `README.md` §3 (CONTENT FUNDAMENTALS) for examples.

## Visual foundations (must follow)

- Background `#F8F8F4` (warm cream), 절대 pure white 금지
- Periwinkle primary (#6471E0) · Mint (matching/success) · Lavender (AI-touched surfaces only)
- 감성 요소 (washi tape · memo paper · mascot cloud · hand-underline) — 환영·온보딩·빈 상태에만
- See `README.md` §4 (VISUAL FOUNDATIONS) for full spec.

## When to use this skill

- Building any UI for 2chi (production or prototype) — start here.
- Designing a new screen — first consult wireframe (`scraps/wireframes-v0.1.html`) for IA + flow, then map to component specs in `preview/`.
- Throwaway HTML prototype — copy `colors_and_type.css` + `kit.css` + `fonts/` + `assets/logo.svg` into the mock.
```

---

## 5. 영향 분석 + 테스트 회귀

### 5.1 영향 받는 영역

| 영역 | 변경 | 위험 |
|---|---|---|
| design_system/ 구조 | 전체 재구성 (mv 12 / rm 8 / add 32) | 0 — docs/source, FE 무관 |
| frontend/src/styles/ | tokens/doc.css → colors_and_type/kit.css | **중 — 토큰 변수명 호환 필요** |
| frontend/src/app/globals.css | import 라인 + body 룰 일부 정리 | 중 |
| frontend/src/app/(app)/dashboard.css | 무변경 (page CSS 토큰 사용만) | 토큰 호환 시 0, 비호환 시 grep+sed |
| frontend/src/app/(public)/onboarding/onboarding.css | 동일 | 동일 |
| frontend/src/app/(app)/me/career.css | 동일 | 동일 |
| CLAUDE.md | §7 전체 갱신 | 0 |
| Backend | 무관 | 0 |

### 5.2 테스트 회귀

- **BE**: 무관, PASS 유지
- **FE Vitest 42 케이스**: CSS 변경이라 컴포넌트 동작 무관 — 전부 PASS 예상
- **npm run build**: 새 colors_and_type.css 의 `@import url(...)` (Pretendard CDN, Caveat) 가 동작하는지 빌드 단계 자동 검증
- **수동 시각 점검**: dev server 띄워 3 페이지 확인
  - `/` (dashboard)
  - `/onboarding`
  - `/me/career`
  - 변경 전후 시각 동일 또는 더 나은 상태 확인

### 5.3 Rollback

토큰 변수 대량 비호환 발견 시:
- 시나리오 1 (소수 rename): plan 에 grep+sed 작업 추가 (page CSS 4개 일괄 변환)
- 시나리오 2 (대량 incompatible): 본 PR 의 FE migration 만 보류. design_system/ 정리는 진행, frontend 는 옛 styles/{tokens, doc}.css 유지. 별도 fix 브랜치에서 점진적 migration.

---

## 6. 비기능 / 운영

- **번들 크기**: design_system/ ~16MB → ~17MB (preview/ 27 + brand-mood 2 PNG ~수백 KB 추가)
- **frontend bundle**: 옛 1040 줄 → 새 797 줄, 약 **23% 감소**
- **CI**: 영향 없음 (워크플로 변경 0)
- **신규 의존성**: 없음
- **i18n**: 변경 없음

---

## 7. 작업 순서 (구현 plan Task 미리보기)

1. **Task 1: design_system/ 재구성** — git mv 12 + git rm 8 + git add 32 (큰 chunk 단일 커밋)
2. **Task 2: 토큰·베이스 호환성 검증** — diff 분석. 비호환 발견 시 page CSS 변환 작업 추가
3. **Task 3: FE styles/ 교체 + globals.css 수정** — colors_and_type.css + kit.css 복사 + import 변경
4. **Task 4: 빌드 + Vitest 42 회귀 + dev server 시각 점검 (사용자)**
5. **Task 5: CLAUDE.md §7 갱신 + SKILL.md 작성 + 커밋**
6. **Task 6: 종단 점검 + PR**

(Task 2.5 추가 가능 — 호환성 비호환 시 page CSS rename)

---

## 8. 후속 트래킹 (본 PR 외)

- **fix/career-inline-forms** — 5.4 의 `window.prompt` 제거. 새 디자인 시스템의 `preview/form-inputs.html` + `preview/form-toggles.html` 정합성 보장하며 인라인 폼으로 교체
- **brand-mood-{1,2}.png 활용** — 마케팅·온보딩 헤드라인 시각 강화 (별도 작업)
- **새 utility classes (.font-hand, .hand-underline, .text-brand) 활용** — 기존 페이지 시각 개선 (선택적·점진적)
- **새 preview 카드 (bubbles-tone, ai-verify, progress) 활용** — 5.6 자소서 / 5.10 매칭분석 같은 후속 feat 에서
- **next/image 마이그레이션** — 5.0 잔여 후속 작업
- **a11y modal Escape 키** — 5.0 잔여
