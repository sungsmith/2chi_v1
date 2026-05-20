# CLAUDE.md

LLM 코딩 실수를 줄이기 위한 행동 지침. 프로젝트별 지침과 병합하여 사용 가능.

**트레이드오프:** 속도보다 신중함과 정확성에 무게를 둠. 사소한 작업은 상황에 맞게 판단할 것.

## 1. 코딩 전 생각하기

**독단적 추정 금지. 의문점 은폐 금지. 트레이드오프 명시.**

구현 전 필수 확인:
- 가정(Assumptions)을 명확히 밝힐 것. 불확실하면 질문할 것.
- 여러 해석이 가능할 경우, 독단적으로 선택하지 말고 대안을 제시할 것.
- 더 간단한 접근법이 있다면 제안할 것. 필요한 경우 기존 요구사항에 이의를 제기할 것.
- 모호한 부분이 있다면 즉시 중단하고, 의문점을 명시하여 질문할 것.

## 2. 단순성 최우선

**요구사항을 해결하는 최소한의 코드 작성. 투기적(Speculative) 개발 금지.**

- 요청받지 않은 기능 구현 금지.
- 단일 사용 코드에 대한 과도한 추상화 금지.
- 요청받지 않은 "유연성"이나 "설정 가능성" 추가 금지.
- 발생 불가능한 시나리오에 대한 예외 처리 금지.
- 50줄로 가능한 코드를 200줄로 작성했을 경우 반드시 재작성할 것.

*자가 점검: "시니어 엔지니어가 보기에 과도하게 복잡한가?" -> 그렇다면 단순화할 것.*

## 3. 정밀한 코드 수정 (Surgical Changes)

**필요한 부분만 수정. 본인이 유발한 사이드 이펙트만 정리.**

기존 코드 수정 시:
- 주변 코드, 주석, 포맷팅을 임의로 "개선"하지 말 것.
- 고장 나지 않은 코드를 리팩토링하지 말 것.
- 본인의 선호도와 다르더라도 기존 코드 스타일을 엄격히 따를 것.
- 관련 없는 무효 코드(Dead code) 발견 시, 직접 삭제하지 말고 언급만 할 것.

변경으로 인한 무효화 발생 시:
- **본인의 수정**으로 인해 사용되지 않게 된 임포트, 변수, 함수만 제거할 것.
- 기존에 존재하던 무효 코드는 요청이 없다면 건드리지 말 것.

*측정 기준: 변경된 모든 줄은 사용자의 요청과 직접적으로 연결되어야 함.*

## 4. 목표 중심 실행

**성공 기준 정의. 검증될 때까지 루프 반복.**

작업을 검증 가능한 목표로 변환:
- "유효성 검사 추가" → "유효하지 않은 입력에 대한 테스트 작성 및 통과 확인"
- "버그 수정" → "버그 재현 테스트 작성 및 통과 확인"
- "X 리팩토링" → "리팩토링 전후 테스트 통과 확인"

다단계 작업의 경우 간결한 계획 수립:

1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
3. [단계] → 검증: [확인 방법]

명확한 성공 기준이 있으면 독립적으로 루프를 돌 수 있다. 기준이 모호하면("되게 해줘") 매번 확인이 필요해진다.

이 지침이 잘 작동하고 있다면: diff에 불필요한 변경이 줄고, 과도한 복잡성으로 인한 재작성이 줄며, 실수 후가 아니라 구현 전에 명확화 질문이 나온다.

## 5. 학습·포트폴리오 자료

개발 중 발생한 이슈·학습 내용·정량 성과는 `docs/` 하위에 기록한다.
세부 운영 방식은 `docs/README.md` 참조.

- `docs/issues/<번호>-<제목>.md` — 트러블슈팅 (재현·원인·해결·학습 4단)
- `docs/learning/<주제>.md` — 학습 노트 (개념·적용·함정)
- `docs/portfolio/achievements.md` — 정량 성과 (PRAR 형식, 자소서 그대로 활용)
- `docs/devlog/YYYY-MM-DD.md` — (선택) 일/주 단위 개발 일지

본 디렉토리는 Claude Code가 매 작업마다 자동 참조하지 않는다. 필요 시 명시적으로 첨부하거나, 작업 종료 시 사용자가 "오늘 작업을 이슈/포트폴리오로 정리해줘" 요청 시 Claude Code가 위 템플릿으로 기록한다.

기록 시 가능하면 다음을 연결:
- 관련 역량: `BE-XXX-NNN` (직무 표준 역량 매트릭스 ID)
- 자소서 항목 후보: MOTIVATION / ACHIEVEMENT / PROBLEM_SOLVING 등
- 직군 권장 구조 적용: PRAR / UX-Driven / Ops-Result / Design Thinking

## 6. 깃 브랜치 전략

```
main                          # 안정 버전 (직접 커밋 금지)
└── develop                   # 통합 브랜치
    ├── feat/5.1-auth-signup  # 섹션 번호 + 기능명
    ├── feat/5.2-onboarding
    ├── feat/5.6-cover-letter-ai
    └── fix/<설명>
```

- 모든 작업은 `develop`에서 분기
- 브랜치명: `feat/{섹션번호}-{기능명-kebab-case}` 또는 `fix/{설명}`
- feat 완료 → develop PR → 리뷰 에이전트 검증 통과 후 merge
- `main` 직접 커밋 금지. develop → main은 v1 릴리즈 시점에만.

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
- 컴포넌트명: PascalCase / 파일명: kebab-case