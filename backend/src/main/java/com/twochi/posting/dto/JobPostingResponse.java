package com.twochi.posting.dto;

import com.twochi.posting.domain.JobPosting;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record JobPostingResponse(
    Long id,
    JobPosting.Source source,
    String company,
    String title,
    String jobRole,
    String requirements,
    String preferred,
    String mainTasks,
    LocalDate deadline,
    String sourceUrl,
    List<String> keywords,
    Instant createdAt,
    Instant updatedAt
) {
    public static JobPostingResponse from(JobPosting p) {
        return new JobPostingResponse(
            p.getId(), p.getSource(), p.getCompany(), p.getTitle(),
            p.getJobRole(), p.getRequirements(), p.getPreferred(), p.getMainTasks(),
            p.getDeadline(), p.getSourceUrl(),
            p.getKeywords() != null ? List.of(p.getKeywords()) : List.of(),
            p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
