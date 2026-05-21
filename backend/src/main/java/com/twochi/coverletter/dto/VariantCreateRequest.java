package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import jakarta.validation.constraints.*;

public record VariantCreateRequest(
    @NotNull Long postingId,
    Long analysisId,
    @NotNull ItemType itemType,
    @NotBlank @Size(max = 500) String question,
    @NotNull @Positive Integer charLimit,
    String userRequest
) {}
