package com.twochi.coverletter.dto;

/** 삭제된 마스터가 default 였을 때 자동 승계된 새 default 의 id. 없으면 null. */
public record DeleteResult(Long newDefaultId) {}
