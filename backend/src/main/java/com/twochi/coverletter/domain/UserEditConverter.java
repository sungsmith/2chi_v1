package com.twochi.coverletter.domain;

import com.twochi.coverletter.service.MasterAnswerEncryptor;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** cover_letter_variant.user_edit AES-256. MasterAnswerEncryptor 재사용. */
@Component
@Converter(autoApply = false)
public class UserEditConverter implements AttributeConverter<String, String> {

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
