package com.twochi.user.dto;

public record NotiSettingItem(
    String id,
    String category,
    String label,
    String description,
    boolean enabled,
    boolean locked
) {}
