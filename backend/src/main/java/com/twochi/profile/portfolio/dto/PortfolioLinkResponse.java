package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.domain.PortfolioLinkKind;

public record PortfolioLinkResponse(
    Long id,
    PortfolioLinkKind kind,
    String title,
    String url,
    int orderIndex
) {
    public static PortfolioLinkResponse from(PortfolioLink p) {
        return new PortfolioLinkResponse(p.getId(), p.getKind(), p.getTitle(), p.getUrl(), p.getOrderIndex());
    }
}
