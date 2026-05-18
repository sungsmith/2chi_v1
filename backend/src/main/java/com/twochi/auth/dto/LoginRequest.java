package com.twochi.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

    @NotBlank
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 255)
    String email,

    @NotBlank
    String password
) {}
