package com.twochi.career.dto;

import java.time.LocalDate;
import java.util.List;

public record CareerResponse(
    Long id,
    String company,
    String position,
    LocalDate startDate,
    LocalDate endDate,
    boolean isCurrent,
    String summary,
    int orderIndex,
    List<ProjectResponse> projects
) {}
