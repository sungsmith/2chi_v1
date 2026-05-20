package com.twochi.career.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.career.domain.Project;
import com.twochi.career.dto.ProjectPatchRequest;
import com.twochi.career.dto.ProjectRequest;
import com.twochi.career.dto.ProjectResponse;
import com.twochi.career.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/careers/{careerId}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@AuthenticationPrincipal AuthenticatedUser principal,
                                                  @PathVariable Long careerId,
                                                  @Valid @RequestBody ProjectRequest req) {
        Project p = projectService.create(principal.userId(), careerId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(p));
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> patch(@AuthenticationPrincipal AuthenticatedUser principal,
                                                 @PathVariable Long careerId,
                                                 @PathVariable Long projectId,
                                                 @Valid @RequestBody ProjectPatchRequest req) {
        Project p = projectService.patch(principal.userId(), careerId, projectId, req);
        return ResponseEntity.ok(ProjectResponse.from(p));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser principal,
                                       @PathVariable Long careerId,
                                       @PathVariable Long projectId) {
        projectService.delete(principal.userId(), careerId, projectId);
        return ResponseEntity.noContent().build();
    }
}
