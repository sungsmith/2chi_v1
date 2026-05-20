package com.twochi.career.repository;

import com.twochi.career.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByCareerHistoryIdOrderByOrderIndexDesc(Long careerHistoryId);

    Optional<Project> findByIdAndCareerHistoryId(Long id, Long careerHistoryId);

    /** 권한 가드용 — userId 와 함께 검증. */
    Optional<Project> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(p.orderIndex), -1) FROM Project p WHERE p.careerHistoryId = :careerHistoryId")
    int findMaxOrderIndexByCareerHistoryId(Long careerHistoryId);

    void deleteAllByCareerHistoryId(Long careerHistoryId);
}
