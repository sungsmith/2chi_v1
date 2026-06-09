package com.twochi.match.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/dashboard")
    public DashboardMatchResponse dashboard(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return matchService.computeDashboardMatch(principal.userId());
    }
}
