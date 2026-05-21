package com.twochi.coverletter.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Component;

/**
 * cover_letter_master.master_answer 의 애플리케이션 레이어 AES-256 암호화.
 * Spring Security Crypto 의 Encryptors.delux() 사용 (AES/CBC/PKCS5Padding + random IV).
 *
 * 키 분실 시 기존 암호문 복호화 불가 — 운영 환경에서 키 백업 필수.
 */
@Component
public class MasterAnswerEncryptor {

    private final String key;
    private final String salt;
    private TextEncryptor encryptor;

    public MasterAnswerEncryptor(
        @Value("${master-answer.encryption-key:}") String key,
        @Value("${master-answer.encryption-salt:}") String salt
    ) {
        this.key = key;
        this.salt = salt;
    }

    @PostConstruct
    void init() {
        if (key == null || key.isBlank() || salt == null || salt.isBlank()) {
            throw new IllegalStateException(
                "MASTER_ANSWER_ENCRYPTION_KEY/SALT 환경변수가 설정되지 않았어요. " +
                ".env 또는 환경변수에 두 값을 추가하세요 (openssl rand -hex 로 생성)."
            );
        }
        this.encryptor = Encryptors.delux(key, salt);
    }

    public String encrypt(String plain) {
        if (plain == null) return null;
        return encryptor.encrypt(plain);
    }

    public String decrypt(String encrypted) {
        if (encrypted == null) return null;
        return encryptor.decrypt(encrypted);
    }
}
