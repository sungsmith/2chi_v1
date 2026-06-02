package com.twochi.profile.education.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.education.domain.Education;
import com.twochi.profile.education.dto.EducationRequest;
import com.twochi.profile.education.dto.EducationResponse;
import com.twochi.profile.education.service.EducationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/educations")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @GetMapping
    public ResponseEntity<Map<String, List<EducationResponse>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<EducationResponse> responses = educationService.findAllByUserId(principal.userId())
            .stream().map(EducationResponse::from).toList();
        return ResponseEntity.ok(Map.of("educations", responses));
    }

    @PostMapping
    public ResponseEntity<EducationResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody EducationRequest req) {
        Education e = educationService.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(EducationResponse.from(e));
    }

    @PutMapping("/{educationId}")
    public ResponseEntity<EducationResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long educationId,
            @Valid @RequestBody EducationRequest req) {
        Education e = educationService.update(principal.userId(), educationId, req);
        return ResponseEntity.ok(EducationResponse.from(e));
    }

    @DeleteMapping("/{educationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long educationId) {
        educationService.delete(principal.userId(), educationId);
        return ResponseEntity.noContent().build();
    }
}
