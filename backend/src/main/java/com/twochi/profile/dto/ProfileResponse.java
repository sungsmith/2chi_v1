package com.twochi.profile.dto;

import com.twochi.user.domain.Profile;
import com.twochi.user.domain.Target;
import com.twochi.user.domain.TargetJob;

import java.time.LocalDate;
import java.util.List;

public record ProfileResponse(
    String name,
    LocalDate birthDate,
    String phone,
    String region,
    String introduction,
    Target target,
    Integer careerYear,
    List<TargetJob> targetJobs,
    boolean onboardingCompleted
) {
    public static ProfileResponse from(Profile p) {
        return new ProfileResponse(
            p.getName(),
            p.getBirthDate(),
            p.getPhone(),
            p.getRegion(),
            p.getIntroduction(),
            p.getTarget(),
            (int) p.getCareerYear(),
            p.targetJobs(),
            p.isOnboardingCompleted()
        );
    }
}
