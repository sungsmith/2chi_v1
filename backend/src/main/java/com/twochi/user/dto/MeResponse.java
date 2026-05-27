package com.twochi.user.dto;

import java.time.Instant;

public record MeResponse(
    Long userId,
    String email,
    String nickname,
    String role,
    boolean onboardingCompleted,
    Instant joinedAt,
    Instant passwordChangedAt,
    String plan
) {}
