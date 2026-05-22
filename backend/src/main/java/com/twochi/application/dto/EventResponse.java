package com.twochi.application.dto;

import com.twochi.application.domain.Event;
import com.twochi.application.domain.EventType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventResponse(
    Long id,
    Long applicationId,
    EventType type,
    LocalDate eventDate,
    LocalTime eventTime,
    String memo,
    Instant createdAt,
    Instant updatedAt
) {
    public static EventResponse from(Event e) {
        return new EventResponse(
            e.getId(), e.getApplicationId(), e.getType(),
            e.getEventDate(), e.getEventTime(), e.getMemo(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
