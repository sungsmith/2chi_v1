package com.twochi.career.service;

import com.twochi.career.domain.Career;
import com.twochi.career.dto.CareerRequest;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CareerService {

    private final CareerRepository careerRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<Career> findAllByUserId(Long userId) {
        return careerRepository.findAllByUserIdOrderByOrderIndexDesc(userId);
    }

    public Career create(Long userId, CareerRequest req) {
        int order = careerRepository.findMaxOrderIndexByUserId(userId) + 1;
        Career c = Career.create(userId, req.company(), req.position(),
            req.startDate(), req.endDate(), order, Instant.now());
        return careerRepository.save(c);
    }

    public Career update(Long userId, Long careerId, CareerRequest req) {
        Career c = findOwned(userId, careerId);
        c.update(req.company(), req.position(), req.startDate(), req.endDate(), Instant.now());
        return c;
    }

    public void delete(Long userId, Long careerId) {
        Career c = findOwned(userId, careerId);
        projectRepository.deleteAllByCareerHistoryId(careerId);
        careerRepository.delete(c);
    }

    public Career findOwned(Long userId, Long careerId) {
        return careerRepository.findByIdAndUserId(careerId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CAREER_NOT_FOUND));
    }
}
