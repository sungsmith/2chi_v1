package com.twochi.common.exception;

import java.util.Map;

public class BusinessException extends RuntimeException {

    private final ErrorCode code;
    private final Map<String, Object> metadata;

    public BusinessException(ErrorCode code) {
        this(code, code.defaultMessage(), Map.of());
    }

    public BusinessException(ErrorCode code, String message) {
        this(code, message, Map.of());
    }

    public BusinessException(ErrorCode code, Map<String, Object> metadata) {
        this(code, code.defaultMessage(), metadata);
    }

    public BusinessException(ErrorCode code, String message, Map<String, Object> metadata) {
        super(message);
        this.code = code;
        this.metadata = metadata == null ? Map.of() : metadata;
    }

    public ErrorCode code() { return code; }
    public Map<String, Object> metadata() { return metadata; }
}
