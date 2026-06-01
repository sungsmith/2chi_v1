package com.twochi.notification.service;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Future-facing API for PR B2 (cron) / PR B3 (event producer).
 * PR B1 에선 seeder 만 사용. v2 의 EMAIL/WEB_PUSH 채널 publish 는 overload 또는 별도 메서드로 추가.
 */
@Service
public class NotificationProducer {

    private final NotificationRepository repository;

    public NotificationProducer(NotificationRepository repository) {
        this.repository = repository;
    }

    /** INBOX 채널 알림. sentAt = createdAt = now. */
    @Transactional
    public Notification publish(Long userId, NotificationType type, String title) {
        return publish(userId, type, title, null);
    }

    /** body 가 필요한 경우 (v2 에 활용 가능). */
    @Transactional
    public Notification publish(Long userId, NotificationType type, String title, String body) {
        return repository.save(Notification.forInbox(userId, type, title, body, Instant.now()));
    }

    /**
     * dedup_key 기반 멱등 publish. 이미 같은 (userId, dedupKey) 알림이 있으면 skip.
     * existsBy 선체크 + unique 제약(동시성 안전망). cron 전용.
     */
    @Transactional
    public Notification publishDeduped(Long userId, NotificationType type, String title, String dedupKey) {
        if (repository.existsByUserIdAndDedupKey(userId, dedupKey)) {
            return null;
        }
        return repository.save(Notification.forInboxDeduped(userId, type, title, null, Instant.now(), dedupKey));
    }
}
