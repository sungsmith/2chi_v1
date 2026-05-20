package com.twochi.posting.dto;

import com.twochi.posting.domain.JobPosting;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record JobPostingCreateRequest(
    @NotNull JobPosting.Source source,
    @NotBlank String company,
    @NotBlank String title,
    String jobRole,
    String requirements,
    String preferred,
    String mainTasks,
    LocalDate deadline,
    String sourceUrl
) {}
