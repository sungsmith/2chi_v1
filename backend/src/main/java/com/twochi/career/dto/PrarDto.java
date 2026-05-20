package com.twochi.career.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_ABSENT)
public record PrarDto(String problem, String rootCause, String approach, String result) {}
