package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterVariant.Status;

public record VariantPatchRequest(
    String userEdit,
    String userRequest,
    Status status
) {}
