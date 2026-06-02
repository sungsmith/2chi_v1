package com.twochi.profile.experience.repository;

import com.twochi.profile.experience.domain.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    List<Experience> findAllByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<Experience> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(e.orderIndex), -1) FROM Experience e WHERE e.userId = :userId")
    int findMaxOrderIndexByUserId(Long userId);
}
