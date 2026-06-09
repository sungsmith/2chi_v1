package com.twochi.activity.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "activity_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActivityType type;

    @Column(nullable = false, length = 20)
    private String icon;

    @Column(length = 10)
    private String tone; // ok | fail | warn | null

    @Column(nullable = false, length = 60)
    private String actor;

    @Column(length = 200)
    private String subject; // bold 부분 (회사·역할), nullable

    @Column(name = "from_label", length = 40)
    private String fromLabel;

    @Column(name = "to_label", length = 40)
    private String toLabel;

    @Column(nullable = false, length = 300)
    private String suffix; // 문장 꼬리

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    private ActivityLog(Long userId, ActivityType type, String icon, String tone,
                        String actor, String subject, String fromLabel, String toLabel,
                        String suffix, Instant occurredAt) {
        this.userId = userId;
        this.type = type;
        this.icon = icon;
        this.tone = tone;
        this.actor = actor;
        this.subject = subject;
        this.fromLabel = fromLabel;
        this.toLabel = toLabel;
        this.suffix = suffix;
        this.occurredAt = occurredAt;
    }

    public static ActivityLog of(Long userId, ActivityType type, String icon, String tone,
                                 String actor, String subject, String fromLabel, String toLabel,
                                 String suffix, Instant occurredAt) {
        return new ActivityLog(userId, type, icon, tone, actor, subject, fromLabel, toLabel, suffix, occurredAt);
    }
}
