package com.twochi.coverletter.dto;

import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.coverletter.domain.CoverLetterVariant;
import com.twochi.coverletter.domain.CoverLetterVariant.Status;

import java.time.Instant;

public record VariantResponse(
    Long id,
    Long postingId,
    String postingCompany,
    String postingTitle,
    Long analysisId,
    ItemType itemType,
    String question,
    Integer charLimit,
    String aiDraft,
    String userEdit,
    String userRequest,
    String validationJson,
    Status status,
    String aiModel,
    Integer aiTokensUsed,
    Instant createdAt,
    Instant updatedAt
) {
    public static VariantResponse from(CoverLetterVariant v, String company, String title) {
        return new VariantResponse(
            v.getId(), v.getPostingId(), company, title,
            v.getAnalysisId(), v.getItemType(), v.getQuestion(),
            v.getCharLimit(), v.getAiDraft(), v.getUserEdit(),
            v.getUserRequest(), v.getValidationJson(), v.getStatus(),
            v.getAiModel(), v.getAiTokensUsed(),
            v.getCreatedAt(), v.getUpdatedAt()
        );
    }
}
