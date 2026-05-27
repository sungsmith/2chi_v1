package com.twochi.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_noti_setting")
@IdClass(UserNotiSettingId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserNotiSetting {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "setting_id", length = 40)
    private String settingId;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private UserNotiSetting(Long userId, String settingId, boolean enabled, Instant now) {
        this.userId = userId;
        this.settingId = settingId;
        this.enabled = enabled;
        this.updatedAt = now;
    }

    public static UserNotiSetting of(Long userId, String settingId, boolean enabled, Instant now) {
        return new UserNotiSetting(userId, settingId, enabled, now);
    }

    public void updateEnabled(boolean enabled, Instant now) {
        this.enabled = enabled;
        this.updatedAt = now;
    }
}
