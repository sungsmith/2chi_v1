package com.twochi.profile.experience.dto;

import com.twochi.profile.experience.domain.Experience;
import com.twochi.profile.experience.domain.ExperienceType;

import java.time.LocalDate;

public record ExperienceResponse(
    Long id,
    ExperienceType type,
    String name,
    String organization,
    LocalDate startDate,
    LocalDate endDate,
    String role,
    String summary,
    int orderIndex
) {
    public static ExperienceResponse from(Experience e) {
        return new ExperienceResponse(
            e.getId(),
            e.getType(),
            e.getName(),
            e.getOrganization(),
            e.getStartDate(),
            e.getEndDate(),
            e.getRole(),
            e.getSummary(),
            e.getOrderIndex()
        );
    }
}
