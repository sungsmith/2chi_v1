package com.twochi.career.service;

import com.twochi.career.domain.Career;
import com.twochi.career.domain.Project;
import com.twochi.career.dto.ProjectPatchRequest;
import com.twochi.career.dto.ProjectRequest;
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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CareerService careerService;

    @Transactional(readOnly = true)
    public List<Project> findAllByCareerId(Long careerId) {
        return projectRepository.findAllByCareerHistoryIdOrderByOrderIndexDesc(careerId);
    }

    public Project create(Long userId, Long careerId, ProjectRequest req) {
        // 권한 가드 — careerId 가 본인 소유인지
        Career c = careerService.findOwned(userId, careerId);
        int order = projectRepository.findMaxOrderIndexByCareerHistoryId(c.getId()) + 1;
        Project p = Project.create(userId, c.getId(), req.title(),
            req.periodStart(), req.periodEnd(), order, Instant.now());
        if (req.role() != null) {
            p.replaceRole(req.role(), Instant.now());
        }
        return projectRepository.save(p);
    }

    public Project patch(Long userId, Long careerId, Long projectId, ProjectPatchRequest req) {
        careerService.findOwned(userId, careerId);
        Project p = projectRepository.findByIdAndCareerHistoryId(projectId, careerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

        Instant now = Instant.now();

        if (req.title() != null || req.periodStart() != null) {
            p.updateBasic(req.title(), req.periodStart(), null, now);
        }
        if (req.periodEnd() != null) {
            p.replacePeriodEnd(req.periodEnd(), now);
        }
        if (req.role() != null) {
            p.replaceRole(req.role(), now);
        }
        if (req.prar() != null) {
            p.updatePrar(req.prar().problem(), req.prar().rootCause(),
                req.prar().approach(), req.prar().result(), now);
        }
        if (req.techStack() != null) {
            p.replaceTechStack(req.techStack(), now);
        }
        if (req.metrics() != null) {
            p.replaceMetrics(req.metrics(), now);
        }
        return p;
    }

    public void delete(Long userId, Long careerId, Long projectId) {
        careerService.findOwned(userId, careerId);
        Project p = projectRepository.findByIdAndCareerHistoryId(projectId, careerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROJECT_NOT_FOUND));
        projectRepository.delete(p);
    }
}
