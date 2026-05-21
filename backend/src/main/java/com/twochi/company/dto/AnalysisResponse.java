package com.twochi.company.dto;

import java.time.Instant;

public record AnalysisResponse(
    Long id,
    String company,
    String summaryJson,
    String[] sourceUrls,
    Instant generatedAt,
    String generatedBy,
    Long expiresInDays
) {}
