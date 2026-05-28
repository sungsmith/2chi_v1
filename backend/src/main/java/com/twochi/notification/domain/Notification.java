package com.twochi.notification.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(columnDefinition = "text")
    private String error;

    @Column(name = "dedup_key", length = 120)
    private String dedupKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    private Notification(Long userId, NotificationChannel channel, NotificationType type,
                         String title, String body, Instant createdAt, Instant sentAt, String dedupKey) {
        this.userId = userId;
        this.channel = channel;
        this.type = type;
        this.title = title;
        this.body = body;
        this.createdAt = createdAt;
        this.sentAt = sentAt;
        this.dedupKey = dedupKey;
    }

    /**
     * INBOX 채널 알림 (PR B1+). sentAt = createdAt = now (즉시 inbox 표시).
     * EMAIL / WEB_PUSH 채널 알림은 v2 발송 워커가 별도 팩토리로 생성.
     */
    public static Notification forInbox(Long userId, NotificationType type, String title, String body, Instant now) {
        return new Notification(userId, NotificationChannel.INBOX, type, title, body, now, now, null);
    }

    public static Notification forInboxDeduped(Long userId, NotificationType type, String title,
                                               String body, Instant now, String dedupKey) {
        return new Notification(userId, NotificationChannel.INBOX, type, title, body, now, now, dedupKey);
    }

    public void markRead(Instant now) {
        if (this.readAt == null) {
            this.readAt = now;
        }
    }
}
