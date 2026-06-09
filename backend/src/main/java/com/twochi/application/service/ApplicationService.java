package com.twochi.application.service;

import com.twochi.activity.event.ActivityEvents;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final EventRepository eventRepository;
    private final JobPostingRepository postingRepository;
    private final CoverLetterVariantRepository variantRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Map<Stage, String> STAGE_LABEL = Map.of(
        Stage.DOC_SUBMITTED, "서류 제출", Stage.CODING_TEST, "코딩 테스트",
        Stage.FIRST_INTERVIEW, "1차 면접", Stage.SECOND_INTERVIEW, "2차 면접",
        Stage.EXEC_INTERVIEW, "임원 면접", Stage.NEGOTIATION, "처우 협의",
        Stage.PASSED, "합격", Stage.FAILED, "불합격");

    private static final Map<Result, String> RESULT_LABEL = Map.of(
        Result.IN_PROGRESS, "진행 중", Result.PASSED, "합격",
        Result.FAILED, "불합격", Result.WITHDRAWN, "포기");

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
        eventPublisher.publishEvent(new ActivityEvents.ApplicationCreated(
            userId, posting.getCompany(), posting.getTitle(), now));
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
        Stage oldStage = app.getCurrentStage();
        Result oldResult = app.getCurrentResult();
        Instant now = Instant.now();
        app.update(stage, result, memo, company, role, now);

        boolean stageChanged = stage != null && stage != oldStage;
        boolean resultChanged = result != null && result != oldResult;
        if (stageChanged || resultChanged) {
            Result current = app.getCurrentResult();
            boolean failed = current == Result.FAILED;
            boolean passed = current == Result.PASSED;
            boolean withdrawn = current == Result.WITHDRAWN;
            boolean terminal = failed || passed || withdrawn;
            String fromLabel = STAGE_LABEL.get(oldStage);
            // 종료 결과(합격·불합격·포기)면 결과 라벨을, 아니면 새 전형 단계 라벨을 to 로.
            String toLabel = terminal
                ? RESULT_LABEL.get(current)
                : STAGE_LABEL.get(app.getCurrentStage());
            eventPublisher.publishEvent(new ActivityEvents.StageChanged(
                userId, app.getCompany(), app.getRole(), fromLabel, toLabel, failed, passed, withdrawn, now));
        }
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
