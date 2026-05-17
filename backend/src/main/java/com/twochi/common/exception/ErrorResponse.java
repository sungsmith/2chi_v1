package com.twochi.common.exception;

import java.util.List;

public record ErrorResponse(
    String code,
    String message,
    String traceId,
    List<FieldError> errors
) {
    public record FieldError(String field, String message) {}

    public static ErrorResponse of(ErrorCode code, String traceId) {
        return new ErrorResponse(code.name(), code.defaultMessage(), traceId, null);
    }

    public static ErrorResponse of(ErrorCode code, String message, String traceId) {
        return new ErrorResponse(code.name(), message, traceId, null);
    }

    public static ErrorResponse validation(String traceId, List<FieldError> fieldErrors) {
        return new ErrorResponse(
            ErrorCode.VALIDATION_FAILED.name(),
            ErrorCode.VALIDATION_FAILED.defaultMessage(),
            traceId,
            fieldErrors
        );
    }
}
