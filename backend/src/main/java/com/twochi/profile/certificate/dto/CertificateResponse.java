package com.twochi.profile.certificate.dto;

import com.twochi.profile.certificate.domain.Certificate;

import java.time.LocalDate;

public record CertificateResponse(
    Long id,
    String name,
    String issuer,
    LocalDate acquiredAt,
    String score,
    int orderIndex
) {
    public static CertificateResponse from(Certificate c) {
        return new CertificateResponse(
            c.getId(),
            c.getName(),
            c.getIssuer(),
            c.getAcquiredAt(),
            c.getScore(),
            c.getOrderIndex()
        );
    }
}
