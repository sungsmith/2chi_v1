package com.twochi.career.dto;

import com.twochi.career.domain.Metric;
import com.twochi.career.domain.Project;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public record ProjectResponse(
    Long id,
    Long careerHistoryId,
    String title,
    LocalDate periodStart,
    LocalDate periodEnd,
    String role,
    List<String> techStack,
    String structureType,
    PrarDto prar,
    List<Metric> metrics,
    int orderIndex
) {
    public static ProjectResponse from(Project p) {
        Map<String, String> sd = p.getStructureData();
        PrarDto prar = new PrarDto(
            sd != null ? sd.get("problem") : null,
            sd != null ? sd.get("root_cause") : null,
            sd != null ? sd.get("approach") : null,
            sd != null ? sd.get("result") : null
        );
        return new ProjectResponse(
            p.getId(),
            p.getCareerHistoryId(),
            p.getTitle(),
            p.getPeriodStart(),
            p.getPeriodEnd(),
            p.getRole(),
            p.getTechStack() == null ? List.of() : Arrays.asList(p.getTechStack()),
            p.getStructureType(),
            prar,
            p.getMetrics() == null ? List.of() : List.copyOf(p.getMetrics()),
            p.getOrderIndex()
        );
    }
}
