package com.twochi.user.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.dto.NotiSettingsResponse;
import com.twochi.user.dto.UpdateNotiSettingsRequest;
import com.twochi.user.service.noti.NotiSettingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/noti-settings")
public class NotiSettingsController {

    private final NotiSettingService notiSettingService;

    public NotiSettingsController(NotiSettingService notiSettingService) {
        this.notiSettingService = notiSettingService;
    }

    @GetMapping
    public ResponseEntity<NotiSettingsResponse> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(notiSettingService.list(principal.userId()));
    }

    @PatchMapping
    public ResponseEntity<NotiSettingsResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateNotiSettingsRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(notiSettingService.update(principal.userId(), req.overrides()));
    }
}
