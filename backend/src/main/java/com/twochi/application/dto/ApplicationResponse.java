package com.twochi.application.dto;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;

import java.time.Instant;
import java.util.List;

public record ApplicationResponse(
    Long id,
    Long postingId,
    String company,
    String role,
    Stage currentStage,
    Result currentResult,
    String memo,
    Long variantsCount,
    List<EventResponse> events,
    Instant createdAt,
    Instant updatedAt
) {
    public static ApplicationResponse of(Application a, List<Event> events, long variantsCount) {
        return new ApplicationResponse(
            a.getId(), a.getPostingId(), a.getCompany(), a.getRole(),
            a.getCurrentStage(), a.getCurrentResult(), a.getMemo(),
            variantsCount,
            events.stream().map(EventResponse::from).toList(),
            a.getCreatedAt(), a.getUpdatedAt()
        );
    }
}
