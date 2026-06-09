package com.twochi.profile.portfolio.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "portfolio_link")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PortfolioLinkKind kind;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private PortfolioLink(Long userId, PortfolioLinkKind kind, String title, String url,
                         int orderIndex, Instant now) {
        this.userId = userId;
        this.kind = kind;
        this.title = title;
        this.url = url;
        this.orderIndex = orderIndex;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public static PortfolioLink create(Long userId, PortfolioLinkKind kind, String title,
                                       String url, int orderIndex, Instant now) {
        return new PortfolioLink(userId, kind, title, url, orderIndex, now);
    }

    public void update(PortfolioLinkKind kind, String title, String url, Instant now) {
        this.kind = kind;
        this.title = title;
        this.url = url;
        this.updatedAt = now;
    }
}
