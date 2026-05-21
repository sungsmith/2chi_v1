package com.twochi.posting.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.dto.JobPostingCreateRequest;
import com.twochi.posting.dto.JobPostingPatchRequest;
import com.twochi.posting.dto.JobPostingResponse;
import com.twochi.posting.service.JobPostingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService service;

    @GetMapping
    public ResponseEntity<List<JobPostingResponse>> getAll(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<JobPosting> all = service.findAll(principal.userId());
        return ResponseEntity.ok(all.stream().map(JobPostingResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobPostingResponse> getOne(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        JobPosting p = service.findOwned(principal.userId(), id);
        return ResponseEntity.ok(JobPostingResponse.from(p));
    }

    @PostMapping
    public ResponseEntity<JobPostingResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody JobPostingCreateRequest req
    ) {
        JobPosting p = service.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(JobPostingResponse.from(p));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<JobPostingResponse> patch(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @RequestBody JobPostingPatchRequest req
    ) {
        JobPosting p = service.patch(principal.userId(), id, req);
        return ResponseEntity.ok(JobPostingResponse.from(p));
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
