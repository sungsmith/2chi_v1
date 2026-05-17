# [ISSUE-0001] Flyway 체크섬 불일치로 앱 시작 실패

- 발생일: 2026-05-20
- 환경: local
- 심각도: 작업 차단 (high)
- 관련 역량: BE-DB-006 (DB 마이그레이션)

## 증상
앱 기동 시 `FlywayValidateException: Migration checksum mismatch for migration version 1`.

## 원인
적용된 V1__init_schema.sql을 직접 수정함. Flyway는 체크섬으로 적용된 마이그레이션의 무결성을 검증.

## 해결
1. 수정 내용을 새 V2__alter_xxx.sql로 분리.
2. 로컬 DB 초기화 후 V1 + V2 순차 적용.
3. 팀 룰: 적용된 V{n}은 절대 수정 금지. PR 리뷰 체크리스트에 추가.

## 학습
- Flyway는 schema_history 테이블에 체크섬 보관. 한 번 적용되면 immutable이 원칙.
- "정 수정해야 하면 flyway repair" — 위험하므로 최후 수단.

## 자소서 활용 후보
- 항목: PROBLEM_SOLVING
- 정량: 팀 룰 정착 후 마이그레이션 충돌 N건/분기 → 0건