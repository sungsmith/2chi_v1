package com.twochi.profile.education.dto;

import com.twochi.profile.education.domain.Education;
import com.twochi.profile.education.domain.EducationLevel;
import com.twochi.profile.education.domain.EducationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EducationResponse(
    Long id,
    EducationLevel level,
    String school,
    String major,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal gpa,
    BigDecimal gpaMax,
    EducationStatus status,
    int orderIndex
) {
    public static EducationResponse from(Education e) {
        return new EducationResponse(
            e.getId(),
            e.getLevel(),
            e.getSchool(),
            e.getMajor(),
            e.getStartDate(),
            e.getEndDate(),
            e.getGpa(),
            e.getGpaMax(),
            e.getStatus(),
            e.getOrderIndex()
        );
    }
}
