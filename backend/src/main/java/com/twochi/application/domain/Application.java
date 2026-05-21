package com.twochi.application.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "posting_id", nullable = false)
    private Long postingId;

    @Column(nullable = false, length = 120)
    private String company;

    @Column(nullable = false, length = 120)
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", nullable = false, length = 30)
    private Stage currentStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_result", nullable = false, length = 20)
    private Result currentResult;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Application create(
        Long userId, Long postingId, String company, String role, Instant now
    ) {
        Application a = new Application();
        a.userId = userId;
        a.postingId = postingId;
        a.company = company;
        a.role = role;
        a.currentStage = Stage.DOC_SUBMITTED;
        a.currentResult = Result.IN_PROGRESS;
        a.createdAt = now;
        a.updatedAt = now;
        return a;
    }

    public void update(
        Stage stage, Result result, String memo, String company, String role, Instant now
    ) {
        if (stage != null) this.currentStage = stage;
        if (result != null) this.currentResult = result;
        if (memo != null) this.memo = memo;
        if (company != null) this.company = company;
        if (role != null) this.role = role;
        this.updatedAt = now;
    }
}
