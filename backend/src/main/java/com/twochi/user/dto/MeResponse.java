package com.twochi.user.dto;

public record MeResponse(
    Long userId,
    String email,
    String nickname,
    String role,
    boolean onboardingCompleted
) {}
