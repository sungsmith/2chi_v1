package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioFile;
import java.time.Instant;

public record PortfolioFileResponse(Long id, String filename, String contentType, long sizeBytes, Instant createdAt) {
    public static PortfolioFileResponse from(PortfolioFile f) {
        return new PortfolioFileResponse(f.getId(), f.getFilename(), f.getContentType(), f.getSizeBytes(), f.getCreatedAt());
    }
}
