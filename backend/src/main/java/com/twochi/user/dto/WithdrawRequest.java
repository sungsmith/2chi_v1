package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;

public record WithdrawRequest(
    @NotBlank String currentPassword
) {}
