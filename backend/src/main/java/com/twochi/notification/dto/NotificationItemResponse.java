package com.twochi.notification.dto;

import java.time.Instant;

public record NotificationItemResponse(
    Long id,
    String type,      // NotificationType enum name (e.g. "POSTING_DEADLINE_D3")
    String title,
    String body,
    Instant createdAt,
    Instant readAt
) {}
