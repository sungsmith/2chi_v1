package com.twochi.career.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.career.domain.Career;
import com.twochi.career.dto.CareerRequest;
import com.twochi.career.dto.CareerResponse;
import com.twochi.career.dto.ProjectResponse;
import com.twochi.career.service.CareerService;
import com.twochi.career.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/careers")
@RequiredArgsConstructor
public class CareerController {

    private final CareerService careerService;
    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<Map<String, List<CareerResponse>>> getAll(@AuthenticationPrincipal AuthenticatedUser principal) {
        List<Career> careers = careerService.findAllByUserId(principal.userId());
        List<CareerResponse> responses = careers.stream().map(c -> {
            List<ProjectResponse> projects = projectService.findAllByCareerId(c.getId())
                .stream().map(ProjectResponse::from).toList();
            return new CareerResponse(
                c.getId(), c.getCompany(), c.getPosition(),
                c.getStartDate(), c.getEndDate(), c.isCurrent(),
                c.getSummary(), c.getOrderIndex(), projects
            );
        }).toList();
        return ResponseEntity.ok(Map.of("careers", responses));
    }

    @PostMapping
    public ResponseEntity<CareerResponse> create(@AuthenticationPrincipal AuthenticatedUser principal,
                                                 @Valid @RequestBody CareerRequest req) {
        Career c = careerService.create(principal.userId(), req);
        CareerResponse body = new CareerResponse(
            c.getId(), c.getCompany(), c.getPosition(),
            c.getStartDate(), c.getEndDate(), c.isCurrent(),
            c.getSummary(), c.getOrderIndex(), List.of()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/{careerId}")
    public ResponseEntity<CareerResponse> update(@AuthenticationPrincipal AuthenticatedUser principal,
                                                 @PathVariable Long careerId,
                                                 @Valid @RequestBody CareerRequest req) {
        Career c = careerService.update(principal.userId(), careerId, req);
        List<ProjectResponse> projects = projectService.findAllByCareerId(c.getId())
            .stream().map(ProjectResponse::from).toList();
        CareerResponse body = new CareerResponse(
            c.getId(), c.getCompany(), c.getPosition(),
            c.getStartDate(), c.getEndDate(), c.isCurrent(),
            c.getSummary(), c.getOrderIndex(), projects
        );
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/{careerId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser principal,
                                       @PathVariable Long careerId) {
        careerService.delete(principal.userId(), careerId);
        return ResponseEntity.noContent().build();
    }
}
