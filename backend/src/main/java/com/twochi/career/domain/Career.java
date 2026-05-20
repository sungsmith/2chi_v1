package com.twochi.career.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "careers", indexes = {
    @Index(name = "idx_careers_user_order", columnList = "user_id, display_order DESC")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false, length = 100)
    private String position;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Career create(Long userId, String companyName, String position,
                                LocalDate startDate, LocalDate endDate, int displayOrder, Instant now) {
        Career c = new Career();
        c.userId = userId;
        c.companyName = companyName;
        c.position = position;
        c.startDate = startDate;
        c.endDate = endDate;
        c.displayOrder = displayOrder;
        c.createdAt = now;
        c.updatedAt = now;
        return c;
    }

    public void update(String companyName, String position, LocalDate startDate, LocalDate endDate, Instant now) {
        this.companyName = companyName;
        this.position = position;
        this.startDate = startDate;
        this.endDate = endDate;
        this.updatedAt = now;
    }
}
