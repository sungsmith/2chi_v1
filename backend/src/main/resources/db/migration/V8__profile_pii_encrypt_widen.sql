-- V8: profile.name / profile.phone 컬럼을 AES 암호문 저장에 맞게 확장
-- AES-256/CBC + base64 인코딩된 암호문은 평문보다 훨씬 길어 VARCHAR(50)/(20) 에 넘침.
-- VARCHAR(255) 로 확장하여 암호문을 안전하게 저장.
ALTER TABLE profile
    ALTER COLUMN name  TYPE VARCHAR(255),
    ALTER COLUMN phone TYPE VARCHAR(255);
