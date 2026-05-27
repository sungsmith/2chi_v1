package com.twochi.notification.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.notification.dto.NotificationListResponse;
import com.twochi.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<NotificationListResponse> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.ok(service.list(principal.userId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.markAllRead(principal.userId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.deleteAll(principal.userId());
        return ResponseEntity.noContent().build();
    }
}
