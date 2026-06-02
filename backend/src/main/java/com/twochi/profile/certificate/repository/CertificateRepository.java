package com.twochi.profile.certificate.repository;

import com.twochi.profile.certificate.domain.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findAllByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<Certificate> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(c.orderIndex), -1) FROM Certificate c WHERE c.userId = :userId")
    int findMaxOrderIndexByUserId(Long userId);
}
