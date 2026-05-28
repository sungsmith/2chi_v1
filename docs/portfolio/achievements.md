# 성과 카탈로그

## P-0001 자소서 작성 페이지 LCP 75% 단축

- 기간: 2026-05-20 ~ 2026-05-25
- 카테고리: 프론트엔드 / 성능
- 역량: FE-PERF-001 (코어 웹 바이탈)
- 자소서 항목 후보: ACHIEVEMENT, PROBLEM_SOLVING

### P · 문제
지인 베타 5명 테스트 시 자소서 작성 페이지 LCP 4.8초 측정. "느려서 다른 탭으로 이동"한다는 피드백 3건.

### R · 원인
- AI 응답 대기 중 메인 스레드 블로킹
- 자소서 항목 마스터 답변 전체를 SSR로 한 번에 가져와 첫 페인트 지연
- 폰트 webfont 비차단 로딩 미적용

### A · 접근
- 마스터 답변을 paginated client fetch로 전환 (TanStack Query)
- 폰트에 font-display: swap
- AI 응답은 streaming + skeleton UI

### R · 결과
- LCP 4.8s → 1.2s (75% 단축)
- 베타 사용자 페이지 체류 시간 평균 1분 12초 → 3분 8초
- "느려서 이동" 피드백 0건 (4주 관찰)

### 키워드
LCP, TanStack Query, font-display, streaming, Next.js

### 사용한 도구
Lighthouse, Chrome DevTools Performance, Sentry Web Vitals

## P-0002 디자인 시스템 mock → frontend 포팅 결함 12건 일괄 정리 (검증 차원 설계)

- 기간: 2026-05-28 (단일 세션)
- 카테고리: 프론트엔드 / 품질·검증 자동화
- 역량: FE-QA-001 (정합성 검증 설계), AI-OPS-002 (subagent 활용 검증 파이프라인)
- 자소서 항목 후보: PROBLEM_SOLVING, ACHIEVEMENT

### P · 문제

mock(디자인 시스템) → frontend 정렬 PR 이후 사용자 베타 테스트에서 시각 결함 5건이 누적 신고됨 (온보딩 좌측 패널 padding 깨짐, 직무 카드 색 뒤섞임, 체크박스 ✓ 미표시, 모달 미표시 등). 디자인 시스템에는 정답이 있는데 frontend kit.css 가 변형/누락된 채로 마이그레이션 됐음. 한 건씩 발견될 때마다 사용자 흐름이 차단되는 retro 부담.

### R · 원인

1차로 subagent 1대에 "frontend 에 누락된 selector 찾기" 를 위임 → **selector 가 통째로 없는 케이스 (1건)** 만 잡고 나머지는 못 잡음. 이유는 검증 차원이 1개 (`exists / not exists`) 뿐이었기 때문.

사용자가 직접 발견해 신고한 두 케이스로 결함의 다른 차원 노출:
- **case A — selector position swap**: mock 의 `.X[data-tone="mint"] .Y` 가 frontend 에서 `.X .Y[data-tone="mint"]` 로 attribute 위치가 자식으로 옮겨짐. selector 자체는 존재하지만 JSX 의 attribute 위치와 매칭 실패.
- **case B — selector list merge**: mock 의 `.X.done`, `.X.active` 가 frontend 에서 `.X.active, .X.done` 으로 묶이며 한쪽 색이 흡수되어 손실.

1차 검사는 두 케이스 모두 `exists` 로 카운트되어 false negative.

### A · 접근

검증 차원 4개로 확장한 2차 검사 설계 후 subagent 재실행:

1. selector 위치 변형 (`[attr]` 가 어느 element 에 있는지)
2. selector list 통합으로 인한 property 손실
3. modifier (`.done`/`.active`/`.selected`/`.tone-N`) 의 color/background 값 차이
4. pseudo-element (`::after`/`::before`) 의 색 차이

각 차원에 대해 mock CSS 7파일 (3,416줄) ↔ frontend kit.css (4,420줄) selector-단위 1:1 비교. 30+ 컴포넌트 modifier 매핑까지 모두 확인.

surgical fix 원칙: 검사 결과 Critical 만 즉시 패치, Likely (의도된 디자인 변경일 수 있는 것) 는 사용자에게 보고만 — 의도 파괴 방지.

### R · 결과

- 발견·수정 결함: **12건** (한 세션, 한 PR 단위)
  - selector 누락: 4건 (`.onb-left` root + h1/.accent/.lead)
  - selector position swap: 1건 (`.onb-choice[data-tone]`)
  - selector list merge: 2건 (`.onb-step-pill.done .num`, `.bar::after` mint 손실)
  - tone permutation: 1건 (`.position-card.tone-N` 색 순서 + 스케일 어긋남)
  - markup-CSS 매칭 결함: 2건 (체크박스 ✓ children, `.auth-terms .all .box` inline-grid)
  - layout property 누락: 2건 (`display:block`, `.onb-welcome .card` flex)
- 결함 발견 / 픽스 단위 시간: 약 60분 (검증 차원 설계 → subagent 실행 → 보고서 검토 → surgical patch 12회)
- 검증 차원 추가 (1차원 → 4차원) 후 사용자가 신고한 case A/B 가 1차 검사에서 잡혔다면 발생하지 않았을 user-facing 결함 5건 사전 차단 가능.
- 부산물 1 — **race condition 패턴 전수 점검·해결**: 온보딩 완료 모달 race ([ISSUE-0005](../issues/0005-onboarding-welcome-modal-race-condition.md)) 발견 후, 같은 인과 사슬(layout guard 의 `setUser(null)` 자동 반응)을 가진 흐름 3건(비밀번호 변경·회원탈퇴·로그아웃)을 전수 점검. 그중 2건이 redirect 쿼리 분실로 **"비밀번호 변경됨"·"30일 내 복구 가능" 안내 배너가 사라지는** 결함 확인 → 표시 정보를 URL 쿼리에서 sessionStorage 로 분리해 race 결과와 무관하게 표시 보장. 단위 테스트 16/16 통과로 검증. 1개 버그 리포트에서 출발해 동일 패턴 4건을 선제 정리.
- 부산물 2 — 학습 노트 1건 작성 ([react-effect-router-redirect-race](../learning/react-effect-router-redirect-race.md)): "race 를 직렬화하는 대신 race 결과에 대한 의존을 끊는다" 라는 일반 원칙 도출.

### 키워드

CSS specificity, attribute selector, design system port verification, subagent QA pipeline, false negative reduction, surgical patch, race condition, useEffect redirect guard, sessionStorage, defensive design

### 사용한 도구

Claude Code subagent (general-purpose), grep selector 비교, mock JSX ↔ frontend TSX attribute 매칭 검증, Read/Edit surgical patching

### 비고

검증 방법론을 docs/learning 에 별도 노트로 추출하지 않은 이유: 본 사례가 도메인 (디자인 시스템 포팅) 특수성이 강해 일반화보다는 실무 case study 로 본 portfolio 항목에 압축. 다른 마이그레이션 (API 스키마, i18n key 정렬 등) 작업 시 같은 4차원 검증 프레임 적용 가능.