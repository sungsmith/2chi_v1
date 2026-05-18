package com.twochi.consent.repository;

import com.twochi.consent.domain.ConsentLog;
import com.twochi.consent.domain.ConsentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsentLogRepository extends JpaRepository<ConsentLog, Long> {

    List<ConsentLog> findByUserIdAndConsentType(Long userId, ConsentType consentType);
}
