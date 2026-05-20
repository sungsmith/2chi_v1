package com.twochi.posting.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.dto.JobPostingCreateRequest;
import com.twochi.posting.dto.JobPostingPatchRequest;
import com.twochi.posting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class JobPostingService {

    private final JobPostingRepository repository;

    @Transactional(readOnly = true)
    public List<JobPosting> findAll(Long userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public JobPosting create(Long userId, JobPostingCreateRequest req) {
        JobPosting p = JobPosting.create(
            userId, req.source(), req.company(), req.title(),
            req.jobRole(), req.requirements(), req.preferred(), req.mainTasks(),
            req.deadline(), req.sourceUrl(),
            new String[0],  // keywords: Task 6 에서 LLM 추출로 채움
            Instant.now()
        );
        return repository.save(p);
    }

    public JobPosting patch(Long userId, Long id, JobPostingPatchRequest req) {
        JobPosting p = findOwned(userId, id);
        p.update(
            req.company() != null ? req.company() : p.getCompany(),
            req.title() != null ? req.title() : p.getTitle(),
            req.jobRole() != null ? req.jobRole() : p.getJobRole(),
            req.requirements() != null ? req.requirements() : p.getRequirements(),
            req.preferred() != null ? req.preferred() : p.getPreferred(),
            req.mainTasks() != null ? req.mainTasks() : p.getMainTasks(),
            req.deadline() != null ? req.deadline() : p.getDeadline(),
            null,  // keywords 재추출은 Task 6 에서
            Instant.now()
        );
        return p;
    }

    public void delete(Long userId, Long id) {
        JobPosting p = findOwned(userId, id);
        repository.delete(p);
    }

    public JobPosting findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.POSTING_NOT_FOUND));
    }
}
