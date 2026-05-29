package com.twochi.notification.service;

import com.twochi.application.repository.EventRepository;
import com.twochi.notification.domain.NotificationType;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * cron 알림 생성. 각 generate* 메서드는 의도적으로 @Transactional 을 두지 않는다 —
 * publishDeduped 가 건별 독립 트랜잭션으로 커밋되어 부분 실패가 안전하고(이미 보낸 알림 보존),
 * dedup_key 덕분에 재실행해도 중복되지 않는다. 전체를 @Transactional 로 묶으면
 * 한 건 실패가 전체 롤백 + 대형 트랜잭션이 되므로 묶지 말 것.
 */
@Service
public class NotificationGenerator {

    private final JobPostingRepository jobPostingRepository;
    private final NotiSettingResolver settingResolver;
    private final NotificationProducer producer;
    private final EventRepository eventRepository;

    public NotificationGenerator(JobPostingRepository jobPostingRepository,
                                 NotiSettingResolver settingResolver,
                                 NotificationProducer producer,
                                 EventRepository eventRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.settingResolver = settingResolver;
        this.producer = producer;
        this.eventRepository = eventRepository;
    }

    public void generatePostingDeadline(LocalDate today) {
        for (JobPosting p : jobPostingRepository.findByDeadline(today.plusDays(3))) {
            if (settingResolver.isEnabled(p.getUserId(), NotificationType.POSTING_DEADLINE_D3)) {
                producer.publishDeduped(p.getUserId(), NotificationType.POSTING_DEADLINE_D3,
                    "%s %s 마감이 3일 남았어요".formatted(p.getCompany(), p.getTitle()),
                    "PD_D3:" + p.getId());
            }
        }
        for (JobPosting p : jobPostingRepository.findByDeadline(today.plusDays(1))) {
            if (settingResolver.isEnabled(p.getUserId(), NotificationType.POSTING_DEADLINE_D1)) {
                producer.publishDeduped(p.getUserId(), NotificationType.POSTING_DEADLINE_D1,
                    "%s %s 마감이 내일이에요".formatted(p.getCompany(), p.getTitle()),
                    "PD_D1:" + p.getId());
            }
        }
    }

    public void generateScheduleD1(LocalDate today) {
        for (var r : eventRepository.findScheduleEventsByDate(today.plusDays(1))) {
            if (settingResolver.isEnabled(r.getUserId(), NotificationType.SCHEDULE_D1)) {
                producer.publishDeduped(r.getUserId(), NotificationType.SCHEDULE_D1,
                    "%s %s 일정이 내일이에요".formatted(r.getCompany(), eventTypeLabel(r.getType())),
                    "SCH_D1:" + r.getEventId());
            }
        }
    }

    private static String eventTypeLabel(com.twochi.application.domain.EventType type) {
        return switch (type) {
            case DOC_DEADLINE -> "서류 마감";
            case CODING_TEST -> "코딩테스트";
            case FIRST_INTERVIEW -> "1차 면접";
            case SECOND_INTERVIEW -> "2차 면접";
            case EXEC_INTERVIEW -> "임원 면접";
            case NEGOTIATION -> "처우 협상";
            default -> "일정";
        };
    }
}
