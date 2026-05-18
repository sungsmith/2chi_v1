package com.twochi.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        String traceId = UUID.randomUUID().toString();
        return ResponseEntity
            .status(ex.code().status())
            .body(ErrorResponse.of(ex.code(), ex.getMessage(), traceId));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String traceId = UUID.randomUUID().toString();
        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
            .toList();
        return ResponseEntity
            .status(ErrorCode.VALIDATION_FAILED.status())
            .body(ErrorResponse.validation(traceId, fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnknown(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unhandled exception. traceId={}", traceId, ex);
        return ResponseEntity
            .status(ErrorCode.INTERNAL_ERROR.status())
            .body(ErrorResponse.of(ErrorCode.INTERNAL_ERROR, traceId));
    }
}
