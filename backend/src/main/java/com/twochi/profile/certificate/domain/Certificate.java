package com.twochi.profile.certificate.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 자격증 — V1 Flyway 스키마의 certificate 테이블 매핑.
 */
@Entity
@Table(name = "certificate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String issuer;

    @Column(name = "acquired_at")
    private LocalDate acquiredAt;

    @Column(length = 50)
    private String score;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Certificate create(Long userId, String name, String issuer,
                                     LocalDate acquiredAt, String score,
                                     int orderIndex, Instant now) {
        Certificate c = new Certificate();
        c.userId = userId;
        c.name = name;
        c.issuer = issuer;
        c.acquiredAt = acquiredAt;
        c.score = score;
        c.orderIndex = orderIndex;
        c.createdAt = now;
        c.updatedAt = now;
        return c;
    }

    public void update(String name, String issuer, LocalDate acquiredAt, String score, Instant now) {
        this.name = name;
        this.issuer = issuer;
        this.acquiredAt = acquiredAt;
        this.score = score;
        this.updatedAt = now;
    }
}
