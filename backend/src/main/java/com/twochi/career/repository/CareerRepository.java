package com.twochi.career.repository;

import com.twochi.career.domain.Career;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CareerRepository extends JpaRepository<Career, Long> {

    List<Career> findAllByUserIdOrderByDisplayOrderDesc(Long userId);

    Optional<Career> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(c.displayOrder), -1) FROM Career c WHERE c.userId = :userId")
    int findMaxDisplayOrderByUserId(Long userId);
}
