package com.twochi.activity.repository;

import com.twochi.activity.domain.ActivityLog;
import com.twochi.activity.domain.ActivityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Page<ActivityLog> findByUserIdOrderByOccurredAtDesc(Long userId, Pageable pageable);

    Page<ActivityLog> findByUserIdAndTypeInOrderByOccurredAtDesc(
        Long userId, List<ActivityType> types, Pageable pageable);

    @Query("select a.type as type, count(a) as cnt from ActivityLog a where a.userId = :userId group by a.type")
    List<TypeCount> countByType(Long userId);

    interface TypeCount {
        ActivityType getType();
        long getCnt();
    }
}
