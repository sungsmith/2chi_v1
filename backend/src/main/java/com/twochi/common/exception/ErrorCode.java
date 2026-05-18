package com.twochi.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값이 유효하지 않습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용중인 닉네임입니다."),
    AGE_NOT_CONFIRMED(HttpStatus.UNPROCESSABLE_ENTITY, "만 14세 이상 확인이 필요합니다."),
    REQUIRED_CONSENT_MISSING(HttpStatus.UNPROCESSABLE_ENTITY, "필수 동의 항목을 확인해주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() { return status; }
    public String defaultMessage() { return defaultMessage; }
}
