package com.twochi.profile.certificate.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.certificate.domain.Certificate;
import com.twochi.profile.certificate.dto.CertificateRequest;
import com.twochi.profile.certificate.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificateService {

    private final CertificateRepository certificateRepository;

    @Transactional(readOnly = true)
    public List<Certificate> findAllByUserId(Long userId) {
        return certificateRepository.findAllByUserIdOrderByOrderIndexAsc(userId);
    }

    public Certificate create(Long userId, CertificateRequest req) {
        int order = certificateRepository.findMaxOrderIndexByUserId(userId) + 1;
        Certificate c = Certificate.create(
            userId, req.name(), req.issuer(), req.acquiredAt(), req.score(),
            order, Instant.now()
        );
        return certificateRepository.save(c);
    }

    public Certificate update(Long userId, Long certificateId, CertificateRequest req) {
        Certificate c = findOwned(userId, certificateId);
        c.update(req.name(), req.issuer(), req.acquiredAt(), req.score(), Instant.now());
        return c;
    }

    public void delete(Long userId, Long certificateId) {
        Certificate c = findOwned(userId, certificateId);
        certificateRepository.delete(c);
    }

    private Certificate findOwned(Long userId, Long certificateId) {
        return certificateRepository.findByIdAndUserId(certificateId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CERTIFICATE_NOT_FOUND));
    }
}
