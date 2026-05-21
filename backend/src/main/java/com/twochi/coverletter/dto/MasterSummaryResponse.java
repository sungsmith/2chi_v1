package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster;

import java.time.Instant;

public record MasterSummaryResponse(
    Long id,
    CoverLetterMaster.ItemType itemType,
    String title,
    int charCount,
    boolean isDefault,
    Instant updatedAt
) {
    public static MasterSummaryResponse from(CoverLetterMaster m) {
        return new MasterSummaryResponse(
            m.getId(), m.getItemType(), m.getTitle(),
            m.getMasterAnswer() != null ? m.getMasterAnswer().length() : 0,
            m.isDefault(), m.getUpdatedAt()
        );
    }
}
