package com.twochi.application.dto;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.domain.EventType;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventListItemResponse(
    Long id,
    EventType type,
    LocalDate eventDate,
    LocalTime eventTime,
    String memo,
    Long applicationId,
    String company,
    String role
) {
    public static EventListItemResponse of(Event e, Application a) {
        return new EventListItemResponse(
            e.getId(), e.getType(),
            e.getEventDate(), e.getEventTime(), e.getMemo(),
            a.getId(), a.getCompany(), a.getRole()
        );
    }
}
