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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 프로젝트 — 경력 내 또는 사이드 프로젝트.
 * V1 Flyway 스키마의 project 테이블 매핑.
 *
 * structure_type/structure_data 로 직군별 4단 구조 지원:
 * v1: PRAR (problem/root_cause/approach/result) 만 사용.
 * v2: UX_DRIVEN/OPS_RESULT/DESIGN_THINKING 확장 가능.
 */
@Entity
@Table(name = "project")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    public static final String STRUCTURE_PRAR = "PRAR";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 사이드 프로젝트는 NULL (V1 schema 의 nullable FK). */
    @Column(name = "career_history_id")
    private Long careerHistoryId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(length = 200)
    private String role;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tech_stack", nullable = false, columnDefinition = "text[]")
    private String[] techStack = new String[0];

    /** 'PRAR' 고정 (v1). v2 에서 UX_DRIVEN 등 확장 가능. */
    @Column(name = "structure_type", nullable = false, length = 30)
    private String structureType;

    /**
     * 구조별 4단 데이터. PRAR 의 경우 키: problem / root_cause / approach / result.
     * 모두 nullable 문자열 — 자동저장으로 점진 채우기 허용.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structure_data", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> structureData = new HashMap<>();

    /** 정량 성과 리스트. nullable (스키마상 NULL 허용). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics", columnDefinition = "jsonb")
    private List<Metric> metrics = new ArrayList<>();

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Project create(Long userId, Long careerHistoryId, String title,
                                 LocalDate periodStart, LocalDate periodEnd,
                                 int orderIndex, Instant now) {
        Project p = new Project();
        p.userId = userId;
        p.careerHistoryId = careerHistoryId;
        p.title = title;
        p.periodStart = periodStart;
        p.periodEnd = periodEnd;
        p.role = null;
        p.techStack = new String[0];
        p.structureType = STRUCTURE_PRAR;
        p.structureData = new HashMap<>();
        p.metrics = new ArrayList<>();
        p.orderIndex = orderIndex;
        p.createdAt = now;
        p.updatedAt = now;
        return p;
    }

    public void updateBasic(String title, LocalDate periodStart, LocalDate periodEnd, Instant now) {
        if (title != null) this.title = title;
        if (periodStart != null) this.periodStart = periodStart;
        this.updatedAt = now;
    }

    public void replacePeriodEnd(LocalDate periodEnd, Instant now) {
        this.periodEnd = periodEnd;
        this.updatedAt = now;
    }

    public void replaceRole(String role, Instant now) {
        this.role = role;
        this.updatedAt = now;
    }

    /**
     * PRAR 부분 업데이트. null 인자는 미변경. 비-null 키만 structureData 에 반영.
     */
    public void updatePrar(String problem, String rootCause, String approach, String result, Instant now) {
        if (this.structureData == null) this.structureData = new HashMap<>();
        if (problem != null)   this.structureData.put("problem", problem);
        if (rootCause != null) this.structureData.put("root_cause", rootCause);
        if (approach != null)  this.structureData.put("approach", approach);
        if (result != null)    this.structureData.put("result", result);
        this.updatedAt = now;
    }

    public void replaceTechStack(List<String> stack, Instant now) {
        this.techStack = stack == null ? new String[0] : stack.toArray(new String[0]);
        this.updatedAt = now;
    }

    public void replaceMetrics(List<Metric> metrics, Instant now) {
        this.metrics = metrics == null ? new ArrayList<>() : new ArrayList<>(metrics);
        this.updatedAt = now;
    }
}
