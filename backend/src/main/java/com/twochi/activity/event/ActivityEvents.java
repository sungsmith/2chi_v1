package com.twochi.activity.event;

import java.time.Instant;

/** 활동 로그용 raw 도메인 이벤트 묶음. 발행 시점에 모든 표시 데이터를 담는다. */
public final class ActivityEvents {
    private ActivityEvents() {}

    public record ApplicationCreated(
        Long userId, String company, String role, Instant occurredAt) {}

    public record StageChanged(
        Long userId, String company, String role,
        String fromStageLabel, String toLabel,
        boolean failed, boolean passed, boolean withdrawn, Instant occurredAt) {}

    public record CoverLetterSaved(
        Long userId, String company, String itemTypeLabel,
        boolean completed, Instant occurredAt) {}

    public record AiDraftGenerated(
        Long userId, String company, String itemTypeLabel, Instant occurredAt) {}

    public record NotificationCreated(
        Long userId, String title, Instant occurredAt) {}
}
