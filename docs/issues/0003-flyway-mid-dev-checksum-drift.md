# [ISSUE-0003] 개발 중 마이그레이션 파일 다회 수정으로 인한 Flyway checksum drift

- 발생일: 2026-05-22 (5.8 작업 중·후 2 차례 발생)
- 환경: local
- 심각도: medium (반복 발생, 작업 차단)
- 관련 역량: BE-DB-006 (DB 마이그레이션), BE-OPS-001 (Docker / 컨테이너)

## 증상

5.8 작업 중 V3 migration 파일 (`V3__applications_events.sql`) 을 단일 dev 사이클 안에서 3 차례 수정:

1. 원본 (Task 1 implementer 작성, 잘못된 FK)
2. `DROP TABLE` + FK 정정 (fix-up 1)
3. `TIMESTAMP` → `TIMESTAMPTZ` + `updatable=false` (code review fix)

각 수정 사이에 통합 테스트를 돌려 Flyway 가 매번 V3 를 docker postgres 에 적용했고, 마지막 단계에서 두 차례 에러:

```
FlywayValidateException: Migration checksum mismatch for migration version 3
Applied to database : 30152774
Resolved locally    : 1474063648
```

또한 PR #14 머지 후 사용자가 메인 워크트리에서 BE 부팅 시도하자 `BUILD FAILED` (non-zero exit) — 동일 원인 (DB 에는 중간 버전 checksum 남아있고, 머지된 develop 코드는 최종 V3).

## 원인

- Flyway 의 default 정책: `validate-on-migrate=true` + `ignore-missing-migrations=false`. 한 번 적용된 마이그레이션 파일의 SQL 텍스트는 immutable.
- 그러나 dev 사이클 동안 파일을 자유롭게 수정하는 것이 자연스러움 (특히 새 마이그레이션을 막 작성 중일 때).
- docker postgres 가 모든 brain 사이에 공유되므로, 한 brain 에서 적용된 V3 의 checksum 이 다른 시점에 코드 V3 와 mismatch.
- ISSUE-0001 의 "적용된 V{n} 수정 금지" 룰은 main 머지 후 시점을 기준으로 명문화됐지만, 개발 중 사이클의 fast-iteration 케이스는 따로 가이드 없었음.

## 해결

1. **매 발생 시 즉시 (수동 repair):**
   ```bash
   docker exec twochi-postgres psql -U twochi -d twochi -c \
     "DELETE FROM flyway_schema_history WHERE version = '3'; \
      DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS applications;"
   ```
   이후 BE 재기동 → Flyway 가 V3 를 fresh 적용.
2. **근본 (룰 추가):**
   - 개발 중 신규 마이그레이션 파일을 N 번 수정한 경우, 다음 부팅 전 위 repair SQL 을 자동/수동으로 실행하는 것을 표준 절차로 명시.
   - 향후 검토: `gradle flywayClean` task 등록 또는 dev profile 에서 `clean-on-validation-error=true` 설정 — production 에는 절대 금지.
   - PR 머지 전 브랜치의 마이그레이션 파일이 head 와 다르면 reviewer 가 "DB repair 필요" 코멘트 자동 추가하는 PR template 항목.

## 학습

- ISSUE-0001 의 룰 "적용된 V{n} 절대 수정 금지" 가 main 머지 후 기준이라는 점을 명확히. 개발 중에는 fast-iteration 이 일반적이고 매번 repair 가 자연스러운 비용임.
- 통합 테스트가 Testcontainers 가 아닌 공유 docker postgres 를 사용하는 환경에서는 이 문제가 자주 발생. 향후 v2 에서 Testcontainers 도입 고려.
- 사용자가 본인 환경에서 BE 띄울 때도 같은 문제 노출됨. 머지 직후 BE 안 켜질 가능성을 PR Test plan 에 명시할 것.

## 자소서 활용 후보

- 항목: PROBLEM_SOLVING
- 정량: 단일 dev 사이클 안에서 동일 마이그레이션 N=3 회 수정 시 매번 repair 절차 정착 → 추가 부팅 실패 0건
- 직군 권장 구조: Ops-Result
