-- V8: profile.name / profile.phone 컬럼을 AES 암호문 저장에 맞게 확장
-- AES-256/CBC + hex 인코딩 암호문은 평문보다 훨씬 길다. 한글 이름 50자(@Size max=50,
-- UTF-8 150바이트)의 암호문은 ~350자라 VARCHAR(255) 로도 넘침 → TEXT 로 확장(무제한).
ALTER TABLE profile
    ALTER COLUMN name  TYPE TEXT,
    ALTER COLUMN phone TYPE TEXT;
