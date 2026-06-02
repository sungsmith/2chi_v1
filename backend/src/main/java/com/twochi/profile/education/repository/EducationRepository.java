package com.twochi.profile.education.repository;

import com.twochi.profile.education.domain.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EducationRepository extends JpaRepository<Education, Long> {

    List<Education> findAllByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<Education> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(e.orderIndex), -1) FROM Education e WHERE e.userId = :userId")
    int findMaxOrderIndexByUserId(Long userId);
}
