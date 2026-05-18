package com.twochi.common.exception;

import java.util.List;
import java.util.Map;

public record ErrorResponse(
    String code,
    String message,
    String traceId,
    Map<String, Object> metadata,
    List<FieldError> errors
) {
    public record FieldError(String field, String message) {}

    public static ErrorResponse of(ErrorCode code, String traceId) {
        return new ErrorResponse(code.name(), code.defaultMessage(), traceId, null, null);
    }

    public static ErrorResponse of(ErrorCode code, String message, String traceId) {
        return new ErrorResponse(code.name(), message, traceId, null, null);
    }

    public static ErrorResponse of(ErrorCode code, String message, String traceId, Map<String, Object> metadata) {
        return new ErrorResponse(code.name(), message, traceId, metadata, null);
    }

    public static ErrorResponse validation(String traceId, List<FieldError> fieldErrors) {
        return new ErrorResponse(
            ErrorCode.VALIDATION_FAILED.name(),
            ErrorCode.VALIDATION_FAILED.defaultMessage(),
            traceId,
            null,
            fieldErrors
        );
    }
}
