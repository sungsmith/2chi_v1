package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateNicknameRequest(

    @NotBlank
    @Pattern(
        regexp = "^[가-힣A-Za-z0-9_-]{2,20}$",
        message = "닉네임은 2~20자의 한글/영문/숫자 및 -, _ 만 가능합니다."
    )
    String nickname

) {}
