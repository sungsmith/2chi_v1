package com.twochi.application.dto;

import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;

public record ApplicationPatchRequest(
    Stage currentStage,
    Result currentResult,
    String memo,
    String company,
    String role
) {}
