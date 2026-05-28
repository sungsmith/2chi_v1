package com.twochi.notification.repository;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(
        Long userId, NotificationChannel channel, Instant since);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now " +
           "WHERE n.userId = :userId AND n.channel = :channel AND n.readAt IS NULL")
    int markAllReadByUserIdAndChannel(@Param("userId") Long userId,
                                       @Param("channel") NotificationChannel channel,
                                       @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.channel = :channel")
    int deleteAllByUserIdAndChannel(@Param("userId") Long userId,
                                     @Param("channel") NotificationChannel channel);

    boolean existsByUserIdAndDedupKey(Long userId, String dedupKey);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.channel = :channel AND n.createdAt < :cutoff")
    int deleteByChannelAndCreatedAtBefore(@Param("channel") NotificationChannel channel,
                                          @Param("cutoff") Instant cutoff);
}
