package com.twochi.application.repository;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    long countByUserIdAndCreatedAtBetween(Long userId, Instant from, Instant to);

    Optional<Application> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndPostingId(Long userId, Long postingId);

    List<Application> findByUserIdOrderByUpdatedAtDesc(Long userId);

    @Query("""
        SELECT a FROM Application a
        WHERE a.userId = :userId
          AND (:stage IS NULL OR a.currentStage = :stage)
          AND (:result IS NULL OR a.currentResult = :result)
        ORDER BY a.updatedAt DESC
    """)
    List<Application> findFiltered(Long userId, Stage stage, Result result);
}
