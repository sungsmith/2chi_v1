package com.twochi.application.dto;

import com.twochi.application.domain.EventType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventCreateRequest(
    @NotNull EventType type,
    @NotNull LocalDate eventDate,
    LocalTime eventTime,
    String memo
) {}
