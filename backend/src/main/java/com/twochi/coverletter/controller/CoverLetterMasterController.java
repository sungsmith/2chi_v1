package com.twochi.coverletter.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.coverletter.domain.CoverLetterMaster;
import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.coverletter.dto.*;
import com.twochi.coverletter.service.CoverLetterMasterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cover-letters/masters")
@RequiredArgsConstructor
public class CoverLetterMasterController {

    private final CoverLetterMasterService service;

    @GetMapping("/summary")
    public ResponseEntity<List<MasterSummaryResponse>> summary(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<CoverLetterMaster> all = service.findAll(principal.userId());
        return ResponseEntity.ok(all.stream().map(MasterSummaryResponse::from).toList());
    }

    @GetMapping
    public ResponseEntity<List<MasterResponse>> listByType(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @RequestParam ItemType itemType
    ) {
        List<CoverLetterMaster> rows = service.findByItemType(principal.userId(), itemType);
        return ResponseEntity.ok(rows.stream().map(MasterResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MasterResponse> get(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(MasterResponse.from(service.findOwned(principal.userId(), id)));
    }

    @PostMapping
    public ResponseEntity<MasterResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody MasterRequest req
    ) {
        CoverLetterMaster m = service.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(MasterResponse.from(m));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MasterResponse> patch(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody MasterPatchRequest req
    ) {
        CoverLetterMaster m = service.patch(principal.userId(), id, req);
        return ResponseEntity.ok(MasterResponse.from(m));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<MasterResponse> copy(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        CoverLetterMaster m = service.copy(principal.userId(), id);
        return ResponseEntity.status(HttpStatus.CREATED).body(MasterResponse.from(m));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<DeleteResult> delete(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.delete(principal.userId(), id));
    }
}
