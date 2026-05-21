package com.twochi.company.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public record AnalysisCreateRequest(
    @NotBlank @Size(max = 200) String company,
    @NotNull @Size(max = 5) List<@Size(max = 1000) @Pattern(regexp = "^https?://.*") String> urls
) {}
