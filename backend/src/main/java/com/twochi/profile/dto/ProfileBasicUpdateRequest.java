package com.twochi.profile.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProfileBasicUpdateRequest(
    @Size(max = 50) String name,
    LocalDate birthDate,
    @Size(max = 20) String phone,
    @Size(max = 50) String region,
    String introduction
) {}
