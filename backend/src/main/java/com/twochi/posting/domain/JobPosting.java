package com.twochi.posting.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 채용공고. V1 Flyway schema 의 job_posting 테이블 매핑.
 * source: URL = 사용자가 URL 파싱으로 등록 / MANUAL = 직접 작성 / SARAMIN = v2 (사람인 OpenAPI)
 */
@Entity
@Table(name = "job_posting")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobPosting {

    public enum Source { URL, MANUAL, SARAMIN }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Source source;

    @Column(nullable = false, length = 200)
    private String company;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(name = "job_role", length = 100)
    private String jobRole;

    @Column(columnDefinition = "text")
    private String requirements;

    @Column(columnDefinition = "text")
    private String preferred;

    @Column(name = "main_tasks", columnDefinition = "text")
    private String mainTasks;

    private LocalDate deadline;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] keywords = new String[0];

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static JobPosting create(
        Long userId, Source source, String company, String title,
        String jobRole, String requirements, String preferred, String mainTasks,
        LocalDate deadline, String sourceUrl, String[] keywords, Instant now
    ) {
        JobPosting p = new JobPosting();
        p.userId = userId;
        p.source = source;
        p.company = company;
        p.title = title;
        p.jobRole = jobRole;
        p.requirements = requirements;
        p.preferred = preferred;
        p.mainTasks = mainTasks;
        p.deadline = deadline;
        p.sourceUrl = sourceUrl;
        p.keywords = keywords != null ? keywords : new String[0];
        p.createdAt = now;
        p.updatedAt = now;
        return p;
    }

    public void update(
        String company, String title, String jobRole, String requirements,
        String preferred, String mainTasks, LocalDate deadline, String[] keywords, Instant now
    ) {
        this.company = company;
        this.title = title;
        this.jobRole = jobRole;
        this.requirements = requirements;
        this.preferred = preferred;
        this.mainTasks = mainTasks;
        this.deadline = deadline;
        if (keywords != null) this.keywords = keywords;
        this.updatedAt = now;
    }
}
