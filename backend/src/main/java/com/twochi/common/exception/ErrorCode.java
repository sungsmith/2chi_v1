package com.twochi.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값이 유효하지 않습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용중인 닉네임입니다."),
    AGE_NOT_CONFIRMED(HttpStatus.UNPROCESSABLE_ENTITY, "만 14세 이상 확인이 필요합니다."),
    REQUIRED_CONSENT_MISSING(HttpStatus.UNPROCESSABLE_ENTITY, "필수 동의 항목을 확인해주세요."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    ACCOUNT_LOCKED(HttpStatus.LOCKED, "계정이 잠겼습니다. 잠시 후 다시 시도해주세요."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "세션이 만료되었습니다. 다시 로그인해주세요."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),
    CAREER_NOT_FOUND(HttpStatus.NOT_FOUND, "경력 정보를 찾을 수 없습니다."),
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다."),
    POSTING_NOT_FOUND(HttpStatus.NOT_FOUND, "채용공고를 찾을 수 없어요."),
    UNSUPPORTED_PARSE_SITE(HttpStatus.UNPROCESSABLE_ENTITY, "이 사이트는 자동 파싱을 지원하지 않아요. 직접 작성으로 입력해주세요."),
    PARSE_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "공고 정보를 가져오지 못했어요. 직접 작성해주세요."),
    MASTER_NOT_FOUND(HttpStatus.NOT_FOUND, "마스터 자소서를 찾을 수 없어요."),
    VARIANT_NOT_FOUND(HttpStatus.NOT_FOUND, "자소서 변형본을 찾을 수 없어요."),
    AI_DRAFT_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "AI 초안 생성에 실패했어요. 잠시 후 다시 시도해주세요."),
    ANALYSIS_NOT_FOUND(HttpStatus.NOT_FOUND, "기업분석을 찾을 수 없어요."),
    ANALYSIS_GENERATION_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "기업분석 생성에 실패했어요. 잠시 후 다시 시도해주세요."),
    APPLICATION_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 지원한 공고입니다."),
    APPLICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "지원을 찾을 수 없어요."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "일정을 찾을 수 없어요."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않아요."),
    PASSWORD_UNCHANGED(HttpStatus.BAD_REQUEST, "현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요."),
    USER_WITHDRAWN(HttpStatus.GONE, "탈퇴된 계정입니다."),
    USER_WITHDRAWN_GRACE(HttpStatus.GONE, "탈퇴된 계정입니다. 30일 유예 기간 내에 복구 가능해요."),
    ALREADY_WITHDRAWN(HttpStatus.CONFLICT, "이미 탈퇴 처리됐어요."),
    SETTING_LOCKED(HttpStatus.BAD_REQUEST, "보안 알림은 변경할 수 없어요."),
    UNKNOWN_SETTING(HttpStatus.BAD_REQUEST, "알 수 없는 알림 설정이에요.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() { return status; }
    public String defaultMessage() { return defaultMessage; }
}
