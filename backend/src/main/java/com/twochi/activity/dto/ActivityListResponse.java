package com.twochi.activity.dto;

import java.util.List;
import java.util.Map;

public record ActivityListResponse(
    List<ActivityItemResponse> activities,
    long totalCount,
    int page,
    int size,
    boolean hasNext,
    Map<String, Long> counts
) {}
