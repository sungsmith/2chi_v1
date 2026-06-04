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

## P-0003 알림 cron 시스템 설계·구현 (B 시리즈 2번째 / 10-task subagent-driven 풀사이클)

- 기간: 2026-05-28 ~ 2026-06-01
- 카테고리: 백엔드 / 안정성·자동화 / AI-orchestrated 개발 워크플로
- 역량: BE-SPRING-002 (스케줄러·트랜잭션), BE-DB-002 (Postgres partial unique 인덱스), AI-OPS-003 (subagent 파이프라인)
- 자소서 항목 후보: ACHIEVEMENT, PROBLEM_SOLVING

### P · 문제

알림 시스템(PR B 시리즈)의 핵심 가치는 **정확한 시점에 적절한 알림이 사용자에게 도달**하는 것. 그런데 cron 기반 자동 발송은 두 가지 본질적 위험을 안고 있다:

1. **멱등성 결여**: cron 이 재실행·재배포될 때마다 같은 알림이 중복 발송되면 사용자 신뢰가 무너진다.
2. **테스트·검증 어려움**: 매일 09:00 KST 자동 발송 로직은 dev 환경에서 자연 트리거가 안 돼 수동 검증·QA 가 불가능하다.

또한 도메인 의존(공고 마감일, 면접 일정, 자소서 작성 상태, 사용자 알림 설정)이 5개 모듈에 분산돼 있어, 잘못 설계하면 결합도가 폭발한다.

### R · 원인 / 설계 결정

분석 후 다음 4개 핵심 결정으로 위험을 해소:

1. **`dedup_key` + Postgres partial unique** (V6 migration): `UNIQUE (user_id, dedup_key) WHERE dedup_key IS NOT NULL` — 기존 seeder/이벤트 알림(`dedup_key NULL`)은 제약 비대상으로 두고, cron 알림만 `type+참조ID` (예 `PD_D1:42`) 키로 멱등 보장.
2. **2-layer 멱등 패턴**: `existsByUserIdAndDedupKey` 선체크(낙관) + DB unique 제약(동시성 안전망). 단일 스레드 cron 에선 1차 차단, 멀티 인스턴스/재배포 race 에선 2차 차단.
3. **profile-gated 분리**: scheduler 와 `@EnableScheduling` 은 `@Profile("prod")`, 수동 트리거 controller 는 `@Profile("!prod")`. 기본 active profile 이 `local` 인 환경에 맞춰 정확히 매핑(spec 가정 정정).
4. **notification 모듈 집중형 아키텍처**: 도메인 모듈(posting/application/coverletter)은 **read-only 조회만 당함**. 알림 생성 책임은 `NotificationGenerator` 한 곳에 모임. 도메인 → notification 단방향 의존, 결합도 최소.

### A · 접근

`superpowers:subagent-driven-development` 워크플로로 10 task TDD 풀사이클 실행:

- **brainstorming → spec → plan**: 4가지 핵심 결정사항(범위·설정연동·중복방지·스케줄)을 사용자 1:1 대화로 확정. 자소서 미제출 알림은 **공고 마감일이 있는 경우만 + 마감 전 + 7일 방치(updatedAt)** 조건으로 재정의(단순 "저장 7일"에서 발전).
- **task 별 fresh subagent**: 매 task implementer + 통합 리뷰(spec+quality). 매 task 마다 commit + 리뷰 fix commit (총 22 커밋).
- **리뷰 판단**: 타당한 지적은 반영(D3 긍정 테스트, RETENTION 상수 재사용, SEOUL ZoneId 추출, InOrder 순서 검증, sibling test mock 보강), 부정확한 지적은 **기술 검증으로 기각**(Task 5 의 "ad-hoc JOIN invalid" Critical 은 Hibernate 6 가 지원 — `@SpringBootTest` context load 통과로 입증), 영향 미미한 spec mismatch 는 주석 push back(WEEKLY_SUMMARY `Between` boundary).
- **CI 3단계 디버깅**: lint(`react-hooks/set-state-in-effect`) → test(기존 onboarding 테스트의 옛 동작 의존) → build(`Promise.resolve` 제네릭 widening) 연속 실패를 각각 규명·수정([ISSUE-0006](../issues/0006-ci-three-stage-fail-pre-push-local-verification.md) 참조).
- **integration test**: cron 2회 실행 후 알림 1건 검증(real Postgres + V6 + 전체 stack)으로 멱등성을 end-to-end 증명.

### R · 결과

