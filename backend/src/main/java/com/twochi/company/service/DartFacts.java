package com.twochi.company.service;

import java.util.List;

/** DART 공시 mock 데이터의 정형 표현. */
public record DartFacts(
    String businessArea,
    List<String> mainProducts,
    String revenue,
    Integer employees,
    String location,
    String sourceUrl
) {
    /** mock fixture 미매칭 시 generic fallback. */
    public static DartFacts unknown() {
        return new DartFacts(
            "(DART 공시 매칭 없음)",
            List.of(),
            null, null, null, null
        );
    }
}
