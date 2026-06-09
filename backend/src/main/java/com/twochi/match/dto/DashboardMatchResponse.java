package com.twochi.match.dto;

import java.util.List;

public record DashboardMatchResponse(int percent, int postingCount, List<Gap> gaps) {
    public record Gap(String keyword, int hitCount) {}
}
