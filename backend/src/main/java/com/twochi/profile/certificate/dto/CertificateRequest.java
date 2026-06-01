package com.twochi.profile.certificate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CertificateRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 100) String issuer,
    LocalDate acquiredAt,
    @Size(max = 50) String score
) {}
