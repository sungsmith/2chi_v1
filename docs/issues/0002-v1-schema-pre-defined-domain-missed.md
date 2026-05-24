# [ISSUE-0002] V1 schema 사전 정의된 도메인 테이블 미인지 — 5.8 V3 migration 충돌

- 발생일: 2026-05-22
- 환경: local (5.8 Task 1 구현 직후)
- 심각도: medium (구현 1 task 후 발견, plan/spec 정정 + 재작업 필요)
- 관련 역량: BE-DB-006 (DB 마이그레이션), BE-DB-003 (ERD·데이터 모델링)

## 증상

5.8 §7 캘린더 + §8 지원 대시보드 도메인 구현 (Task 1: V3 migration + entity) 진행 중, implementer subagent 가 FK 참조 테이블명을 확인하지 못해 우려를 보고. V1 schema 를 직접 grep 한 결과 두 가지 발견:

1. V1 의 실제 테이블명이 `app_user` / `job_posting` (singular) 인데 plan/spec 의 V3 migration 은 `users(id)` / `job_postings(id)` 로 잘못 참조 → Flyway 적용 시 FK 에러 발생.
2. **V1 schema 가 이미 `application` + `application_history` 테이블을 사전 정의해두었음** (line 461–511). 즉 brainstorming 단계에서 합의한 "Application + Event 1:N" 모델과는 다른 (`dates_json JSONB` + audit log) 모델로 schema 가 깔려있는 상태.

이 사실을 spec/plan 단계에서 인지 못해서, V3 migration 이 V1 의 의도와 충돌하는 새 테이블을 만들고 있었음.

## 원인

- brainstorming 단계에서 "지원 도메인이 없으니 처음부터 만든다" 라고 단정. 실제로는 V1 init schema 가 §7–§9 영역까지 미리 깔아둔 상태였음.
- 5.9 (company_analysis) 진행 때는 V1 의 사전 테이블을 그대로 사용했었음에도, 5.8 에서 같은 패턴을 가정하지 않고 "신규 도메인" 으로 접근.
- spec 작성 시 V1 init schema 의 line 460 이후 (지원/알림 섹션) 를 안 봄.

## 해결

1. **즉시 (Task 1 fix-up commit `2354ba3`):**
   - V3 migration 앞에 `DROP TABLE IF EXISTS application_history; DROP TABLE IF EXISTS application;` 추가
   - FK 참조 정정: `app_user(id)` / `job_posting(id)`
   - spec §2.3 + plan Task 1 Step 1 의 SQL 도 동일하게 정정 + 결정 근거 문서화
2. **근본 (프로세스 변경):**
   - 신규 도메인 작업 전 V1 init schema 의 `CREATE TABLE` 전체 grep 필수.
   - spec File Map 단계에서 "관련 V1 schema 영역" 항목 추가 (해당 도메인의 V1 테이블 유무 명시).

## 학습

- "지원 도메인 없음" 같은 가정은 사실 검증 후 spec 에 명시. brainstorming 의 첫 단계 "Explore project context" 가 wireframe + 코드 파일까지는 갔지만 V1 init schema 의 후반부 (line 400 이후) 는 안 본 것이 root cause.
- V1 init schema 가 monolithic 으로 v1 전체 도메인 (지원·알림 포함) 을 미리 깔아둔 패턴은 일반적이지 않음. 이 프로젝트의 특이점이므로 향후 §10+ 작업 시에도 동일하게 의심.
- spec self-review 의 "scope check" 단계에 "V1 schema 와의 정합성" 체크박스 추가 권장.

## 자소서 활용 후보

- 항목: PROBLEM_SOLVING
- 정량: 구현 1 task 후 plan 가정 오류 발견 → spec/plan 정정 + V3 migration repair 로 8 task 추가 영향 차단 (시간 절감)
- 직군 권장 구조: PRAR (Problem-Root-Action-Result)
