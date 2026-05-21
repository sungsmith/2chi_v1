package com.twochi.coverletter.domain;

import com.twochi.coverletter.service.MasterAnswerEncryptor;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * cover_letter_master.master_answer 컬럼 자동 암호화·복호화.
 * Hibernate 가 Bean 으로 인식하도록 @Component + autoApply=false (entity 에서 @Convert 명시).
 */
@Component
@Converter(autoApply = false)
public class MasterAnswerConverter implements AttributeConverter<String, String> {

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
