package com.twochi.user.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.dto.MeResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(new MeResponse(
            principal.userId(), principal.email(), principal.nickname(), principal.role()
        ));
    }
}
