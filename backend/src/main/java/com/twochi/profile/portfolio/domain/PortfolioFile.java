package com.twochi.profile.portfolio.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "portfolio_file")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    private PortfolioFile(Long userId, String filename, String contentType, long sizeBytes,
                         String objectKey, Instant now) {
        this.userId = userId;
        this.filename = filename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.objectKey = objectKey;
        this.createdAt = now;
    }

    public static PortfolioFile create(Long userId, String filename, String contentType,
                                       long sizeBytes, String objectKey, Instant now) {
        return new PortfolioFile(userId, filename, contentType, sizeBytes, objectKey, now);
    }
}
