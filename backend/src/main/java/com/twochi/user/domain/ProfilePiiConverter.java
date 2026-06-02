package com.twochi.user.domain;

import com.twochi.coverletter.service.MasterAnswerEncryptor;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * profile.name / profile.phone 컬럼 AES 암호화·복호화.
 * 기존 MasterAnswerEncryptor(AES-256 + 공유 키)를 재사용.
 * Hibernate 가 Bean 으로 인식하도록 @Component + autoApply=false (entity 에서 @Convert 명시).
 */
@Component
@Converter(autoApply = false)
public class ProfilePiiConverter implements AttributeConverter<String, String> {

    @Autowired
    private MasterAnswerEncryptor encryptor;

    @Override
    public String convertToDatabaseColumn(String plain) {
        return encryptor.encrypt(plain);
    }

    @Override
    public String convertToEntityAttribute(String encrypted) {
        return encryptor.decrypt(encrypted);
    }
}
