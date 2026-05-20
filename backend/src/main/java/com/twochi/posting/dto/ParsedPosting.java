package com.twochi.posting.dto;

import java.time.LocalDate;

public record ParsedPosting(
    String company,
    String title,
    String jobRole,
    String requirements,
    String preferred,
    String mainTasks,
    LocalDate deadline,
    String sourceUrl
) {}
