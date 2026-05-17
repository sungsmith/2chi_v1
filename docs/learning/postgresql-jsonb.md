# PostgreSQL JSONB 인덱싱

- 학습일: 2026-05-22
- 계기: project.structure_data 검색 성능
- 역량: BE-DB-002 (쿼리 최적화)

## 핵심
- JSONB는 GIN 인덱스로 키 검색 가속 가능
- `CREATE INDEX ... USING GIN (col jsonb_path_ops)` — 부분 매치만 필요하면 path_ops로 인덱스 크기↓
- `@>` 연산자가 인덱스 활용. `->>` 추출 후 비교는 인덱스 미활용

## 본 프로젝트 적용
project.structure_data에서 PRAR의 problem 키워드로 검색하는 쿼리에 GIN 인덱스 도입 검토.

## 함정
- JSONB 통째 인덱스는 디스크 부담. 자주 쓰는 키만 expression index가 효율적일 수 있음.

## 참고
- https://www.postgresql.org/docs/current/datatype-json.html