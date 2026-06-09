package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioLinkKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PortfolioLinkRequest(
    @NotNull PortfolioLinkKind kind,
    @NotBlank @Size(max = 100) String title,
    @NotBlank @Size(max = 500)
    @Pattern(regexp = "^https?://.+", message = "http(s):// 로 시작하는 URL 이어야 해요.") String url
) {}
