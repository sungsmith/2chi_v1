package com.twochi.profile.education.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.education.domain.Education;
import com.twochi.profile.education.dto.EducationRequest;
import com.twochi.profile.education.repository.EducationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EducationService {

    private final EducationRepository educationRepository;

    @Transactional(readOnly = true)
    public List<Education> findAllByUserId(Long userId) {
        return educationRepository.findAllByUserIdOrderByOrderIndexAsc(userId);
    }

    public Education create(Long userId, EducationRequest req) {
        int order = educationRepository.findMaxOrderIndexByUserId(userId) + 1;
        Education e = Education.create(
            userId, req.level(), req.school(), req.major(),
            req.startDate(), req.endDate(),
            req.gpa(), req.gpaMax(),
            req.status(), order, Instant.now()
        );
        return educationRepository.save(e);
    }

    public Education update(Long userId, Long educationId, EducationRequest req) {
        Education e = findOwned(userId, educationId);
        e.update(req.level(), req.school(), req.major(),
            req.startDate(), req.endDate(),
            req.gpa(), req.gpaMax(),
            req.status(), Instant.now());
        return e;
    }

    public void delete(Long userId, Long educationId) {
        Education e = findOwned(userId, educationId);
        educationRepository.delete(e);
    }

    private Education findOwned(Long userId, Long educationId) {
        return educationRepository.findByIdAndUserId(educationId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.EDUCATION_NOT_FOUND));
    }
}
