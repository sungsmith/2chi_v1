# 2chi (이취) · Design System

> AI 자소서 · 채용 매칭 · 지원 관리를 한 흐름으로 묶는 IT 직군 취업 · 이직 워크스페이스의 디자인 시스템.

이취 (한국어: "이직 + 취직")는 v1 클로즈드 베타 단계의 PC-웹 우선 SaaS입니다. 이 시스템은 그 v1 출시를 위한 토큰 · 컴포넌트 · UI 키트를 묶은 것입니다.

---

## 1. Brand at a glance

| | |
|---|---|
| **Name** | 이취 · 2chi |
| **Tagline** | 매번 다시 쓰지 않는 자소서, 한곳에서 정리되는 지원 흐름. |
| **Domain** | IT 직군 (백엔드/프론트/인프라/UI·UX) 신입~중고신입 |
| **Stack (v1)** | Next.js (App Router) · Tailwind · shadcn · Spring Boot |
| **Surface** | PC Web First (≥ 1280) · responsive · no PWA, no mobile app |
| **Primary** | Periwinkle `#6471E0` |
| **Secondary** | Mint `#2FA980`, Lavender `#8265DC` |
| **Type** | Pretendard Variable (UI) + MemomentKkukkukk (hand, titles) |
| **Mascot** | Cloud puff with 6 expressions (PNG images in `assets/mascot-*.png`) |
| **Voice** | 해요체 · 청유형 · 검토 가능한 AI — 압박하지 않는 톤 |

---

## 2. Sources used

This system was built by reading the source materials below. Some of them may not be accessible to a reader of this README — they're listed so origin is recoverable.

- **`scraps/spec.txt`** — *2chi v1 기능 정의서 (초안)* by 김소미, 2026-05-08. Full PRD. The canonical source for product scope, voice, tone, data model, legal.
- **`scraps/source-tokens.css` / `scraps/source-doc.css` / `scraps/source-index.html`** — original v1 design-system documentation page. The token names + scale values in this system match exactly.
- **`scraps/source-dashboard.{jsx,css}`** — *Home/Dashboard* page implementation. Top nav, KPI cards, schedule, JD-match panel patterns.
- **`scraps/source-onboarding.{jsx,css}`** — *4-step onboarding* (Purpose → Career → Positions → Recap). Brand panel + stepper patterns.
- **`scraps/source-career.{jsx,css}`** — *내 정보 → 경력기술* (PRAR project structuring). Sidebar nav, context strip, multi-cell editor.
- **`scraps/source-posting-new.{jsx,css}`** — *기업 → 채용공고 등록* (URL paste / manual / locked v2 search tabs).
- **`scraps/wireframes-v0.1.html`** — early v1 wireframe set (low fidelity, kept for archeological reference).
- **`assets/brand-mood-{1,2}.png`** — original brand-mood frames from the team (color palette, doodle vocabulary, mood board). The cloud mascot, washi tape, hand-doodle direction comes from here.

---

## 3. CONTENT FUNDAMENTALS · How 2chi writes

이취의 톤은 한 줄로 말하면: **"AI가 대신 써주는 서비스"가 아니라 "함께 정리하는 워크스페이스"**.

### Grammar / register
- **해요체** (informal-polite). 합쇼체 / 명령형 금지.
  - ✓ "작성해볼까요?", "다시 시도해주세요"
  - ✗ "작성하십시오", "다시 시도하세요"
- **청유형 · 권유형** — Korean "let's" / soft suggest. Never command.
- Subject is always **the user**, never the system. AI is a helper, not an author.

### Vocabulary
- **자소서 (자기소개서)** is the canonical product noun; never "자기소개서" in full UI copy unless legal.
- **AI 결과** is always "초안", "추천", "확인 필요" — never "완성", "최종", "정답".
- **부족 역량** is "보완할 경험", "다음 준비" — never "부족합니다", "미흡합니다".
- **거짓방지(Hallucination guard)** is the internal term; user-facing copy is "이력에서 직접 확인되지 않았어요. 검토해주세요."

### Pronouns
- The user is "내", never "당신". ("내 정보", "내 작성 이력 완성도".)
- The product never says "저희" out loud — it just speaks as a helper. Use "이취가 …해드릴게요" when the product itself needs to act.

### Casing + punctuation
- Korean primary, English mixed-in for product/tech terms (Kafka, MSA, JD, PRAR).
- **English in nav / button labels stays Title-cased or natural-cased**, never UPPERCASE except for eyebrow mono labels (`STEP 2 / 4`, `JD MATCH`).
- 마침표는 안내 문장 끝에서만. CTA · 라벨 · 칩에는 마침표 X.
- `·` (middle dot, U+00B7) joins peers: "AI · 분석", "백엔드 · 중고신입".

