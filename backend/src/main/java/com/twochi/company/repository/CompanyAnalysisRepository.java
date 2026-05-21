package com.twochi.company.repository;

import com.twochi.company.domain.CompanyAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyAnalysisRepository extends JpaRepository<CompanyAnalysis, Long> {

    List<CompanyAnalysis> findAllByUserIdOrderByGeneratedAtDesc(Long userId);

    Optional<CompanyAnalysis> findByIdAndUserId(Long id, Long userId);

    Optional<CompanyAnalysis> findByUserIdAndCompany(Long userId, String company);
}
