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
