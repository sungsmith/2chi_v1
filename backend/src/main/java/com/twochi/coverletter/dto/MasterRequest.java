package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster;
import jakarta.validation.constraints.*;

public record MasterRequest(
    @NotNull CoverLetterMaster.ItemType itemType,
    @Size(max = 200) String title,
    @NotBlank String masterAnswer,
    @Positive Integer charLimitHint,
    boolean isDefault
) {}
