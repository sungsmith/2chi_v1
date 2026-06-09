package com.twochi.activity.domain;

public enum ActivityType {
    APPLICATION_CREATED(ActivityCategory.APPLICATION),
    STAGE_CHANGED(ActivityCategory.STAGE),
    COVER_LETTER_SAVED(ActivityCategory.COVER_LETTER),
    AI_DRAFT_GENERATED(ActivityCategory.COVER_LETTER),
    NOTIFICATION(ActivityCategory.NOTIFICATION);

    private final ActivityCategory category;

    ActivityType(ActivityCategory category) { this.category = category; }

    public ActivityCategory category() { return category; }
}
