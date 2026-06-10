package com.twochi.profile.portfolio.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.dto.DownloadUrlResponse;
import com.twochi.profile.portfolio.dto.PortfolioFileResponse;
import com.twochi.profile.portfolio.service.PortfolioFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/portfolio-files")
@RequiredArgsConstructor
public class PortfolioFileController {

    private final PortfolioFileService service;

    @PostMapping
    public ResponseEntity<PortfolioFileResponse> upload(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam("file") MultipartFile file) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PortfolioFileResponse.from(service.upload(principal.userId(), file)));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<PortfolioFileResponse>>> list(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        List<PortfolioFileResponse> files = service.list(principal.userId())
            .stream().map(PortfolioFileResponse::from).toList();
        return ResponseEntity.ok(Map.of("files", files));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<DownloadUrlResponse> download(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.ok(new DownloadUrlResponse(service.downloadUrl(principal.userId(), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
