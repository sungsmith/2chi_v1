package com.twochi.career.repository;

import com.twochi.career.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByCareerIdOrderByDisplayOrderDesc(Long careerId);

    Optional<Project> findByIdAndCareerId(Long id, Long careerId);

    @Query("SELECT COALESCE(MAX(p.displayOrder), -1) FROM Project p WHERE p.careerId = :careerId")
    int findMaxDisplayOrderByCareerId(Long careerId);

    void deleteAllByCareerId(Long careerId);
}