- **PR #30 merge**, 22 커밋(spec/plan 3 + feat 10 + test/refactor/docs 9), 18 신규 테스트(repo 3 / resolver 2 / dedup 1 / generator 9 / scheduler 1 / dev controller 2).
- **알림 5종 type 동작 보장**: POSTING_DEADLINE_D3/D1, SCHEDULE_D1, COVER_LETTER_UNSUBMITTED_7D, WEEKLY_SUMMARY + 30일 cleanup.
- **멱등성 정량 검증**: cron 2회 연속 실행 → 알림 row 수 1건 불변(integration test 통과).
- **사용자 설정 존중**: `UserNotiSetting` row 있으면 사용자 값, 없으면 `NotiSettingDef.defaultOn` 자동 fallback. mypage 알림 설정 UI 의 토글이 실제로 cron 동작에 반영됨 (이전엔 UI 만 있고 cron 미연동 = 토글 무의미).
- **dev 검증 가능성 확보**: `POST /api/v1/dev/notifications/run-cron?date=YYYY-MM-DD` 로 임의 날짜 시뮬레이션. QA·디버깅 시간 대폭 단축.
- **subagent-driven 워크플로 실증**: implementer + 리뷰 + 검증 사이클을 10 task 에 일관 적용. 리뷰어의 부정확한 Critical 도 컨트롤러가 기술 검증으로 기각해 시간 낭비 방지(spec 무비판 수용 X). 자소서/면접에서 "AI 도구 활용 + 비판적 검증" 능력 시연 가능.
- **부산물**: learning 노트 1건([subagent-driven-review-judgment](../learning/subagent-driven-review-judgment.md)), issue 1건([0006](../issues/0006-ci-three-stage-fail-pre-push-local-verification.md)).

### 키워드

Spring `@Scheduled`, `@Profile` gating, `@EnableScheduling`, Postgres partial unique index, dedup_key 멱등 패턴, Hibernate 6 ad-hoc entity JOIN, JPA interface projection, Spring Data derived query, TDD subagent-driven development, 리뷰 검증·반영·기각 판단, `@SpringBootTest` context-load 쿼리 검증

### 사용한 도구

Claude Code subagent (general-purpose + superpowers:code-reviewer), Flyway, JUnit5 + Mockito + AssertJ, `@WebMvcTest` + `@MockitoBean`, GitHub Actions CI (lint/test/build 3-stage), `gh pr` CLI, `git worktree` 패턴(미사용, feat 브랜치로 충분)

### 비고

리뷰어와의 의견 충돌 케이스(Task 5 ad-hoc JOIN, Task 7 Between boundary)는 receiving-code-review 정신상 가치 있는 사례 — 무비판 수용도, 무비판 거부도 아닌 **검증→판단→문서화** 사이클을 보여줌. 면접에서 "AI 리뷰어 신뢰도 어떻게 평가하시나요?" 같은 질문에 즉시 답할 수 있음.

---

## P-0004 베타 차단 요소 감사→해소 (단일 세션 8 PR / 다층 리뷰가 잡은 critical 결함)

- 기간: 2026-06-01 ~ 2026-06-03
- 카테고리: 백엔드·프론트엔드 / 출시 준비·품질 게이트 / AI-orchestrated 개발 워크플로
- 역량: AI-OPS-003 (subagent 파이프라인), BE-SPRING-002 (이벤트 리스너·트랜잭션), BE-DB-003 (JPA AttributeConverter 필드 암호화), QA-REVIEW-001 (다층 코드리뷰·통합리뷰) *(ID 는 competency_matrix 확정 시 정합 필요)*
- 자소서 항목 후보: ACHIEVEMENT, PROBLEM_SOLVING, STRENGTH

### P · 문제

베타(지인 5~10명 도그푸딩) 오픈을 앞두고 "무엇이 실제로 사용자를 막는가"가 불명확했다. 메모리 노트엔 "§9 기업분석 BE/FE wiring 미완"으로 적혀 있었으나 **정확한 현황은 아무도 몰랐다**(노트가 stale). 추측으로 작업하면 이미 된 걸 다시 만들거나(낭비) 진짜 차단 요소를 놓친다(출시 후 사고).

### R · 원인 / 진단

코어 도그푸딩 여정(가입→온보딩→내정보→자소서→공고→지원추적→기업분석→알림)을 **FE↔BE 배선 기준으로 전수 감사**(Explore subagent). 결과:

