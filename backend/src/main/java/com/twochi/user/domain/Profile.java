package com.twochi.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Target target;

    @Column(name = "career_year", nullable = false)
    private short careerYear;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "target_jobs", nullable = false, columnDefinition = "text[]")
    private String[] targetJobsRaw;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public List<TargetJob> targetJobs() {
        return Arrays.stream(targetJobsRaw).map(TargetJob::valueOf).toList();
    }

    public static Profile create(Long userId, Target target, short careerYear, Set<TargetJob> jobs, Instant now) {
        Profile p = new Profile();
        p.userId = userId;
        p.target = target;
        p.careerYear = careerYear;
        p.targetJobsRaw = jobs.stream().map(Enum::name).toArray(String[]::new);
        p.onboardingCompleted = true;
        p.createdAt = now;
        p.updatedAt = now;
        return p;
    }

    public void updateFromOnboarding(Target target, short careerYear, Set<TargetJob> jobs, Instant now) {
        this.target = target;
        this.careerYear = careerYear;
        this.targetJobsRaw = jobs.stream().map(Enum::name).toArray(String[]::new);
        this.onboardingCompleted = true;
        this.updatedAt = now;
    }
}
