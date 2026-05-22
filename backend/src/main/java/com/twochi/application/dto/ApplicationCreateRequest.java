package com.twochi.application.dto;

import jakarta.validation.constraints.NotNull;

public record ApplicationCreateRequest(@NotNull Long postingId) {}
