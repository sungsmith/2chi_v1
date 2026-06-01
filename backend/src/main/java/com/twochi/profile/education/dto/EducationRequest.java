package com.twochi.profile.education.dto;

import com.twochi.profile.education.domain.EducationLevel;
import com.twochi.profile.education.domain.EducationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EducationRequest(
    @NotNull EducationLevel level,
    @NotBlank @Size(max = 100) String school,
    @Size(max = 100) String major,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal gpa,
    BigDecimal gpaMax,
    @NotNull EducationStatus status
) {}
