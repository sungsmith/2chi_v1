package com.twochi.coverletter.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MasterPatchRequest(
    @Size(max = 200) String title,
    String masterAnswer,
    @Positive Integer charLimitHint,
    Boolean isDefault   // Boolean (nullable) — null 이면 변경 없음, true/false 명시
) {}
