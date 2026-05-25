---
name: 2chi-design
description: Use this skill to generate well-branded interfaces and assets for 2chi (이취 · the AI cover-letter + job-application workspace for Korean IT job seekers), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

The design system at a glance:
- `colors_and_type.css` — the one stylesheet to load. Tokens (CSS vars) + sensible defaults for `h1…h4`, `p`, `code`, links, focus rings.
- `fonts/MemomentKkukkukk*` — the hand-feel Korean title font (woff2 / woff / ttf). Pretendard + JetBrains Mono load from CDN inside `colors_and_type.css`.
- `assets/logo.svg` — primary 이취 mark. Always reference this, never re-draw.
- `assets/mascot-{default,wave,happy,think,excited,sleep}.png` — cloud mascot expressions. Use as background-image via the `.mascot-cloud.{expression}` class pattern. Mascot is the primary brand-personality device.
- `assets/brand-mood-*.png` — mood references (not for production).
- `ui_kits/web/` — high-fidelity React recreation of the 2chi product. Top nav with 5 clusters + profile dropdown, each cluster either side-bar (3+ sub-pages) or sub-tabs (single page with view toggles). Auth flow includes login / signup / password reset / verify email. See `ui_kits/web/README.md` for full screen index.
- `preview/*.html` — atomic specimen cards (60+). Use these to verify your output matches the system.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Load `colors_and_type.css` at the root and the CSS vars will set the brand palette and type defaults automatically.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Brand non-negotiables (don't break these):
- **Hand font (MemomentKkukkukk) is for titles + emotional copy only.** Max 1–2 places per screen. Never on body text, never on data, never on form inputs.
- **Voice is 해요체 + 청유형.** "함께 정리해볼까요?" not "정리하시오." AI is a helper, never an author.
- **AI output is always "초안", "추천", "확인 필요"** — never "완성", "정답".
- **Periwinkle primary `#6471E0`.** Mint = matching/success. Lavender = AI surfaces. Pink only for D-day. Peach = gaps, not failure.
- **Cream `#F8F8F4` is the app background.** Pure white is for surfaces.
- **Lucide-style line icons only.** 1.8 stroke · round caps. No filled icons.
- **Emoji is not vocabulary.** Only 👋 on the dashboard greeting and ✦ on the AI button. Use mascot images instead for brand personality.
- **No bluish-purple gradients, no glossy gradients of any kind.** The single permitted gradient is the AI button (periwinkle → lavender).
- **Sub-navigation rule**: ≥ 3 sub-pages → use sidebar (`.side-nav`); single page with view toggles → content-level tabs (`.sub-tabs`).
- **Sidebar pill counts** = currently active/in-progress items, not totals. Always pair with a `title` attribute that defines what "active" means.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (target screen, fidelity, tweakable axes), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
