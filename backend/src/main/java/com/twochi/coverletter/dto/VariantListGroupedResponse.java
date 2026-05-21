package com.twochi.coverletter.dto;

import java.util.List;

public record VariantListGroupedResponse(
    PostingRef posting,
    List<VariantSummaryResponse> variants
) {
    public record PostingRef(Long id, String company, String title) {}
}
