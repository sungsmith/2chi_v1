package com.twochi.posting.repository;

import com.twochi.posting.domain.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<JobPosting> findByIdAndUserId(Long id, Long userId);
}
