package com.twochi.profile.portfolio.repository;

import com.twochi.profile.portfolio.domain.PortfolioFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioFileRepository extends JpaRepository<PortfolioFile, Long> {
    List<PortfolioFile> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<PortfolioFile> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
