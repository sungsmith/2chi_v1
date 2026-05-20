# chore/design-system-v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Design hand-off 번들을 `design_system/` 에 통합 + frontend 의 토큰·베이스 컴포넌트 source 를 새 통합본으로 마이그레이션 + CLAUDE.md §7 / SKILL.md 갱신.

**Architecture:** 옛 자료(pages/*, tokens.css, doc.css, index.html, wireframes) 를 `scraps/source-*` 로 git mv 보존 + 새 번들 자산 (README, colors_and_type.css, preview/ 28, ui_kits/web/ 3, assets/fonts) 를 add. frontend 의 `styles/{tokens, doc}.css` 를 `colors_and_type.css + kit.css` 로 교체. CSS 토큰·베이스 클래스 호환성 검증 후 비호환 시 page CSS 변환.

**Tech Stack:** Git mv/rm/add / Next.js (app router) globals.css / Vitest + @testing-library/react / Bash diff.

**관련 문서:**
- 설계: [docs/superpowers/specs/2026-05-20-chore-design-system-v2-design.md](../specs/2026-05-20-chore-design-system-v2-design.md)
- 번들 위치 (압축 해제됨): `/tmp/claude-design/2chi-design-system/`
- 새 README: `/tmp/claude-design/2chi-design-system/project/README.md` (212줄)

---

## 파일 맵

**design_system/ 변경**:

| 동작 | 파일 |
|---|---|
| git mv | 12 파일 (옛 자료 → scraps/source-*) — §자세히 Task 1 |
| git rm | 8 파일 (pages/*.html 4 + pages/ 빈 폴더 1 + uploads/MemomentKkukkukk* 3) |
| git add | 32 파일 (README, SKILL.md, colors_and_type.css, preview/ 28, ui_kits/web/ 3, assets/ 3, fonts/ 3) |
| 유지 | assets/logo.svg, scraps/spec.txt, uploads/ChatGPT Image *.png (2), uploads/이취_로고 2.svg |

**frontend/ 변경**:

| 파일 | 동작 |
|---|---|
| `frontend/src/styles/tokens.css` | 삭제 |
| `frontend/src/styles/doc.css` | 삭제 |
| `frontend/src/styles/colors_and_type.css` | NEW (design_system 동명 파일 복사) |
| `frontend/src/styles/kit.css` | NEW (design_system/ui_kits/web/kit.css 복사) |
| `frontend/src/app/globals.css` | 수정 (import 라인 교체) |

**docs/ 변경**:

| 파일 | 동작 |
|---|---|
| `CLAUDE.md` | §7 전체 갱신 |
| `design_system/SKILL.md` | NEW (Task 1 에서 생성) |

---

## Task 1: design_system/ 재구성 (git mv + git rm + git add)

**목표:** 새 번들 superset 으로 흡수. 옛 자료는 scraps/ 에 보존.

**Files:**
- `git mv`: 12 파일 (옛 자료 → scraps/source-*)
- `git rm`: 8 파일 (pages/*.html + uploads 폰트 중복)
- 새 자산 cp + `git add`: 32 파일 (번들의 project/* 전체)

- [ ] **Step 1: 사전 상태 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1
ls -la design_system/
ls -la /tmp/claude-design/2chi-design-system/project/
```

번들이 `/tmp/claude-design/2chi-design-system/` 에 압축 해제돼 있어야 함. 없으면 사용자가 fetch 다시 받아서 풀어야 (`tar -xf /tmp/claude-design.unzipped -C /tmp/claude-design`).

- [ ] **Step 2: 옛 자료 git mv (12 파일)**

```bash
cd /Users/sungjiwon/claude/2chi_v1
mkdir -p design_system/scraps

# pages/{기능}.{css,jsx} (8 파일)
git mv "design_system/pages/career.css"        "design_system/scraps/source-career.css"
git mv "design_system/pages/career.jsx"        "design_system/scraps/source-career.jsx"
git mv "design_system/pages/dashboard.css"     "design_system/scraps/source-dashboard.css"
git mv "design_system/pages/dashboard.jsx"     "design_system/scraps/source-dashboard.jsx"
git mv "design_system/pages/onboarding.css"    "design_system/scraps/source-onboarding.css"
git mv "design_system/pages/onboarding.jsx"    "design_system/scraps/source-onboarding.jsx"
git mv "design_system/pages/posting-new.css"   "design_system/scraps/source-posting-new.css"
git mv "design_system/pages/posting-new.jsx"   "design_system/scraps/source-posting-new.jsx"

# tokens / doc / index (3 파일)
git mv "design_system/tokens.css"  "design_system/scraps/source-tokens.css"
git mv "design_system/doc.css"     "design_system/scraps/source-doc.css"
git mv "design_system/index.html"  "design_system/scraps/source-index.html"

# wireframes (1 파일)
git mv "design_system/uploads/2chi_v1_wireframes_v0.1.html" "design_system/scraps/wireframes-v0.1.html"
```

확인:
```bash
ls design_system/pages/ 2>&1
ls design_system/scraps/ | head -20
git status --short | head -25
```

Expected: `pages/` 가 `career.html`, `dashboard.html`, `onboarding.html`, `posting-new.html` 만 남음 (Step 3 에서 rm). scraps/ 에 source-* + wireframes 12 파일 + 기존 spec.txt.

- [ ] **Step 3: 폐기 파일 git rm (8 파일)**

```bash
cd /Users/sungjiwon/claude/2chi_v1

# pages/*.html (4 파일 — ui_kits/web/index.html 대체)
git rm "design_system/pages/career.html"
git rm "design_system/pages/dashboard.html"
git rm "design_system/pages/onboarding.html"
git rm "design_system/pages/posting-new.html"

# pages/ 빈 디렉토리는 git rm 후 자동 제거됨 (Git 은 빈 디렉토리 추적 안 함)

# uploads/MemomentKkukkukk* (3 파일 — design_system/fonts/ 와 중복)
git rm "design_system/uploads/MemomentKkukkukk.ttf"
git rm "design_system/uploads/MemomentKkukkukkR.woff"
git rm "design_system/uploads/MemomentKkukkukkR.woff2"
```

확인:
```bash
ls design_system/pages/ 2>&1 || echo "pages/ 폴더 제거됨 (정상)"
ls design_system/uploads/
```

Expected: `pages/` 폴더 없음. `uploads/` 에 `ChatGPT Image *.png` (2), `이취_로고 2.svg`, `.DS_Store` (있을 시) 만 남음.

- [ ] **Step 4: 새 번들 자산 복사 (cp)**

```bash
cd /Users/sungjiwon/claude/2chi_v1

# README.md
cp "/tmp/claude-design/2chi-design-system/project/README.md" "design_system/README.md"

# colors_and_type.css
cp "/tmp/claude-design/2chi-design-system/project/colors_and_type.css" "design_system/colors_and_type.css"

# preview/ (28 파일)
mkdir -p design_system/preview
cp -r /tmp/claude-design/2chi-design-system/project/preview/. design_system/preview/

# ui_kits/web/ (3 파일)
mkdir -p design_system/ui_kits/web
cp -r /tmp/claude-design/2chi-design-system/project/ui_kits/web/. design_system/ui_kits/web/

# assets/ — 3 신규 (logo-alt.svg, brand-mood-1.png, brand-mood-2.png). logo.svg 는 기존 유지
cp "/tmp/claude-design/2chi-design-system/project/assets/logo-alt.svg"    "design_system/assets/logo-alt.svg"
cp "/tmp/claude-design/2chi-design-system/project/assets/brand-mood-1.png" "design_system/assets/brand-mood-1.png"
cp "/tmp/claude-design/2chi-design-system/project/assets/brand-mood-2.png" "design_system/assets/brand-mood-2.png"

# fonts/ (3 파일)
mkdir -p design_system/fonts
cp "/tmp/claude-design/2chi-design-system/project/fonts/MemomentKkukkukk.ttf"      "design_system/fonts/MemomentKkukkukk.ttf"
cp "/tmp/claude-design/2chi-design-system/project/fonts/MemomentKkukkukkR.woff"    "design_system/fonts/MemomentKkukkukkR.woff"
cp "/tmp/claude-design/2chi-design-system/project/fonts/MemomentKkukkukkR.woff2"   "design_system/fonts/MemomentKkukkukkR.woff2"
```

확인:
```bash
ls design_system/preview/ | wc -l       # 28 (27 + _card.css)
ls design_system/ui_kits/web/           # 3 (index.html + kit.css + kit-screens.css)
ls design_system/assets/                # 4 (logo.svg + logo-alt.svg + brand-mood-{1,2}.png)
ls design_system/fonts/                 # 3
```

Expected: 위 카운트 일치.

- [ ] **Step 5: SKILL.md 작성**

`design_system/SKILL.md` 신규 생성:

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

- [ ] **Step 6: 새 파일 executable bit 정리**

5.3 review 에서 발견된 같은 이슈 — `cp` 가 source 의 실행 비트 가져옴.

```bash
cd /Users/sungjiwon/claude/2chi_v1
find design_system/preview design_system/ui_kits design_system/assets design_system/fonts design_system/colors_and_type.css design_system/README.md design_system/SKILL.md -type f -exec chmod -x {} \;
```

확인:
```bash
ls -la design_system/colors_and_type.css design_system/README.md
ls -la design_system/preview/ | head -5
```

Expected: 권한 `-rw-r--r--`.

- [ ] **Step 7: 빌드·테스트 회귀 (FE 무관, 사전 검증)**

design_system/ 변경은 FE 코드와 무관. 회귀 빠르게 통과 확인:

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
rm -rf .next/dev
npm test 2>&1 | tail -5
```

Expected: 42 PASS.

(BE 도 무관이지만 본 Task 에선 BE 무영향이 자명해 skip.)

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add design_system/
git status --short | head -20  # 변경량 확인 (~52 파일)

# git ls-files 의 mode 확인하여 100755 인 새 파일 있으면 chmod 다시
git ls-files -s design_system/ | grep "^100755" | awk '{print $NF}' | xargs -r git update-index --chmod=-x

git commit -m "$(cat <<'EOF'
chore(design): Claude Design hand-off 번들 통합 — design_system/ 전체 재구성

- 새 자료 (32 파일): README.md(212줄, 톤·시각·iconography 가이드) + SKILL.md(Claude Code skill) +
  colors_and_type.css(334줄, 토큰+폰트+utility 통합) + preview/ 28(컴포넌트 spec 카드) +
  ui_kits/web/{index.html, kit.css(463), kit-screens.css(311)} + assets/{logo-alt,brand-mood-1,brand-mood-2} +
  fonts/MemomentKkukkukk{ttf,woff,woff2}
- git mv 12: 옛 pages/{기능}.{css,jsx} / tokens.css / doc.css / index.html / uploads/wireframes →
  scraps/source-* + scraps/wireframes-v0.1.html (히스토리 보존)
- git rm 8: pages/*.html 4 (ui_kits/web/index.html 으로 대체) + uploads/MemomentKkukkukk* 3 (fonts/ 와 중복)

FE migration (globals.css + styles/) 은 Task 3 에서. CLAUDE.md §7 갱신은 Task 5 에서.
EOF
)"
```

---

## Task 2: 토큰·베이스 컴포넌트 호환성 검증

**목표:** 새 colors_and_type.css 의 변수명 / kit.css 의 base class 시그니처가 옛 tokens.css / doc.css 와 호환되는지 확인. 비호환 발견 시 Task 4 (page CSS 변환) 추가.

**Files (조사 대상, 변경 없음)**:
- `design_system/scraps/source-tokens.css` (옛 tokens)
- `design_system/colors_and_type.css` (새)
- `design_system/scraps/source-doc.css` (옛 doc)
- `design_system/ui_kits/web/kit.css` (새)
- `frontend/src/styles/tokens.css` (현, 옛 source 와 동일)
- `frontend/src/app/(app)/dashboard.css` / `(public)/onboarding/onboarding.css` / `(app)/me/career.css` (영향 대상)

- [ ] **Step 1: 토큰 변수명 diff**

```bash
cd /Users/sungjiwon/claude/2chi_v1
grep -oE "^  --[a-z][a-z0-9-]*" design_system/scraps/source-tokens.css | sort -u > /tmp/old-vars.txt
grep -oE "^  --[a-z][a-z0-9-]*" design_system/colors_and_type.css | sort -u > /tmp/new-vars.txt

echo "===옛에만 있음 (삭제됨 or 변경됨)==="
comm -23 /tmp/old-vars.txt /tmp/new-vars.txt

echo "===새에만 있음 (신규 추가)==="
comm -13 /tmp/old-vars.txt /tmp/new-vars.txt

echo "===공통==="
comm -12 /tmp/old-vars.txt /tmp/new-vars.txt | wc -l
```

결과 분류 (출력 보고 판단):
- (a) 옛에만 없음 = 0 → **100% 호환**. Task 4 skip
- (b) 옛에만 있음 > 0 → **page CSS 의 해당 변수 사용처 grep** + Task 4 필요

- [ ] **Step 2: 영향 받는 page CSS 의 옛 변수 사용처 grep (Step 1 의 (b) 결과만 대상)**

만약 Step 1 에서 옛에만 있는 변수 발견 시:

```bash
cd /Users/sungjiwon/claude/2chi_v1
echo "옛 변수 목록 (rename/삭제 대상):" && cat /tmp/old-only-vars.txt   # Step 1 결과를 수동 파일로 저장 후

# page CSS 4 + 기타 inline style 영향처 grep
for v in $(cat /tmp/old-only-vars.txt); do
  echo "===$v==="
  grep -rn "var($v)" frontend/src/ design_system/ui_kits/ 2>/dev/null | head -10
done
```

발견된 영향처를 plan 보고에 명시. Task 4 의 변환 매핑 결정에 사용.

- [ ] **Step 3: 베이스 컴포넌트 (`.btn`/`.card`/`.badge`/`.input`/`.field`) 시그니처 diff**

```bash
cd /Users/sungjiwon/claude/2chi_v1
echo "===옛 doc.css 시그니처==="
grep -nE "^\.btn[\.\b\:]|^\.card[\.\b\:]|^\.badge[\.\b\:]|^\.input[\.\b\:]|^\.field[\.\b\:]" design_system/scraps/source-doc.css | head -25

echo "===새 kit.css 시그니처==="
grep -nE "^\.btn[\.\b\:]|^\.card[\.\b\:]|^\.badge[\.\b\:]|^\.input[\.\b\:]|^\.field[\.\b\:]" design_system/ui_kits/web/kit.css | head -25
```

비교 — 동일하거나 비슷한지. 차이 발견 시 (예: `.btn.lg` 의 padding 값) 보고에 명시.

- [ ] **Step 4: 결과 분석 보고 + 분기 결정**

위 Step 1~3 결과를 다음 형식으로 정리:
- 토큰 호환성: 100% / 부분 호환 (rename N개) / 비호환 N+ 개
- 베이스 클래스 호환성: 동일 / 약간 변형 (수용 가능) / 호환 안 됨
- **결정**: 
  - 모두 호환 → Task 4 skip, Task 3 으로 직행
  - 부분 호환 → Task 3 진행 + Task 4 (page CSS rename) 추가
  - 비호환 → 본 PR 중단, spec rollback 시나리오 발동 (frontend 의 옛 tokens/doc.css 유지, design_system/ 만 정리)

이 Task 는 코드 변경 0 — 조사·결정만. 별도 커밋 안 함.

---

## Task 3: FE styles/ 교체 + globals.css 수정

**목표:** frontend 가 새 colors_and_type.css + kit.css 사용. 토큰·베이스 클래스 호환 확인된 상태 가정 (Task 2 통과).

**Files:**
- 삭제: `frontend/src/styles/tokens.css`
- 삭제: `frontend/src/styles/doc.css`
- 신규: `frontend/src/styles/colors_and_type.css`
- 신규: `frontend/src/styles/kit.css`
- 수정: `frontend/src/app/globals.css`

- [ ] **Step 1: 새 css 파일 복사**

```bash
cd /Users/sungjiwon/claude/2chi_v1
cp design_system/colors_and_type.css       frontend/src/styles/colors_and_type.css
cp design_system/ui_kits/web/kit.css       frontend/src/styles/kit.css

# executable bit 정리
chmod -x frontend/src/styles/colors_and_type.css frontend/src/styles/kit.css

ls -la frontend/src/styles/
```

Expected: 4 파일 (tokens.css, doc.css, colors_and_type.css, kit.css) 모두 `-rw-r--r--`.

- [ ] **Step 2: 옛 styles 삭제**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git rm frontend/src/styles/tokens.css frontend/src/styles/doc.css
ls frontend/src/styles/
```

Expected: 2 파일만 남음 (colors_and_type.css, kit.css).

- [ ] **Step 3: globals.css 수정**

`frontend/src/app/globals.css` 현재 내용 먼저 확인:

```bash
cat /Users/sungjiwon/claude/2chi_v1/frontend/src/app/globals.css
```

기존 형태 (5.3-dashboard 기간에 추가된 MemomentKkukkukk @font-face + 5.0 의 tokens/doc.css import):

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "../styles/tokens.css";
@import "../styles/doc.css";

@font-face {
  font-family: "MemomentKkukkukk";
  src: url("/fonts/MemomentKkukkukkR.woff2") format("woff2"),
       url("/fonts/MemomentKkukkukkR.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

html, body {
  padding: 0;
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text-primary);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
```

새 colors_and_type.css 에 `@import url(...)` (Pretendard CDN, Caveat 등) 가 이미 들어있는지 먼저 확인:

```bash
head -20 /Users/sungjiwon/claude/2chi_v1/frontend/src/styles/colors_and_type.css
```

Case A — colors_and_type.css 가 CDN import 내장:
- globals.css 의 첫 2 라인 (`@import url(...)`) 제거 가능. 새 파일이 담당.
- html/body 룰의 font-family/font-size 등 colors_and_type.css 의 `:root` 또는 body 셀렉터로 옮겨졌는지 확인.

Case B — colors_and_type.css 에 CDN import 없음:
- globals.css 의 첫 2 라인 그대로 유지.

`globals.css` 새 내용 (Case A 기준 — 새 파일이 CDN import + body 룰 모두 포함하는 경우):

```css
@import "../styles/colors_and_type.css";
@import "../styles/kit.css";

@font-face {
  font-family: "MemomentKkukkukk";
  src: url("/fonts/MemomentKkukkukkR.woff2") format("woff2"),
       url("/fonts/MemomentKkukkukkR.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

html, body {
  padding: 0;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
```

(font-family/font-size/color/background 는 colors_and_type.css 가 담당.)

새 파일의 실제 내용에 따라 위 두 case 중 선택. 결정 보고에 명시.

- [ ] **Step 4: 빌드 + 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
rm -rf .next/dev
npm test 2>&1 | tail -8
npm run build 2>&1 | tail -10
```

Expected: 42 PASS / BUILD SUCCESSFUL.

실패 시 분석:
- 컴포넌트 테스트 fail → CSS 변수 의존하는 테스트 거의 없음. 만약 fail 시 어떤 케이스인지 보고.
- Build fail → 보통 CSS import 누락 또는 변수 미정의. 메시지 확인.

- [ ] **Step 5: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/styles/ frontend/src/app/globals.css

# executable bit 정리
git ls-files -s frontend/src/styles/ | grep "^100755" | awk '{print $NF}' | xargs -r git update-index --chmod=-x

git commit -m "$(cat <<'EOF'
chore(fe): styles 마이그레이션 — tokens/doc.css → colors_and_type/kit.css

- frontend/src/styles/{tokens.css, doc.css} 삭제
- frontend/src/styles/{colors_and_type.css, kit.css} 추가 (design_system 동명 파일 사본)
- globals.css import 라인 교체. body 룰의 font-family/color/background 는 colors_and_type.css 담당으로 정리
- MemomentKkukkukk @font-face 는 globals.css 에서 유지 (frontend/public/fonts/ 직접 서빙)

토큰·베이스 클래스 호환성 Task 2 에서 검증 완료. 42 Vitest PASS + build SUCCESSFUL.
EOF
)"
```

---

## Task 4 (조건부): Page CSS 토큰 변환

**언제:** Task 2 의 Step 1 에서 옛에만 있는 변수 발견 + page CSS 에서 사용처 발견 시. 100% 호환이면 본 Task skip.

**Files (영향 받을 수 있음):**
- `frontend/src/app/(app)/dashboard.css`
- `frontend/src/app/(public)/onboarding/onboarding.css`
- `frontend/src/app/(app)/me/career.css`
- 일부 inline style 사용처 (TopNav, HomeBanner, ProfileMenu 등 — grep 결과 따름)

- [ ] **Step 1: 변수 rename 매핑 작성**

Task 2 결과를 바탕으로 rename 매핑 정의:

```
# 예시 (실제 매핑은 Task 2 결과에 따라 조정)
--color-primary-blue   → --color-primary-500
--space-tight          → --space-2
```

- [ ] **Step 2: 일괄 변환 (각 변수마다)**

```bash
cd /Users/sungjiwon/claude/2chi_v1
# 각 rename 별로 sed 적용
for f in frontend/src/app/\(app\)/dashboard.css \
         frontend/src/app/\(public\)/onboarding/onboarding.css \
         frontend/src/app/\(app\)/me/career.css \
         frontend/src/components/app-shell/top-nav.tsx \
         frontend/src/components/home/home-banner.tsx \
         ; do
  sed -i.bak -E "s/var\\(--color-primary-blue\\)/var(--color-primary-500)/g" "$f"
  sed -i.bak -E "s/var\\(--space-tight\\)/var(--space-2)/g" "$f"
  rm -f "${f}.bak"
done
```

(실제 변환 매핑은 Task 2 결과에 따라 결정.)

- [ ] **Step 3: 회귀 + 시각 점검**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
npm test 2>&1 | tail -5
npm run build 2>&1 | tail -10
```

Expected: 42 PASS / BUILD SUCCESSFUL.

수동 시각 점검은 Task 6 에서 일괄.

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/app/ frontend/src/components/
git commit -m "chore(fe): page CSS 의 옛 토큰 변수 rename — 새 colors_and_type.css 매핑

Task 2 호환성 검증에서 발견된 N 개 토큰 변수 rename. 영향처:
- dashboard.css / onboarding.css / career.css (page-level CSS 3)
- inline style 사용처 (TopNav, HomeBanner 등)

매핑은 docs/superpowers/specs/2026-05-20-chore-design-system-v2-design.md §3.3 참조."
```

---

## Task 5: CLAUDE.md §7 갱신 + (필요 시 SKILL.md 보강)

**목표:** CLAUDE.md §7 을 새 디자인 시스템 구조에 맞춰 전체 재작성.

**Files:**
- 수정: `CLAUDE.md` (§7 만)

- [ ] **Step 1: 현재 §7 위치 확인**

```bash
grep -n "^## 7\." /Users/sungjiwon/claude/2chi_v1/CLAUDE.md
grep -n "^## 8\.\|^---$" /Users/sungjiwon/claude/2chi_v1/CLAUDE.md | head -5
```

§7 시작 라인 + (다음 섹션이 있다면) §8 시작 라인 확인. 본 프로젝트의 CLAUDE.md 는 §7 이 마지막 섹션일 가능성 큼.

- [ ] **Step 2: §7 본문 교체**

Read 후 §7 전체 영역을 다음 새 본문으로 교체 (구조: spec §4.1 정확히 적용):

```markdown
## 7. 디자인 시스템 참조 규칙

**모든 프론트엔드/디자인 작업은 `design_system/` 디렉토리 내부 자료를 1차 레퍼런스로 한다.** 코드를 짜기 전에 해당 컴포넌트·페이지 레퍼런스를 먼저 읽고 시작할 것. 추측으로 UI 구성·레이아웃·문구를 만들지 말 것.

**정책 — 두 source 분리**:
- **디자인 시스템 (HOW: 토큰·컴포넌트·시각·톤)** — Claude Design hand-off 번들 (`design_system/README.md` + `colors_and_type.css` + `preview/` + `ui_kits/web/`)
- **화면 (WHAT: IA·흐름·페이지별 위젯 배치)** — wireframes (`design_system/scraps/wireframes-v0.1.html`)

핵심 파일 (작업 전 반드시 확인):
- `design_system/README.md` — **톤·시각·iconography·voice 가이드** (1차 정답지, 212줄)
- `design_system/colors_and_type.css` — 토큰·폰트·heading·utility classes (frontend 의 globals.css 에 통합됨)
- `design_system/preview/{영역}.html` — **컴포넌트별 spec 카드 27개** (buttons / cards-kpi / form-inputs / form-toggles / badges-chips / alerts / colors-* / type-* / spacing/radius/shadow / iconography / logo / mascot-cloud / stickers-tape / tone-keywords / ai-verify / progress / bubbles-tone / border-divider)
- `design_system/ui_kits/web/{index.html, kit.css, kit-screens.css}` — **통합 UI kit** (frontend 의 kit.css 와 동기화)
- `design_system/scraps/wireframes-v0.1.html` — 화면 흐름·IA
- `design_system/SKILL.md` — Claude Code skill (`/skill 2chi-design` invoke)
- `design_system/scraps/source-{기능}.{css,jsx}` — 옛 page 구현 source (역사적 참조용, 정답지 아님)

작업 절차 (필수):
1. **시각 가이드 확인** — `design_system/README.md` 의 §3 CONTENT FUNDAMENTALS, §4 VISUAL FOUNDATIONS, §5 ICONOGRAPHY 의 톤·색·타입·doodle·iconography 규칙
2. **컴포넌트 spec 확인** — 사용할 위젯이 있는 `preview/*.html` (예: 버튼 작업 시 `preview/buttons.html`)
3. **화면 흐름 확인** — `scraps/wireframes-v0.1.html` 의 해당 §섹션 (대시보드 §2 / 내정보 §3 / 채용공고 등록 §4 / 자소서 §5·§6 / 캘린더 §7 / 지원 §8 / 기업분석 §9)
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

위 본문으로 교체 — Edit tool 사용. 정확한 old_string 은 현 §7 전체.

- [ ] **Step 3: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: CLAUDE.md §7 갱신 — 새 디자인 시스템 v2 구조 반영

- 정책 명시: 디자인 시스템(HOW) ↔ 화면(WHAT) 분리
- 핵심 파일 재정의: README + colors_and_type.css + preview/ + ui_kits/web + SKILL.md + scraps/wireframes-v0.1.html
- 작업 절차 5단계 (시각 가이드 → 컴포넌트 spec → 화면 흐름 → 통합 UI kit → 누락 시 질문)
- 필수 준수 보강: 톤 키워드 ≥2 hit, 해요체·청유형, 직군별 페르소나
EOF
)"
```

---

## Task 6: 종단 점검 + 푸시 + PR

- [ ] **Step 1: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend
./gradlew test 2>&1 | tail -3
cd ../frontend
rm -rf .next/dev
npm test 2>&1 | tail -8
npm run build 2>&1 | tail -10
```

Expected:
- BE: 변경 없음, PASS
- FE: 42 Vitest PASS
- BUILD SUCCESSFUL

- [ ] **Step 2: dev server 시각 점검 (사용자)**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew bootRun > /tmp/be.log 2>&1 &
BE=$!
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run dev > /tmp/fe.log 2>&1 &
FE=$!

sleep 22

for p in / /me/career /onboarding /signup /login /me /applications /cover-letter /jobs; do
  curl -sf -o /dev/null "http://localhost:3000$p" && echo "OK $p" || echo "FAIL $p"
done
```

브라우저 수동 점검 (사용자가 시각 회귀 판단):
- `/` 대시보드 — Greeting, KPI 3-card, UpcomingPanel, TodayQuote, Shortcuts — 변경 전후 시각 동일 또는 미세 개선
- `/onboarding` — BrandPanel, Stepper, Step1~4, Welcome modal — 동일
- `/me/career` — SideNav, PageHeader, CareerCard, ProjectCard (PRAR cells), AssistantNote — 동일

만약 시각 깨짐 발견 → 토큰 호환성 문제 (Task 4 가 필요했는데 skip 했거나 매핑 누락) — 픽스 후 재커밋.

```bash
kill $BE $FE 2>/dev/null
wait 2>/dev/null
```

- [ ] **Step 3: 푸시**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git push -u origin chore/design-system-v2
```

- [ ] **Step 4: CI 대기**

```bash
sleep 30
gh run list --branch chore/design-system-v2 --limit 1
gh run watch --exit-status
```

Expected: backend + frontend ✅.

- [ ] **Step 5: PR 생성**

```bash
gh pr create --base develop --head chore/design-system-v2 \
  --title "chore: design-system-v2 — Claude Design hand-off 번들 통합 + FE migration" \
  --body "$(cat <<'EOF'
## 요약
- Claude Design hand-off 번들 (`/v1/design/h/PT5a8zslchm-8WisU8uM0g`) 을 \`design_system/\` 에 superset 으로 통합
- frontend 의 \`styles/tokens.css\` + \`styles/doc.css\` → \`colors_and_type.css\` + \`kit.css\` 마이그레이션
- CLAUDE.md §7 전체 갱신 — 새 구조 + 정책 (디자인 시스템 HOW / 화면 WHAT 분리) 반영
- design_system/SKILL.md 신규 — Claude Code skill 통합 (\`/skill 2chi-design\`)

## 변경 파일 요약

### design_system/ (전체 재구성)
- **신규 32 파일**: README.md(212줄) + SKILL.md + colors_and_type.css(334줄) + preview/(28) + ui_kits/web/(3) + assets/(3) + fonts/(3)
- **git mv 12**: 옛 pages/{기능}.{css,jsx} + tokens.css + doc.css + index.html + wireframes → \`scraps/source-*\` (히스토리 보존)
- **git rm 8**: pages/*.html(4 — ui_kits/web/index.html 으로 대체) + uploads/MemomentKkukkukk*(3 — fonts/ 와 중복) + 빈 pages/(1)

### frontend/
- \`src/styles/tokens.css\`, \`doc.css\` 삭제 → \`colors_and_type.css\`, \`kit.css\` 추가
- \`src/app/globals.css\`: import 라인 교체, body 룰 일부 정리

### 정책
- CLAUDE.md §7 — "디자인 시스템(HOW) ↔ 화면(WHAT)" 분리, 핵심 파일 + 작업 절차 + 필수 준수 갱신

## 검증
- BE: 변경 없음, CI ✅
- FE: 42 Vitest PASS, build ✅, CI ✅
- 수동 시각: \`/\` / \`/onboarding\` / \`/me/career\` — 변경 전후 시각 동등성 확인

## 후속 트래킹 (본 PR 외)
- **fix/career-inline-forms** — 5.4 의 \`window.prompt\` 제거 → 새 \`preview/form-inputs.html\` / \`form-toggles.html\` 기준 인라인 폼
- 새 utility classes (\`.font-hand\`, \`.hand-underline\`, \`.text-brand\`) 활용한 기존 페이지 시각 개선
- 새 preview 카드 (bubbles-tone, ai-verify, progress) 활용 — 5.6 자소서 / 5.10 매칭분석 등 후속 feat
- 5.0 잔여 (next/image, ProfileMenu Escape, nav-menu startsWith)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 자체 점검

- [x] 모든 step 실제 명령어 + 코드 포함 (placeholder 없음)
- [x] 파일 경로 절대경로 / 정확한 상대경로 (괄호 경로 escape)
- [x] Spec §1~§8 모든 결정 사항 → Task 1~6 에 매핑됨
  - §1 범위 ✓ Task 1~6 전체
  - §2 디렉토리 매핑 ✓ Task 1 의 mv/rm/add
  - §3 FE migration ✓ Task 3
  - §3.3 토큰 호환성 검증 ✓ Task 2
  - §3.4 베이스 클래스 호환성 ✓ Task 2 Step 3
  - §4.1 CLAUDE.md §7 ✓ Task 5
  - §4.2 SKILL.md ✓ Task 1 Step 5
  - §5 영향 분석 ✓ Task 2 + Task 3 검증
  - §5.3 Rollback ✓ Task 2 Step 4 의 분기 결정
  - §6 비기능 ✓ 의도적 미커버 (런타임 영향 0)
  - §7 작업 순서 ✓ Task 번호 매핑 동일
  - §8 후속 트래킹 ✓ Task 6 의 PR description
- [x] Task 4 의 조건부 트리거 명시 (Task 2 결과에 따라 실행)
- [x] 각 Task 끝 commit, 작은 단위 빈번 커밋
- [x] 시각 회귀 검증 Task 6 의 Step 2 — 사용자 수동 점검 명시
