package com.twochi.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(

    @NotBlank
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 255)
    String email,

    @NotBlank
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    @Pattern(
        regexp = "^(?=(?:.*[A-Za-z].*[0-9])|(?:.*[A-Za-z].*[^A-Za-z0-9])|(?:.*[0-9].*[^A-Za-z0-9])).{8,}$",
        message = "영문, 숫자, 특수문자 중 2종 이상을 조합해주세요."
    )
    String password,

    @NotBlank
    @Pattern(
        regexp = "^[가-힣A-Za-z0-9]{2,20}$",
        message = "닉네임은 2~20자의 한글/영문/숫자만 가능합니다."
    )
    String nickname,

    @NotNull
    Boolean ageConfirmed,

    @NotNull
    @Valid
    Consents consents

) {
    public record Consents(
        @NotNull Boolean terms,
        @NotNull Boolean privacy,
        @NotNull Boolean marketing
    ) {}
}
