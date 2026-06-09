package com.twochi.activity.listener;

import com.twochi.activity.domain.ActivityLog;
import com.twochi.activity.domain.ActivityType;
import com.twochi.activity.event.ActivityEvents.AiDraftGenerated;
import com.twochi.activity.event.ActivityEvents.ApplicationCreated;
import com.twochi.activity.event.ActivityEvents.CoverLetterSaved;
import com.twochi.activity.event.ActivityEvents.NotificationCreated;
import com.twochi.activity.event.ActivityEvents.StageChanged;
import com.twochi.activity.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ActivityLogListener {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogListener.class);

    private final ActivityLogRepository repository;

    public ActivityLogListener(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationCreated(ApplicationCreated e) {
        save(ActivityLog.of(e.userId(), ActivityType.APPLICATION_CREATED,
            "Plus", null, "내", e.company() + " · " + e.role(),
            null, null, " 공고에 지원을 등록했어요.", e.occurredAt()), e.userId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStageChanged(StageChanged e) {
        String icon = e.failed() ? "X" : "Check";
        String tone = e.failed() ? "fail" : "ok";
        String suffix = KoreanParticle.ro(e.toLabel()) + " 변경됐어요.";
        save(ActivityLog.of(e.userId(), ActivityType.STAGE_CHANGED,
            icon, tone, "내", e.company() + " · " + e.role(),
            e.fromStageLabel(), e.toLabel(), suffix, e.occurredAt()), e.userId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onCoverLetterSaved(CoverLetterSaved e) {
        String icon = e.completed() ? "Check" : "FileEdit";
        String tone = e.completed() ? "ok" : null;
        String suffix = e.completed() ? " 자소서를 제출 완료로 표시했어요." : " 자소서를 저장했어요.";
        save(ActivityLog.of(e.userId(), ActivityType.COVER_LETTER_SAVED,
            icon, tone, "내", e.company() + " " + e.itemTypeLabel(),
            null, null, suffix, e.occurredAt()), e.userId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAiDraftGenerated(AiDraftGenerated e) {
        save(ActivityLog.of(e.userId(), ActivityType.AI_DRAFT_GENERATED,
            "Sparkle", "ok", "AI · 자소서 초안", e.company() + " " + e.itemTypeLabel(),
            null, null, " AI 초안이 생성됐어요.", e.occurredAt()), e.userId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onNotificationCreated(NotificationCreated e) {
        save(ActivityLog.of(e.userId(), ActivityType.NOTIFICATION,
            "Bell", "warn", "시스템 · 알림", null,
            null, null, e.title(), e.occurredAt()), e.userId());
    }

    private void save(ActivityLog entry, Long userId) {
        try {
            repository.save(entry);
        } catch (Exception ex) {
            // 원 트랜잭션은 이미 커밋됨 — 활동 로그는 best-effort.
            log.warn("활동 로그 적재 실패 userId={}", userId, ex);
        }
    }
}
