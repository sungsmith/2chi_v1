package com.twochi.profile.education.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * 학력 — V1 Flyway 스키마의 education 테이블 매핑.
 */
@Entity
@Table(name = "education")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EducationLevel level;

    @Column(nullable = false, length = 100)
    private String school;

    @Column(length = 100)
    private String major;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(precision = 3, scale = 2)
    private BigDecimal gpa;

    @Column(name = "gpa_max", precision = 3, scale = 2)
    private BigDecimal gpaMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EducationStatus status;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Education create(Long userId, EducationLevel level, String school, String major,
                                   LocalDate startDate, LocalDate endDate,
                                   BigDecimal gpa, BigDecimal gpaMax,
                                   EducationStatus status, int orderIndex, Instant now) {
        Education e = new Education();
        e.userId = userId;
        e.level = level;
        e.school = school;
        e.major = major;
        e.startDate = startDate;
        e.endDate = endDate;
        e.gpa = gpa;
        e.gpaMax = gpaMax;
        e.status = status;
        e.orderIndex = orderIndex;
        e.createdAt = now;
        e.updatedAt = now;
        return e;
    }

    public void update(EducationLevel level, String school, String major,
                       LocalDate startDate, LocalDate endDate,
                       BigDecimal gpa, BigDecimal gpaMax,
                       EducationStatus status, Instant now) {
        this.level = level;
        this.school = school;
        this.major = major;
        this.startDate = startDate;
        this.endDate = endDate;
        this.gpa = gpa;
        this.gpaMax = gpaMax;
        this.status = status;
        this.updatedAt = now;
    }
}