- 메모리 노트가 **부정확** — §9 는 실제 ~90% 완성(#13/#20), 남은 건 구체적 gap 2개뿐이었다.
- **진짜 베타 차단 4건 발견**: ① 비밀번호 재설정이 죽은 데모(BE 無) ② 지원현황 Kanban 이 정적 mock(BE CRUD 는 존재하나 미배선) ③ 내 정보 메인이 영속화 BE 자체가 없음 ④ 대시보드 가짜 수치.
- **OPS 차단 2건**: `MASTER_ANSWER_ENCRYPTION_KEY` 미설정 시 앱 기동 실패, `SPRING_PROFILES_ACTIVE` 미설정 시 dev 엔드포인트 무인증 노출.
- 우선순위: 사용자가 직접 막히는 순서(① → ② → ③).

### A · 접근

각 기능을 brainstorming → spec → plan → `subagent-driven-development`(implementer + 2단계 리뷰: spec 준수 → 코드 품질) → fix loop → 최종 통합 리뷰 사이클로 처리. 독립 모듈은 별도 브랜치/PR 로 병렬화.

- **#3 내 정보(최대 작업)**: DB 테이블(education/certificate/experience)이 V1 에 이미 존재함을 발견 → 마이그레이션 없이 매핑. **canonical-then-mirror** 전략: Education CRUD 를 먼저 만들고 **리뷰로 정제한 뒤** Certificate/Experience 가 복제 → 결함이 3× 전파되는 것을 차단(리뷰가 잡은 `assert`→AssertJ, `findOwned` private, GPA `@Digits` 를 미러 전에 수정).
- **다층 리뷰가 잡은 결함(핵심)**:
  1. **통합 리뷰가 critical FE↔BE 계약 버그 포착** — 리스트 GET 이 `{educations:[...]}` 래퍼 반환인데 FE 가 `X[]` 로 받아 **새로고침 시 내정보 리스트가 항상 빈 채로 표시**. per-task 리뷰와 단위 테스트가 **모두 놓침**(테스트가 api-client 레벨 mock 이라 실제 파싱을 우회 → test altitude 문제). 머지 전 차단.
  2. **OpenAI 키 lazy 처리 — 목표 미달 포착**: §9 에서 1개 클라이언트만 고쳤으나 통합 리뷰가 "앱 기동 보호" 목표가 **나머지 2개 클라이언트(자소서·키워드)가 여전히 startup throw 라 미달**임을 발견 → 3개 전체 처리. caller 계약 차이(자소서=throw→503, 키워드=빈 리스트 반환→공고 생성 보호)를 의도적 비대칭으로 보존.
  3. **PII 평문 저장 포착 → 암호화**: 내정보 wiring 으로 `profile.name/phone` 이 DDL 의도(AES-256)와 달리 평문 저장됨을 리뷰가 지적 → 기존 `MasterAnswerEncryptor` + JPA `AttributeConverter` 로 암호화. 후속 리뷰가 **VARCHAR(255) 가 한글 50자 암호문(~350자)에 부족**함을 계산으로 잡아 TEXT 로 정정.
- **CI 교훈**: 로컬 `npm test` 통과했으나 CI `npm run lint`(eslint)가 `react/no-unescaped-entities`(한글 직선따옴표)로 실패 → 로컬 검증에 lint 포함 필요를 학습.
- 범위 밖 항목은 spawn-task chip 으로 추적(데드 코드, 보안 follow-up 등).

### R · 결과

- **단일 세션 8 PR 전부 CI-green merge** (#32 B3 알림 · #33 §9 기업분석 · #34 비번재설정 정리 · #35 Kanban 배선 · #36 Kanban 단순화 · #37 내정보 Full · #38 OpenAI 공유 베이스 · #39 PII 암호화).
- **베타 차단 4/4 해소** → 도그푸딩 오픈 가능 상태(베타 차단 0).
- **머지 전 차단한 critical/important 결함 다수**: 내정보 리스트 공백 버그(사용자 직격), OpenAI 미완 수정, PII 평문+컬럼 오버플로우 — 전부 **통합 리뷰가 단위 테스트 통과 후 포착**.
- **#3 규모**: BE 3 CRUD(각 domain/repo/service/controller/dto + 통합테스트) + 기초정보(공유 Profile 엔티티 확장, onboarding 회귀 0) + FE(api 4 + 타입 + profile-view 재작성, 섹션별 add/edit/delete). 전 task spec+품질+통합 리뷰 통과.
- **품질 게이트 실증**: implementer→spec리뷰→품질리뷰→fix→통합리뷰 다층 구조가 **각 층이 다른 종류의 결함을 잡음**을 입증(단위테스트=로직, per-task=구현, 통합=계약/altitude). 자소서/면접에서 "AI 다층 리뷰 파이프라인 설계 + 통합 리뷰의 고유 가치" 시연 가능.
- **부산물**: learning 노트 1건([review-layering-and-test-altitude](../learning/review-layering-and-test-altitude.md)), spawn-task 추적(common.crypto 추출 등).

### 키워드

beta-readiness audit, FE↔BE 계약 검증, test altitude(mock 레벨이 가린 버그), 다층 코드리뷰(spec/quality/integration), canonical-then-mirror CRUD, JPA `AttributeConverter` AES 암호화, Spring `@TransactionalEventListener(AFTER_COMMIT)`, lazy bean init(키 부재 graceful), squash-merge PR 워크플로, eslint CI 게이트

### 사용한 도구

Claude Code subagent (general-purpose + Explore + code-reviewer), git worktree/feat 브랜치 + `gh pr` squash merge, Flyway(V7/V8), JUnit5 + AssertJ, Vitest + RTL, Spring Security Crypto(`Encryptors.delux`), GitHub Actions CI(lint/test/build)

### 비고

이 세션의 핵심 교훈은 **"통합 리뷰는 단위 테스트·per-task 리뷰가 구조적으로 못 잡는 결함을 잡는다"**. 리스트 공백 버그는 단위 테스트가 api-client 를 mock 했기 때문에 절대 안 걸렸고, 오직 FE↔BE 계약을 함께 본 통합 리뷰만 포착했다. 면접 "테스트가 다 통과했는데 왜 버그가 났나요?" 질문의 모범 답안.