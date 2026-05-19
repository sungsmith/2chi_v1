package com.twochi.onboarding.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.onboarding.dto.OnboardingRequest;
import com.twochi.onboarding.dto.OnboardingResponse;
import com.twochi.onboarding.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping
    public ResponseEntity<OnboardingResponse> submit(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody OnboardingRequest req
    ) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        OnboardingResponse res = onboardingService.upsert(principal.userId(), req);
        return ResponseEntity.ok(res);
    }
}
