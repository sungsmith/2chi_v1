package com.twochi.profile.certificate.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.certificate.domain.Certificate;
import com.twochi.profile.certificate.dto.CertificateRequest;
import com.twochi.profile.certificate.dto.CertificateResponse;
import com.twochi.profile.certificate.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public ResponseEntity<Map<String, List<CertificateResponse>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<CertificateResponse> responses = certificateService.findAllByUserId(principal.userId())
            .stream().map(CertificateResponse::from).toList();
        return ResponseEntity.ok(Map.of("certificates", responses));
    }

    @PostMapping
    public ResponseEntity<CertificateResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody CertificateRequest req) {
        Certificate c = certificateService.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(CertificateResponse.from(c));
    }

    @PutMapping("/{certificateId}")
    public ResponseEntity<CertificateResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long certificateId,
            @Valid @RequestBody CertificateRequest req) {
        Certificate c = certificateService.update(principal.userId(), certificateId, req);
        return ResponseEntity.ok(CertificateResponse.from(c));
    }

    @DeleteMapping("/{certificateId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long certificateId) {
        certificateService.delete(principal.userId(), certificateId);
        return ResponseEntity.noContent().build();
    }
}
