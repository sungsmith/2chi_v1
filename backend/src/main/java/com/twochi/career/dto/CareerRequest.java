package com.twochi.career.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CareerRequest(
    @NotBlank @Size(max = 200) String company,
    @Size(max = 100) String position,
    @NotNull LocalDate startDate,
    LocalDate endDate
) {}
