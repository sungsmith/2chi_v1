package com.twochi.coverletter.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.coverletter.dto.*;
import com.twochi.coverletter.service.CoverLetterVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cover-letter-variants")
@RequiredArgsConstructor
public class CoverLetterVariantController {

    private final CoverLetterVariantService service;

    @GetMapping("/grouped")
    public ResponseEntity<List<VariantListGroupedResponse>> listGrouped(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(service.listGrouped(principal.userId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VariantResponse> get(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.get(principal.userId(), id));
    }

    @PostMapping
    public ResponseEntity<VariantResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody VariantCreateRequest req
    ) {
        VariantResponse res = service.createWithAiDraft(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<VariantResponse> patch(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody VariantPatchRequest req
    ) {
        return ResponseEntity.ok(service.patch(principal.userId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/validation")
    public ResponseEntity<ValidationResponse> validate(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.validate(principal.userId(), id));
    }
}
