package com.twochi.profile.experience.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 경험·대외활동 — V1 Flyway 스키마의 experience 테이블 매핑.
 */
@Entity
@Table(name = "experience")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExperienceType type;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String organization;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 200)
    private String role;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Experience create(Long userId, ExperienceType type, String name, String organization,
                                    LocalDate startDate, LocalDate endDate,
                                    String role, String summary,
                                    int orderIndex, Instant now) {
        Experience e = new Experience();
        e.userId = userId;
        e.type = type;
        e.name = name;
        e.organization = organization;
        e.startDate = startDate;
        e.endDate = endDate;
        e.role = role;
        e.summary = summary;
        e.orderIndex = orderIndex;
        e.createdAt = now;
        e.updatedAt = now;
        return e;
    }

    public void update(ExperienceType type, String name, String organization,
                       LocalDate startDate, LocalDate endDate,
                       String role, String summary, Instant now) {
        this.type = type;
        this.name = name;
        this.organization = organization;
        this.startDate = startDate;
        this.endDate = endDate;
        this.role = role;
        this.summary = summary;
        this.updatedAt = now;
    }
}
