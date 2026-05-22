package com.twochi.application.controller;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.dto.ApplicationCreateRequest;
import com.twochi.application.dto.ApplicationPatchRequest;
import com.twochi.application.dto.ApplicationResponse;
import com.twochi.application.dto.ApplicationSummaryResponse;
import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;
import com.twochi.application.service.ApplicationService;
import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService service;

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody ApplicationCreateRequest req
    ) {
        Application app = service.create(principal.userId(), req.postingId());
        List<Event> events = service.findEvents(app.getId());
        long variantsCount = service.variantsCount(principal.userId(), app.getPostingId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApplicationResponse.of(app, events, variantsCount));
    }

    @GetMapping
    public ResponseEntity<List<ApplicationSummaryResponse>> list(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @RequestParam(required = false) Stage stage,
        @RequestParam(required = false) Result result
    ) {
        List<Application> apps = service.findAll(principal.userId(), stage, result);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        List<ApplicationSummaryResponse> summaries = apps.stream()
            .map(a -> {
                Event next = service.findNextEvent(a.getId(), today).orElse(null);
                long vc = service.variantsCount(principal.userId(), a.getPostingId());
                return ApplicationSummaryResponse.of(a, next, vc);
            })
            .toList();
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getOne(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        Application app = service.findOwned(principal.userId(), id);
        List<Event> events = service.findEvents(app.getId());
        long vc = service.variantsCount(principal.userId(), app.getPostingId());
        return ResponseEntity.ok(ApplicationResponse.of(app, events, vc));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApplicationResponse> patch(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody ApplicationPatchRequest req
    ) {
        Application app = service.patch(
            principal.userId(), id,
            req.currentStage(), req.currentResult(),
            req.memo(), req.company(), req.role()
        );
        List<Event> events = service.findEvents(app.getId());
        long vc = service.variantsCount(principal.userId(), app.getPostingId());
        return ResponseEntity.ok(ApplicationResponse.of(app, events, vc));
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
