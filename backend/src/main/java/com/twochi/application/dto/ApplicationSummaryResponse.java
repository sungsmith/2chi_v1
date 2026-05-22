package com.twochi.application.dto;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;

import java.time.Instant;

public record ApplicationSummaryResponse(
    Long id,
    Long postingId,
    String company,
    String role,
    Stage currentStage,
    Result currentResult,
    Long variantsCount,
    EventResponse nextEvent,
    Instant updatedAt
) {
    public static ApplicationSummaryResponse of(Application a, Event nextEvent, long variantsCount) {
        return new ApplicationSummaryResponse(
            a.getId(), a.getPostingId(), a.getCompany(), a.getRole(),
            a.getCurrentStage(), a.getCurrentResult(),
            variantsCount,
            nextEvent != null ? EventResponse.from(nextEvent) : null,
            a.getUpdatedAt()
        );
    }
}
