package com.twochi.profile.portfolio.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.dto.PortfolioLinkRequest;
import com.twochi.profile.portfolio.dto.PortfolioLinkResponse;
import com.twochi.profile.portfolio.service.PortfolioLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/portfolio-links")
@RequiredArgsConstructor
public class PortfolioLinkController {

    private final PortfolioLinkService service;

    @GetMapping
    public ResponseEntity<Map<String, List<PortfolioLinkResponse>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<PortfolioLinkResponse> links = service.findAllByUserId(principal.userId())
            .stream().map(PortfolioLinkResponse::from).toList();
        return ResponseEntity.ok(Map.of("links", links));
    }

    @PostMapping
    public ResponseEntity<PortfolioLinkResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody PortfolioLinkRequest req) {
        PortfolioLink p = service.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(PortfolioLinkResponse.from(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioLinkResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id,
            @Valid @RequestBody PortfolioLinkRequest req) {
        PortfolioLink p = service.update(principal.userId(), id, req);
        return ResponseEntity.ok(PortfolioLinkResponse.from(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
