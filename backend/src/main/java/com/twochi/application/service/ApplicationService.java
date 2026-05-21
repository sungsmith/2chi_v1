package com.twochi.application.service;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.domain.EventType;
import com.twochi.application.domain.Result;
import com.twochi.application.domain.Stage;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final EventRepository eventRepository;
    private final JobPostingRepository postingRepository;
    private final CoverLetterVariantRepository variantRepository;

    public Application create(Long userId, Long postingId) {
        if (applicationRepository.existsByUserIdAndPostingId(userId, postingId)) {
            throw new BusinessException(ErrorCode.APPLICATION_ALREADY_EXISTS);
        }
        JobPosting posting = postingRepository.findByIdAndUserId(postingId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.POSTING_NOT_FOUND));

        Instant now = Instant.now();
        Application app = Application.create(
            userId, postingId, posting.getCompany(), posting.getTitle(), now
        );
        try {
            applicationRepository.saveAndFlush(app);
        } catch (DataIntegrityViolationException e) {
            // existsBy ↔ save 사이 race: UNIQUE 제약 위반은 409 로 변환
            throw new BusinessException(ErrorCode.APPLICATION_ALREADY_EXISTS);
        }

        if (posting.getDeadline() != null) {
            Event docEvent = Event.create(
                app.getId(), EventType.DOC_DEADLINE,
                posting.getDeadline(), null, null, now
            );
            eventRepository.save(docEvent);
        }
        return app;
    }

    @Transactional(readOnly = true)
    public Application findOwned(Long userId, Long applicationId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.APPLICATION_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<Application> findAll(Long userId, Stage stage, Result result) {
        return applicationRepository.findFiltered(userId, stage, result);
    }

    public Application patch(
        Long userId, Long applicationId,
        Stage stage, Result result, String memo, String company, String role
    ) {
        Application app = findOwned(userId, applicationId);
        Instant now = Instant.now();
        app.update(stage, result, memo, company, role, now);
        return app;
    }

    public void delete(Long userId, Long applicationId) {
        Application app = findOwned(userId, applicationId);
        applicationRepository.delete(app);
    }

    @Transactional(readOnly = true)
    public long variantsCount(Long userId, Long postingId) {
        return variantRepository.countByUserIdAndPostingIdAndDeletedAtIsNull(userId, postingId);
    }

    @Transactional(readOnly = true)
    public List<Event> findEvents(Long applicationId) {
        return eventRepository.findByApplicationIdOrderByEventDateAsc(applicationId);
    }

    @Transactional(readOnly = true)
    public Optional<Event> findNextEvent(Long applicationId, LocalDate today) {
        return eventRepository.findUpcomingByApplicationIds(List.of(applicationId), today)
            .stream().findFirst();
    }
}
