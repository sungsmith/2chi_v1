package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.coverletter.domain.CoverLetterVariant;
import com.twochi.coverletter.domain.CoverLetterVariant.Status;

import java.time.Instant;

public record VariantSummaryResponse(
    Long id,
    ItemType itemType,
    String question,
    Integer charLimit,
    Integer charCount,
    Status status,
    Instant updatedAt
) {
    public static VariantSummaryResponse from(CoverLetterVariant v) {
        int count = v.getUserEdit() != null ? v.getUserEdit().length() : 0;
        return new VariantSummaryResponse(
            v.getId(), v.getItemType(), v.getQuestion(), v.getCharLimit(),
            count, v.getStatus(), v.getUpdatedAt()
        );
    }
}
