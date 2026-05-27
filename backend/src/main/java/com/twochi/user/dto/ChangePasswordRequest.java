package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(

    @NotBlank String currentPassword,

    // v1 클로즈드 베타: SignupRequest 와 동일하게 NotBlank 만. 운영 출시 시
    // SignupRequest 의 @Size/@Pattern 활성화 시 여기도 동일 규칙 적용 (signup 과 lock-step).
    @NotBlank String newPassword

) {}
