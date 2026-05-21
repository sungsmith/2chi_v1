package com.twochi.company.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * 기업분석. V1 Flyway schema 의 company_analysis 매핑.
 * (user_id, company) UNIQUE — 재분석은 in-place 갱신 (V2 migration 으로 unique index 추가).
 * summary_json: { overview, talent_profile[], action_points[] } 형태의 JSON 문자열.
 */
@Entity
@Table(name = "company_analysis")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String company;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "summary_json", nullable = false, columnDefinition = "jsonb")
    private String summaryJson;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "news_keywords", nullable = false, columnDefinition = "text[]")
    private String[] newsKeywords = new String[0];

    @Column(name = "dart_corp_code", length = 20)
    private String dartCorpCode;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "source_urls", nullable = false, columnDefinition = "text[]")
    private String[] sourceUrls = new String[0];

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "generated_by", nullable = false, length = 50)
    private String generatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static CompanyAnalysis create(
        Long userId, String company, String summaryJson,
        String[] sourceUrls, String generatedBy, Instant now
    ) {
        CompanyAnalysis a = new CompanyAnalysis();
        a.userId = userId;
        a.company = company;
        a.summaryJson = summaryJson;
        a.sourceUrls = sourceUrls != null ? sourceUrls : new String[0];
        a.newsKeywords = new String[0];   // v1 에서는 항상 빈 배열 (뉴스 v2)
        a.dartCorpCode = null;            // v1 mock fixture 사용으로 null
        a.generatedAt = now;
        a.generatedBy = generatedBy;
        a.createdAt = now;
        return a;
    }

    /** in-place 갱신 (재분석). createdAt 은 그대로 유지, generatedAt 만 갱신. */
    public void regenerate(String summaryJson, String[] sourceUrls, String generatedBy, Instant now) {
        this.summaryJson = summaryJson;
        if (sourceUrls != null) this.sourceUrls = sourceUrls;
        this.generatedBy = generatedBy;
        this.generatedAt = now;
    }
}
