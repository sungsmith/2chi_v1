package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster;

import java.time.Instant;

public record MasterResponse(
    Long id,
    CoverLetterMaster.ItemType itemType,
    String title,
    String masterAnswer,
    Integer charLimitHint,
    boolean isDefault,
    Instant createdAt,
    Instant updatedAt
) {
    public static MasterResponse from(CoverLetterMaster m) {
        return new MasterResponse(
            m.getId(), m.getItemType(), m.getTitle(),
            m.getMasterAnswer(), m.getCharLimitHint(), m.isDefault(),
            m.getCreatedAt(), m.getUpdatedAt()
        );
    }
}
