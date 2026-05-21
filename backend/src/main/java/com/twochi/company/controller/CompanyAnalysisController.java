package com.twochi.company.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.company.dto.*;
import com.twochi.company.service.CompanyAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/company-analyses")
@RequiredArgsConstructor
public class CompanyAnalysisController {

    private final CompanyAnalysisService service;

    @GetMapping
    public ResponseEntity<List<AnalysisSummaryResponse>> list(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(service.list(principal.userId()));
    }

    @GetMapping("/by-company")
    public ResponseEntity<ByCompanyResponse> byCompany(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @RequestParam String company
    ) {
        return ResponseEntity.ok(service.findByCompany(principal.userId(), company));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResponse> get(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.get(principal.userId(), id));
    }

    @PostMapping
    public ResponseEntity<AnalysisResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody AnalysisCreateRequest req
    ) {
        var result = service.createOrReplace(principal.userId(), req);
        return ResponseEntity
            .status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
            .body(result.response());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
