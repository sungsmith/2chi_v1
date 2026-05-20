package com.twochi.career.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects", indexes = {
    @Index(name = "idx_projects_career_order", columnList = "career_id, display_order DESC")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "career_id", nullable = false)
    private Long careerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "contribution_percent")
    private Integer contributionPercent;

    // PRAR — 모두 nullable, 자동저장으로 점진 채우기 허용
    @Column(name = "prar_problem", length = 1000)
    private String prarProblem;

    @Column(name = "prar_root_cause", length = 1000)
    private String prarRootCause;

    @Column(name = "prar_approach", length = 1000)
    private String prarApproach;

    @Column(name = "prar_result", length = 1000)
    private String prarResult;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tech_tags", nullable = false, columnDefinition = "jsonb")
    private List<TechTag> techTags = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics", nullable = false, columnDefinition = "jsonb")
    private List<Metric> metrics = new ArrayList<>();

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Project create(Long careerId, String title, LocalDate startDate, LocalDate endDate,
                                 Integer contributionPercent, int displayOrder, Instant now) {
        Project p = new Project();
        p.careerId = careerId;
        p.title = title;
        p.startDate = startDate;
        p.endDate = endDate;
        p.contributionPercent = contributionPercent;
        p.techTags = new ArrayList<>();
        p.metrics = new ArrayList<>();
        p.displayOrder = displayOrder;
        p.createdAt = now;
        p.updatedAt = now;
        return p;
    }

    public void updateBasic(String title, LocalDate startDate, LocalDate endDate,
                            Integer contributionPercent, Instant now) {
        if (title != null) this.title = title;
        if (startDate != null) this.startDate = startDate;
        // endDate / contributionPercent 의 null 은 호출자가 별도 메서드(replaceEndDate/replaceContributionPercent)로 처리
        this.updatedAt = now;
    }

    public void updatePrar(String problem, String rootCause, String approach, String result, Instant now) {
        if (problem != null) this.prarProblem = problem;
        if (rootCause != null) this.prarRootCause = rootCause;
        if (approach != null) this.prarApproach = approach;
        if (result != null) this.prarResult = result;
        this.updatedAt = now;
    }

    public void replaceTechTags(List<TechTag> tags, Instant now) {
        this.techTags = new ArrayList<>(tags);
        this.updatedAt = now;
    }

    public void replaceMetrics(List<Metric> metrics, Instant now) {
        this.metrics = new ArrayList<>(metrics);
        this.updatedAt = now;
    }

    public void replaceEndDate(LocalDate endDate, Instant now) {
        this.endDate = endDate;
        this.updatedAt = now;
    }

    public void replaceContributionPercent(Integer pct, Instant now) {
        this.contributionPercent = pct;
        this.updatedAt = now;
    }
}
