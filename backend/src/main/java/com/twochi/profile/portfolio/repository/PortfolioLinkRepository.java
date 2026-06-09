package com.twochi.profile.portfolio.repository;

import com.twochi.profile.portfolio.domain.PortfolioLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PortfolioLinkRepository extends JpaRepository<PortfolioLink, Long> {

    List<PortfolioLink> findAllByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<PortfolioLink> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(p.orderIndex), -1) FROM PortfolioLink p WHERE p.userId = :userId")
    int findMaxOrderIndexByUserId(Long userId);
}
