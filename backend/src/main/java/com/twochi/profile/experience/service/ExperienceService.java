package com.twochi.profile.experience.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.experience.domain.Experience;
import com.twochi.profile.experience.dto.ExperienceRequest;
import com.twochi.profile.experience.repository.ExperienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExperienceService {

    private final ExperienceRepository experienceRepository;

    @Transactional(readOnly = true)
    public List<Experience> findAllByUserId(Long userId) {
        return experienceRepository.findAllByUserIdOrderByOrderIndexAsc(userId);
    }

    public Experience create(Long userId, ExperienceRequest req) {
        int order = experienceRepository.findMaxOrderIndexByUserId(userId) + 1;
        Experience e = Experience.create(
            userId, req.type(), req.name(), req.organization(),
            req.startDate(), req.endDate(),
            req.role(), req.summary(),
            order, Instant.now()
        );
        return experienceRepository.save(e);
    }

    public Experience update(Long userId, Long experienceId, ExperienceRequest req) {
        Experience e = findOwned(userId, experienceId);
        e.update(req.type(), req.name(), req.organization(),
            req.startDate(), req.endDate(),
            req.role(), req.summary(), Instant.now());
        return e;
    }

    public void delete(Long userId, Long experienceId) {
        Experience e = findOwned(userId, experienceId);
        experienceRepository.delete(e);
    }

    private Experience findOwned(Long userId, Long experienceId) {
        return experienceRepository.findByIdAndUserId(experienceId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.EXPERIENCE_NOT_FOUND));
    }
}
