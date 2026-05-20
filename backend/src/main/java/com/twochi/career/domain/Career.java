package com.twochi.career.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 경력 — 회사 단위.
 * V1 Flyway 스키마의 career_history 테이블 매핑.
 */
@Entity
@Table(name = "career_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String company;

    @Column(length = 100)
    private String position;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_current", nullable = false)
    private boolean isCurrent;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Career create(Long userId, String company, String position,
                                LocalDate startDate, LocalDate endDate, int orderIndex, Instant now) {
        Career c = new Career();
        c.userId = userId;
        c.company = company;
        c.position = position;
        c.startDate = startDate;
        c.endDate = endDate;
        c.isCurrent = (endDate == null);
        c.summary = null;
        c.orderIndex = orderIndex;
        c.createdAt = now;
        c.updatedAt = now;
        return c;
    }

    public void update(String company, String position, LocalDate startDate, LocalDate endDate, Instant now) {
        this.company = company;
        this.position = position;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isCurrent = (endDate == null);
        this.updatedAt = now;
    }
}