### Emoji + decoration
- **이모지는 본문 카피에 거의 쓰지 않습니다.** 예외: 환영 화면의 👋 같은 1회성 액센트.
- 단어 강조는 **민트 손글씨 밑줄** (`.hand-underline`)이나 **노란 형광펜** (`.kw-highlight`)으로. Bold도 OK, italic은 거의 쓰지 않음.

### Example copy

| Context | ✓ Do | ✗ Don't |
|---|---|---|
| Empty (내 정보) | 내 정보를 입력하면 맞춤 분석이 시작돼요. | 먼저 정보를 입력해주세요. |
| Empty (자소서) | 첫 자소서를 작성해볼까요? | 자소서를 작성하시오. |
| Hallucination | 이 표현은 내 이력에서 직접 확인되지 않았어요. 검토해주세요. | 오류: 잘못된 내용입니다. |
| Gap 안내 | 이 공고는 Kafka, MSA 경험을 우대해요. 보완할 경험을 정리해볼까요? | Kafka, MSA 경험이 부족합니다. |
| D-day | 마감일이 가까워졌어요. 제출 준비를 확인해보세요. | 마감 임박. 빨리 제출하세요! |
| Error · 5xx | 잠시 연결이 끊겼어요. 잠시 후 다시 시도해주세요. | 서버 오류 발생. Error 500. |
| Success | 자소서가 저장됐어요. 다음에 이어 쓸 수 있어요. | 저장됨. |
| CTA · Primary | AI 초안 만들어보기 | AI로 자동 생성 |

### Tone keywords (must hit ≥ 2 per decision)

`정리 · 연결 · 안심 · 준비 · 성장 · 맞춤 · 검토`

---

## 4. VISUAL FOUNDATIONS

### Color vibe

- **Warm + creamy, not cool + clinical.** The app background is `#F8F8F4` (a soft cream), not white. Neutrals are warm (`#FAFAF7`, `#F4F4EF`, `#25241F`) — there are no cool greys.
- **Periwinkle primary** carries trust and links. Mint shows matching / success. Lavender is reserved for *AI-touched* surfaces (initial draft, gap analysis, the mascot).
- **Pink** is the loudest accent and is rationed strictly for D-day countdowns and high-urgency badges.
- **Peach** signals gaps and supplements (not failure — failure is `#D94C5C` error red).
- **Yellow** is the "this needs your review" highlight — used on the dashed underline behind hallucination-flagged words.
- Imagery (when used at all) is **warm, soft, hand-drawn**, never glossy product shots, never gradients with neon-purple/blue.

### Type

- **Pretendard Variable** for everything informational: body, button, label, data, table, form. Letter-spacing slightly tight (`-0.005em` to `-0.025em`) at title sizes.
- **MemomentKkukkukk** (hand-feel Korean) for *titles only* — page title, section title, card title, welcome modal, empty-state header, memo cards.
- **JetBrains Mono** for eyebrows, dates, percentages, hex codes, and the brand `*` glyph next to `이취`.
- **Hand font max 1–2 places per screen.** Body text in hand font = banned (illegible, defeats the brand).

### Backgrounds

- **No full-bleed photography.** No big hero images.
- **No bluish-purple gradients.** Very subtle warm wash gradients are permitted only in hero panels (e.g. `radial-gradient(900px 400px at 90% -10%, var(--color-mint-100), transparent)`).
- **No repeating textures.** Decorative texture comes from washi tape (`.tape`), memo paper (`.memo-paper`), and hand-drawn doodles (sprouts, hearts, sparkles, hand-underline squiggle), used *sparingly* and *positioned*, never tiled.

### Doodles + decoration

- **Washi tape strips** (yellow / mint / pink / lavender variants) decorate hero blocks, memo cards, and onboarding panels. Always slightly rotated (-12° to +7°).
- **Memo paper cards** (`#FFFEF8 → #FFFDF1` gradient + warm yellow border) carry hand-font emotional copy on the dashboard and empty states.
- **Cloud mascot** (`.mascot-cloud`) is the brand character — a cartoon lavender cloud puff face shipped as PNG images in 6 expressions: `default` · `wave` · `happy` · `think` · `excited` · `sleep`. Use `<span className="mascot-cloud {size} {expression}"/>` (sizes: `sm`/`md`/`lg`/`xl`). It appears in the onboarding tip card (wave), welcome modal (happy), AI assistant banners (think), and empty/error states (sleep).
- **Hand-underline** (`.hand-underline`) draws a mint squiggle under emphasized phrases inside hand-font titles.

