package com.twochi.coverletter;

import com.twochi.coverletter.service.MasterAnswerEncryptor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class MasterAnswerEncryptorTest {

    @Autowired
    MasterAnswerEncryptor encryptor;

    @Test
    void encrypt_then_decrypt_returns_original_text() {
        String plain = "저는 백엔드 개발자로서 성능과 안정성에 집중해왔습니다.";
        String encrypted = encryptor.encrypt(plain);
        assertThat(encrypted).isNotNull().isNotEqualTo(plain);
        String decrypted = encryptor.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(plain);
    }

    @Test
    void encrypt_same_plaintext_produces_different_ciphertext_each_time() {
        // Encryptors.delux 는 random IV 라 매번 다른 ciphertext
        String plain = "동일 평문";
        String c1 = encryptor.encrypt(plain);
        String c2 = encryptor.encrypt(plain);
        assertThat(c1).isNotEqualTo(c2);
        assertThat(encryptor.decrypt(c1)).isEqualTo(plain);
        assertThat(encryptor.decrypt(c2)).isEqualTo(plain);
    }

    @Test
    void null_input_returns_null() {
        assertThat(encryptor.encrypt(null)).isNull();
        assertThat(encryptor.decrypt(null)).isNull();
    }
}
