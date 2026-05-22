package com.twochi.application.dto;

import com.twochi.application.domain.EventType;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventPatchRequest(
    EventType type,
    LocalDate eventDate,
    LocalTime eventTime,
    String memo
) {}
