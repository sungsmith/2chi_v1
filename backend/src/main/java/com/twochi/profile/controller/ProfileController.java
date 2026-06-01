package com.twochi.profile.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.dto.ProfileBasicUpdateRequest;
import com.twochi.profile.dto.ProfileResponse;
import com.twochi.profile.service.ProfileBasicInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileBasicInfoService profileBasicInfoService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(profileBasicInfoService.getProfile(principal.userId()));
    }

    @PatchMapping
    public ResponseEntity<ProfileResponse> updateBasicInfo(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ProfileBasicUpdateRequest req) {
        return ResponseEntity.ok(profileBasicInfoService.updateBasicInfo(principal.userId(), req));
    }
}
