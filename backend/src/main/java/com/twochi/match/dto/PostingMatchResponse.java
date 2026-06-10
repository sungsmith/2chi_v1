package com.twochi.match.dto;

import java.util.List;

public record PostingMatchResponse(List<PostingMatch> matches) {
    public record PostingMatch(Long postingId, int percent) {}
}
