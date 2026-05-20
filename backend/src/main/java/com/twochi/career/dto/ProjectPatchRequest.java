package com.twochi.career.dto;

import com.twochi.career.domain.Metric;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * PATCH 의미: null 필드는 미변경. 비-null 필드만 변경.
 * techStack/metrics 배열은 통째 교체 (null 이면 미변경).
 */
public record ProjectPatchRequest(
    @Size(max = 200) String title,
    LocalDate periodStart,
    LocalDate periodEnd,
    @Size(max = 200) String role,
    PrarDto prar,
    List<String> techStack,
    List<Metric> metrics
) {}
