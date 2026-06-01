package com.twochi.notification.service;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.dto.NotificationItemResponse;
import com.twochi.notification.dto.NotificationListResponse;
import com.twochi.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    private static final Duration RETENTION = Duration.ofDays(30);
    private static final NotificationChannel INBOX = NotificationChannel.INBOX;

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userId) {
        Instant cutoff = Instant.now().minus(RETENTION);
        List<NotificationItemResponse> items = repository
            .findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(userId, INBOX, cutoff)
            .stream()
            .map(this::toResponse)
            .toList();
        return new NotificationListResponse(items);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllReadByUserIdAndChannel(userId, INBOX, Instant.now());
    }

    @Transactional
    public void deleteAll(Long userId) {
        repository.deleteAllByUserIdAndChannel(userId, INBOX);
    }

    /** RETENTION(30일) 이전 INBOX 알림 hard delete. cron 전용. 삭제 건수 반환. */
    @Transactional
    public int cleanup(Instant now) {
        return repository.deleteByChannelAndCreatedAtBefore(
            INBOX, now.minus(RETENTION));
    }

    private NotificationItemResponse toResponse(Notification n) {
        return new NotificationItemResponse(
            n.getId(),
            n.getType().name(),
            n.getTitle(),
            n.getBody(),
            n.getCreatedAt(),
            n.getReadAt()
        );
    }
}
