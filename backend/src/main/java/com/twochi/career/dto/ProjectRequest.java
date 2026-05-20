package com.twochi.career.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank @Size(max = 200) String title,
    LocalDate periodStart,
    LocalDate periodEnd,
    @Size(max = 200) String role
) {}
