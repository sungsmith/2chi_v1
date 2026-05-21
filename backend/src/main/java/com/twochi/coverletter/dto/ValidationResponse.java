package com.twochi.coverletter.dto;

import java.util.List;

public record ValidationResponse(
    Integer charCount,
    Boolean charLimitOk,
    List<String> matchedKeywords,
    Integer matchCount,
    Boolean matchOk
) {}
