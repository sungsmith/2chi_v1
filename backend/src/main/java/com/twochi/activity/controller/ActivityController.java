package com.twochi.activity.controller;

import com.twochi.activity.domain.ActivityCategory;
import com.twochi.activity.dto.ActivityListResponse;
import com.twochi.activity.service.ActivityLogQueryService;
import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityLogQueryService service;

    public ActivityController(ActivityLogQueryService service) {
        this.service = service;
    }

    @GetMapping
    public ActivityListResponse list(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @RequestParam(required = false) ActivityCategory category,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int size
    ) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return service.list(principal.userId(), category, page, Math.min(size, 100));
    }
}
