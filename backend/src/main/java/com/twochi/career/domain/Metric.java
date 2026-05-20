package com.twochi.career.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 정량 성과. 두 가지 variant 동시 표현:
 * - compare: { k, before, after }     ex. TPS 500 → 2,000
 * - delta:   { k, delta, dir }        ex. 월간 운영비 -₩2,000,000 (down)
 *
 * before/after/delta/dir 는 nullable — 사용된 필드 조합으로 variant 판별.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Metric(
    String k,
    String before,
    String after,
    String delta,
    String dir
) {}
