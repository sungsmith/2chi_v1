package com.twochi.profile.experience.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.experience.domain.Experience;
import com.twochi.profile.experience.dto.ExperienceRequest;
import com.twochi.profile.experience.dto.ExperienceResponse;
import com.twochi.profile.experience.service.ExperienceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public ResponseEntity<Map<String, List<ExperienceResponse>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<ExperienceResponse> responses = experienceService.findAllByUserId(principal.userId())
            .stream().map(ExperienceResponse::from).toList();
        return ResponseEntity.ok(Map.of("experiences", responses));
    }

    @PostMapping
    public ResponseEntity<ExperienceResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ExperienceRequest req) {
        Experience e = experienceService.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ExperienceResponse.from(e));
    }

    @PutMapping("/{experienceId}")
    public ResponseEntity<ExperienceResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceRequest req) {
        Experience e = experienceService.update(principal.userId(), experienceId, req);
        return ResponseEntity.ok(ExperienceResponse.from(e));
    }

    @DeleteMapping("/{experienceId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long experienceId) {
        experienceService.delete(principal.userId(), experienceId);
        return ResponseEntity.noContent().build();
    }
}
