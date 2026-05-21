package com.twochi.company.dto;

import java.time.Instant;

public record AnalysisSummaryResponse(
    Long id,
    String company,
    Instant generatedAt,
    Long expiresInDays
) {}
