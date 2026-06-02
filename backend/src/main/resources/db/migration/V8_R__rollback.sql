-- V8 rollback (manual). Flyway 자동 실행 안 함. 사용 시: Flyway repair 후 이 스크립트 직접 실행.
-- 경고: 암호화된 기존 데이터가 존재하면 잘림 오류 발생. 데이터 삭제 후 적용할 것.
ALTER TABLE profile
    ALTER COLUMN name  TYPE VARCHAR(50),
    ALTER COLUMN phone TYPE VARCHAR(20);