### Animation

- **Subtle and short.** No bouncy spring animations, no slide-in carousels.
- `transition: transform .04s ease, background .15s, box-shadow .15s` is the standard. Hover lifts cards `translateY(-1px)` with `shadow-soft → shadow-card`.
- **Wave hand emoji** on the dashboard greeting (`👋`) animates a small wave on a 2.8s loop — the *one* permitted emoji-based motion (the rest of the brand voice is mascot images, not emoji).
- The brand has no spinner aesthetic; the loading state on `.btn.primary.loading` is a 12px ring spinning at `0.8s linear infinite`.

### Hover / Press / Focus

- **Hover** is *darker* for solid buttons (primary 600 → 700), and *softer* for surfaces (`background: var(--color-surface-soft)`). Never lighter than the base, never opacity-only.
- **Press** translates +1px down (`transform: translateY(1px)`) with no other state change. No scale-shrink.
- **Focus** is a 3px periwinkle ring at 35% alpha. Inputs additionally swap border to `--color-border-focus`. Error focus uses the same shape with the error red at 30% alpha.

### Borders + Shadows

- **All borders are warm grey** (`#E8E7E0`, `#D5D4CB`, `#F0EFE9`). No cool blue borders, no transparent black borders.
- **5-step elevation:** `none / soft / card / floating / modal`. Cards get `card`; popovers and dropdowns get `floating`; modals + toasts get `modal`. Soft shadows are warm-tinted (`rgba(37,36,31, …)`), not pure black.
- Sidebars get `border-right` not `box-shadow`. Headers get a sticky `backdrop-filter: blur(10px)` + 85% white.

### Corner radius

| Use | Token |
|---|---|
| Buttons, inputs | `--radius-md` · 10px |
| Cards | `--radius-lg` · 14px |
| Modals, big panels | `--radius-xl` · 20px |
| Chips, avatars, switches | `--radius-full` · 9999px |
| Tape · memo · small badges | `--radius-md` |

Square corners (radius-0) are never used.

### Layout / Grid

- **Top nav (sticky, 56px)** + content area max-width 1280, centered, cream `--color-bg` showing on the sides.
- **Sub-navigation pattern**: clusters with 3+ sub-pages use a **left sidebar** (220px wide, `.side-nav` class — sticky); single-page clusters or in-page view toggles use **content-level tabs** (`.sub-tabs` class). Sidebar pills show "현재 활성/진행중 항목 수" (with native `title` tooltip for the exact definition).
- 12-column grid · 16px gutters · 32px page padding at desktop.
- Cover-letter editor extends to 1280 with a 320px right rail.
- Pages do **not** use full-bleed; the cream `--color-bg` shows on the sides of the centered content column.

### Transparency + blur

- **Blur is rare.** The only systemic use is the sticky top nav (`backdrop-filter: saturate(140%) blur(10px)`).
- **Transparency is mostly opaque tints**, not real `rgba()`. Tonal backgrounds are picked from the 50/100 step of a color scale, not opacity reductions.

### Cards

- 14px radius · 1px `#E8E7E0` border · `shadow-soft` at rest · `shadow-card` + `translateY(-1px)` on hover.
- 22px padding default. The "soft" variant (`.card.soft`) swaps background to `#FAFAF7` for sidebars and secondary regions.
- KPI cards use 3 tonal flavours (default periwinkle, mint, lavender) — chosen by the meaning of the metric, never decoratively.

---

## 5. ICONOGRAPHY

- **Icon style: Lucide-style line icons.** 24×24 viewBox, 1.8 stroke, `stroke-linecap: round`, `stroke-linejoin: round`. Filled icons are never used. (Lucide CDN: `https://cdn.jsdelivr.net/npm/lucide-static@0.452.0/icons/`)
- Icons in this system are **drawn inline as SVG** rather than imported from a font or sprite. Every page in `scraps/source-*.jsx` has its own `const Ico = { … }` map of needed icons. New screens should follow the same pattern — pull from Lucide, not hand-design.
- **In nav + card heads:** icons sit in a 26–32px square tinted background tile (`background: var(--color-primary-50)`, color `var(--color-primary-700)`), one of 4 tones: periwinkle / mint / lavender / peach.
- **Emoji is not part of the icon system.** A small wave 👋 appears once on the dashboard greeting and `✦` (used as a glyph) appears on the gradient AI button — that's the entire emoji budget. The cloud mascot images (PNG) carry brand personality elsewhere. Don't add more emoji.
- **Brand glyph: `*` (asterisk star)** sits next to the `이취` wordmark, set in primary-500. It's a typed character, not an SVG.
- **Unicode characters** (`✓`, `✗`, `→`, `·`) are used as inline accents in tone copy, but never as primary nav icons.
- **No icon font** is shipped. If a future product needs one, it should be subset to ≤ 80 icons and ship as a static SVG sprite.

