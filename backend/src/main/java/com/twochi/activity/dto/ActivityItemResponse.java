package com.twochi.activity.dto;

import com.twochi.activity.domain.ActivityLog;
import com.twochi.activity.domain.ActivityType;
import java.time.Instant;

public record ActivityItemResponse(
    Long id, ActivityType type, String icon, String tone, String actor,
    String subject, String fromLabel, String toLabel, String suffix, Instant occurredAt
) {
    public static ActivityItemResponse from(ActivityLog a) {
        return new ActivityItemResponse(
            a.getId(), a.getType(), a.getIcon(), a.getTone(), a.getActor(),
            a.getSubject(), a.getFromLabel(), a.getToLabel(), a.getSuffix(), a.getOccurredAt());
    }
}
