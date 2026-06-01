package com.twochi.profile.experience.dto;

import com.twochi.profile.experience.domain.ExperienceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ExperienceRequest(
    @NotNull ExperienceType type,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 200) String organization,
    LocalDate startDate,
    LocalDate endDate,
    @Size(max = 200) String role,
    String summary
) {}