Assets shipped:
- `assets/logo.svg` — full hand-drawn 이취 mark (PRIMARY).
- `assets/logo-alt.svg` — alternate-weight variant.
- `assets/mascot-{default,wave,happy,think,excited,sleep}.png` — cloud mascot expressions (used via `.mascot-cloud.{expression}` modifier).
- `assets/brand-mood-{1,2}.png` — original brand mood frames (for inspiration / pitch decks, not production UI).

---

## 6. Index

| Path | What |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Drop-in skill for Claude Code / Anthropic skills. |
| `colors_and_type.css` | **The one CSS file to load** — tokens + base type + utilities. |
| `fonts/` | MemomentKkukkukk woff2/woff/ttf. Pretendard + JetBrains Mono load from CDN. |
| `assets/` | Logo SVGs + mascot PNGs + brand mood frames. |
| `preview/` | The small specimen cards rendered in the Design System tab (60+ cards). |
| `ui_kits/web/` | High-fidelity click-thru recreation of the 2chi web product. |
| `scraps/` | Source materials this system was distilled from. |

### `ui_kits/web/` — Web product mock

A working click-through prototype hosted in `ui_kits/web/index.html`. Top nav has 5 sections + profile dropdown:

| Cluster | Sub-pages |
|---|---|
| **대시보드** | Greeting (memo card) · 3 KPI cards · 다가오는 일정 · 매칭 분석 · 바로가기 |
| **내 정보** | 내 정보 (기초·학력·자격증·경험) · 경력기술 (PRAR) · 포트폴리오 |
| **지원 현황** | 캘린더 (연/월/주/일 + 이벤트 모달) · 대시보드 (칸반) · 히스토리 |
| **이직 / 취업** | 자소서 (목록 + 에디터) · 경력기술서 재구조화 (2-step) |
| **기업** | 채용공고 (목록 + 등록 + 상세) · 기업분석 (목록 + 결과) |
| **마이페이지** | 계정 정보 · 소셜 연결 · 알림 설정 · 알림 센터 · 회원 탈퇴 |
| **Auth** | 로그인 · 회원가입 · 비밀번호 재설정 (3-step) · 이메일 인증 대기 |
| **시스템** | 404 / 500 error routes |

Bottom-right dev pills (`LOGIN · SIGNUP` / `MYPAGE` / `ONBOARDING`) jump to unauthenticated flows for review purposes.

CSS is split per-cluster:
- `kit.css` — top nav, buttons, panels, badges, mascot, tape, form atoms
- `kit-screens.css` — onboarding, cover-letter editor, posting capture
- `kit-me.css` — 내 정보 sidebar + PRAR
- `kit-cl.css` — 자소서 목록 + 경력기술서
- `kit-company.css` — 기업 cluster (list + detail + analysis)
- `kit-applications.css` — 캘린더 4 views + 칸반 + 히스토리
- `kit-account.css` — auth + 마이페이지 + 알림 + error routes

---

## 7. Caveats and substitutions

- **Pretendard** + **JetBrains Mono** are loaded from CDN (jsDelivr + Google Fonts). Both are free + open-source.
- **MemomentKkukkukk** is loaded from local `fonts/` (woff2, woff, ttf). Original files preserved.
- **No font substitutions.** All three brand faces are the originals from the source.
- No production icon assets are shipped; SVGs are inlined per-component following the Lucide vocabulary (1.8 stroke, round caps). If you need many icons, install `lucide-react` and reuse.
- **Cloud mascot images** were supplied by the team as 6 PNG expressions. CSS-drawn fallback was removed.

## 8. Gaps (not yet built)

These are explicit omissions, kept here so future work doesn't accidentally rebuild from scratch:

- **Search results / global ⌘K activation** — the component card exists in design system but not wired into the app.
- **Self-input UI for inline patterns** — most list rows show edit/delete icon buttons but the row-level edit drawer is omitted.
- **Mobile breakpoints** — desktop only. The PRD scopes v1 as "PC web first", so mobile is intentionally deferred.
- **Real onboarding image step (step 4 "둘러보기" recap)** — simplified to 4 tone cards vs. the original's flow visualization.
- **관리자(Admin) 페이지** — out of scope for v1 product mock.
