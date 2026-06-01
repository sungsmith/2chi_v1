# [ISSUE-0006] CI 가 lint → test → build 3단계 연속 fail — push 전 로컬 3종 선검증 결여

- 발생일: 2026-05-28 (PR #29 auth race fix 진행 중)
- 환경: GitHub Actions (Frontend job: lint / test / build)
- 심각도: medium (작업 차단은 아니지만 CI 왕복 3회 + 시간 소비)
- 관련 역량: FE-CI-001 (CI 파이프라인 디버깅), ENG-PROCESS-001 (push 전 선검증 습관)

## 증상

PR #29 (auth redirect race fix) push 후 CI 가 **연속 3회 fail**, 매번 다른 단계에서 떨어짐:

```
1차 push → lint FAIL (27초 만에)
   ↓ fix
2차 push → lint pass, test FAIL (1분 3초)
   ↓ fix
3차 push → lint pass, test pass, build FAIL (typecheck)
   ↓ fix
4차 push → 전부 pass
```

로컬에서는 `npx vitest run <변경한 파일들만>` 으로 통과 확인했었음. 즉 부분 검증만 하고 push 함.

## 원인

각 단계의 실패가 **서로 다른 결함 클래스**를 잡아냄:

| 단계 | 실패 원인 | 결함 클래스 |
|---|---|---|
| **Lint** | `useEffect` 안 동기 `setBanner()` → `react-hooks/set-state-in-effect` error (React 19 / Next 16 신규 룰) | 프레임워크 신규 정적 분석 룰 |
| **Test** | `onboarding-flow.test.tsx` 가 옛 동작(`refreshUser` 가 `submit` 직후 호출)을 검증. race fix 로 호출 시점이 `dismissWelcome` 으로 이동했는데 테스트 미갱신 | 변경한 행동에 의존하는 기존 테스트 회귀 |
| **Build (tsc)** | `Promise.resolve(b).then(setBanner)` 에서 TypeScript 가 제네릭 `Promise<string>` 으로 widen → `setBanner(SetStateAction<…literal union…>)` 와 incompatible | 타입체크는 런타임/lint 와 독립 — vitest 는 타입체크 안 함, lint 도 모름 |

핵심: 로컬에서 `npx vitest run <변경 파일>` 만 돌렸으니 lint·typecheck·전체 test 회귀를 못 봄. **결함 클래스마다 잡는 도구가 다른데 모두를 돌리지 않은 게 진짜 원인.**

## 해결

1. **즉시 (각 단계마다)**:
   - lint: `useEffect` 안 `Promise.resolve(b).then(setBanner)` 로 setState 를 effect 동기 흐름 밖으로 (learning [react19-set-state-in-effect-pattern](../learning/react19-set-state-in-effect-pattern.md) 패턴 적용)
   - test: `onboarding-flow.test.tsx` 를 race fix 의도에 맞게 갱신 (`refreshUser` assertion 을 dismissWelcome 클릭 후로 이동) — 오히려 회귀 방지 강화
   - build: `Promise.resolve().then(() => setBanner(b))` 로 클로저 캡처 (제네릭 widening 우회)

2. **근본 (push 전 워크플로 변경)**:
   - 로컬 push 전 **3종 동시 검증**:
     ```bash
     npm run lint && npm test && npm run build
     ```
   - 또는 명시적으로:
     ```bash
     cd frontend && npm run lint && npx vitest run && npm run build
     ```
   - 이 한 줄이 CI 왕복 3회를 0회로 만든다.

3. **PR #30 (notification cron) 에서 즉시 적용**: 로컬에서 `./gradlew test` 전체 + `./gradlew build` 까지 push 전 확인 → CI 1회 만에 모두 통과.

## 학습

- **결함 클래스 ↔ 검증 도구 매핑**:
  - 정적 분석 룰 → linter (eslint / ktlint)
  - 행동 회귀 → **전체** 테스트 스위트 (한 파일이 아니라)
  - 타입 안전 → typechecker (tsc / kotlinc)
  - 통합/E2E → integration test (Playwright, @SpringBootTest 등)
- **부분 검증의 함정**: "변경한 파일만 테스트" 가 가장 자주 빠지는 함정. 변경한 파일이 다른 파일의 검증 대상일 수 있다 (onboarding-flow.test 가 onboarding-flow.tsx 에 의존).
- **CI는 마지막 안전망이지 1차 방어선이 아니다**: CI 왕복은 push → GitHub → runner queue → 5분 대기 → 결과. 로컬 30초 명령이 10배 빠르다.
- **3종 명령을 워크플로 단축어로**: `alias preflight='npm run lint && npm test && npm run build'` 같은 alias 또는 `package.json` 의 `"preflight"` script 로 묶기. 한 손가락으로 push 전 모든 검증.
- **AGENTS.md 경고를 무시한 결과**: 이 프로젝트의 `frontend/AGENTS.md` 는 "this is NOT the Next.js you know" 라 경고. React 19 신규 룰(`react-hooks/set-state-in-effect`) 이 정확히 그런 케이스. 새 버전 환경에선 기존 패턴이 lint error 가 될 수 있음을 항상 의심.

## 자소서 활용 후보

- 항목: PROBLEM_SOLVING / WEAKNESS (선검증 습관 개선의 회고)
- 정량: "CI 왕복 3회 → 1회 (push 전 lint+test+build 3종 자동화로 약 30분 시간 절약, PR 마다)"
- 직군 권장 구조: PRAR (백엔드 표준)
- 메타 가치: 단순 실수 회고가 아니라 **"결함 클래스마다 검증 도구가 다르다"** 는 일반화. 다른 스택(Java tsc 대응 = javac/ktlint, Python lint = ruff + mypy)에도 그대로 이식 가능한 사고 프레임.
