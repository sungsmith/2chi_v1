# Subagent-Driven Development 회고 — 5.9 + 5.8 두 사이클

- 학습일: 2026-05-22
- 계기: 5.9 (기업분석, 9 task) + 5.8 (지원 현황, 9 task) 두 feature 를 동일한 superpowers:subagent-driven-development 흐름으로 완료
- 관련 역량: BE-COL-002 (코드 리뷰), BE-COL-003 (기술 문서화)
- 트랙: BACKEND / FRONTEND (워크플로 영역)

## 핵심 개념

- **흐름**: brainstorming → spec write → spec self-review → user spec review → writing-plans (4000+ 줄 plan) → subagent-driven execution (task 마다 implementer → spec compliance reviewer → code quality reviewer → fix → re-review)
- **fresh subagent per task**: controller (대화 본체) 는 context 보존, 각 task 는 격리된 subagent. controller 가 task 텍스트 + 컨텍스트를 직접 전달 (subagent 가 plan 파일 read 하지 않도록).
- **two-stage review**: spec compliance (요청한 대로 만들었나) → code quality (잘 만들었나). 순서 중요 — spec 먼저 통과 후 quality.
- **두 사이클 합계 ~20 task, 80+ commits, 1 회 brainstorming 가정 오류 발견 + 즉시 정정**.

## 본 프로젝트 적용

5.9 + 5.8 모두 동일한 9-task 구조:
1–5: BE (migration + entity → repository → service → controller + DTO + integration test)
6: FE 기반 (types + API client + page wrappers + 토큰)
7–8: FE 화면
9: cross-area + PR

각 task 마다 평균:
- implementer subagent 1 회 (DONE)
- spec reviewer 1 회 (대부분 ✅, 가끔 ⚠️)
- code quality reviewer 1 회 (Important fixes 1–2 건/task, Minor 다수)
- fix-up commit 1–2 건 + 재검토 (소형 수정은 직접 패치 후 다음 task 진행)

산출물 통계 (5.8 기준):
- 13 commits (8 feat + 5 fix-up)
- BE 통합 테스트 15 건
- FE vitest 17 건
- 코드 리뷰가 발견하여 차단한 critical/important 이슈: 6 건 (FK 참조 / Flyway checksum / TIMESTAMP vs TIMESTAMPTZ / @Valid 누락 / 미사용 import 5 건 / KST 타임존)

## 함정 / 주의사항

- **plan 작성 단계에서 가정 검증 부족 시 큰 영향**: 5.8 Task 1 의 V1 schema 미인지가 대표 예 (ISSUE-0002). brainstorming 단계 "Explore project context" 가 wireframe 까지만 가고 V1 init schema 까지 안 본 것이 root cause. plan self-review 의 "spec coverage" 만으로는 못 잡음.
- **subagent 가 plan 의 명세를 그대로 따라서 잘못된 코드 작성하는 경우**: 5.8 Task 1 의 FK 참조 (plan 이 잘못 명시) — implementer subagent 는 의문점만 보고하고 spec 그대로 따름. spec 자체의 정확도가 더 중요.
- **Clock bean 없음** 등 plan 작성자의 잘못된 가정이 service 코드 블록에 반영. 5.8 Task 2 dispatch 시 controller 가 "corrections" 항목으로 미리 알려서 우회.
- **subagent 의 self-review 와 controller 의 검증 둘 다 필요**: implementer 가 "DONE, self-review OK" 보고 후 reviewer 가 5 unused import 발견. self-review 만 믿으면 안 됨.
- **token 비용**: 9 task × 3 subagent (implementer + 2 reviewer) = 27 subagent 호출 / feature. v2 에 작은 task 는 combined review (spec + quality 1 회 dispatch) 로 절감 가능 — 단 risk 높은 task 는 분리 유지.
- **code reviewer 가 발견한 Minor 중 일부는 의도적 deferral**: posting-card 의 409 toast 미발생 (project-wide http 패턴 hole) 같은 건 별도 follow-up PR 로. cleanly 처리하려면 별도 task list 에 backlog 등록.
- **머지 직전 cross-area cleanup 발견**: 5.8 PR 머지 후 사용자가 메인 페이지 Shortcuts 404 발견 → 5.5/5.6/5.7/5.9 진행하면서 라우트 경로 표류한 href 가 placeholder 그대로 방치. PR 머지 전 영향 범위 grep 필수.

## 참고

- superpowers:brainstorming, superpowers:writing-plans, superpowers:subagent-driven-development 의 SKILL.md
- 5.9 PR: https://github.com/sungsmith/2chi_v1/pull/13
- 5.8 PR: https://github.com/sungsmith/2chi_v1/pull/14
- 5.8 spec: `docs/superpowers/specs/2026-05-22-feat-5.8-applications-design.md` (656 줄)
- 5.8 plan: `docs/superpowers/plans/2026-05-22-feat-5.8-applications.md` (4284 줄)
