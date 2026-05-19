package com.twochi.onboarding.dto;

import com.twochi.user.domain.Target;
import com.twochi.user.domain.TargetJob;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record OnboardingRequest(

    @NotNull
    Target target,

    @NotNull
    @Min(value = 0, message = "경력 연차는 0 이상이어야 합니다.")
    @Max(value = 7, message = "경력 연차는 7 이하여야 합니다.")
    Integer careerYear,

    @NotEmpty(message = "희망 직무를 1개 이상 선택해주세요.")
    Set<TargetJob> targetJobs
) {}
