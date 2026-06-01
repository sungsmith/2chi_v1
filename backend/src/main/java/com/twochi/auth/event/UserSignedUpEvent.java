package com.twochi.auth.event;

/** 회원가입 완료(커밋 예정) 도메인 이벤트. notification 모듈이 AFTER_COMMIT 으로 구독. */
public record UserSignedUpEvent(Long userId) {}
