package com.twochi.onboarding.dto;

import com.twochi.user.domain.Target;
import com.twochi.user.domain.TargetJob;

import java.util.List;

public record OnboardingResponse(
    Long userId,
    Target target,
    Integer careerYear,
    List<TargetJob> targetJobs,
    boolean onboardingCompleted
) {}
