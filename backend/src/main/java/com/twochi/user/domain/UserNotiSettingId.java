package com.twochi.user.domain;

import java.io.Serializable;
import java.util.Objects;

public class UserNotiSettingId implements Serializable {

    private Long userId;
    private String settingId;

    public UserNotiSettingId() {}

    public UserNotiSettingId(Long userId, String settingId) {
        this.userId = userId;
        this.settingId = settingId;
    }

    public Long getUserId() { return userId; }
    public String getSettingId() { return settingId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserNotiSettingId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(settingId, other.settingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, settingId);
    }
}
