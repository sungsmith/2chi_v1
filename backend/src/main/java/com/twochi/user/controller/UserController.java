package com.twochi.user.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.dto.ChangePasswordRequest;
import com.twochi.user.dto.MeResponse;
import com.twochi.user.dto.UpdateNicknameRequest;
import com.twochi.user.service.PasswordChangeService;
import com.twochi.user.service.UserProfileUpdateService;
import com.twochi.user.service.UserQueryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserQueryService userQueryService;
    private final UserProfileUpdateService userProfileUpdateService;
    private final PasswordChangeService passwordChangeService;

    public UserController(UserQueryService userQueryService,
                          UserProfileUpdateService userProfileUpdateService,
                          PasswordChangeService passwordChangeService) {
        this.userQueryService = userQueryService;
        this.userProfileUpdateService = userProfileUpdateService;
        this.passwordChangeService = passwordChangeService;
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(userQueryService.buildMe(
            principal.userId(), principal.email(), principal.nickname(), principal.role()
        ));
    }

    @PatchMapping("/me")
    public ResponseEntity<MeResponse> updateNickname(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateNicknameRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        User updated = userProfileUpdateService.updateNickname(principal.userId(), req.nickname());
        return ResponseEntity.ok(userQueryService.buildMe(
            updated.getId(), updated.getEmail(), updated.getNickname(), updated.getRole()
        ));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        passwordChangeService.change(principal.userId(), req.currentPassword(), req.newPassword());
        return ResponseEntity.noContent().build();
    }
}
