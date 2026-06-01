package com.twochi.notification.service;

import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.coverletter.domain.CoverLetterVariant;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.notification.domain.NotificationType;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.IsoFields;

/**
 * cron 알림 생성. 각 generate* 메서드는 의도적으로 @Transactional 을 두지 않는다 —
 * publishDeduped 가 건별 독립 트랜잭션으로 커밋되어 부분 실패가 안전하고(이미 보낸 알림 보존),
 * dedup_key 덕분에 재실행해도 중복되지 않는다. 전체를 @Transactional 로 묶으면
 * 한 건 실패가 전체 롤백 + 대형 트랜잭션이 되므로 묶지 말 것.
 */
@Service
public class NotificationGenerator {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JobPostingRepository jobPostingRepository;
    private final NotiSettingResolver settingResolver;
    private final NotificationProducer producer;
    private final EventRepository eventRepository;
    private final CoverLetterVariantRepository variantRepository;
    private final ProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;

    public NotificationGenerator(JobPostingRepository jobPostingRepository,
                                 NotiSettingResolver settingResolver,
                                 NotificationProducer producer,
                                 EventRepository eventRepository,
                                 CoverLetterVariantRepository variantRepository,
                                 ProfileRepository profileRepository,
                                 ApplicationRepository applicationRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.settingResolver = settingResolver;
        this.producer = producer;
        this.eventRepository = eventRepository;
        this.variantRepository = variantRepository;
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
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

    public void generateCoverLetterUnsubmitted(LocalDate today) {
        Instant staleBefore = today.atStartOfDay(SEOUL).minusDays(7).toInstant();
        for (var r : variantRepository.findUnsubmittedBefore(today, staleBefore)) {
            if (settingResolver.isEnabled(r.getUserId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D)) {
                producer.publishDeduped(r.getUserId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D,
                    "%s 자소서가 아직 작성 중이에요. 마감 전에 마무리해볼까요?".formatted(r.getCompany()),
                    "CL7:" + r.getVariantId());
            }
        }
    }

    public void generateWeeklySummary(LocalDate today) {
        Instant to = today.atStartOfDay(SEOUL).toInstant();
        Instant from = today.minusDays(7).atStartOfDay(SEOUL).toInstant();
        int week = today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int weekYear = today.get(IsoFields.WEEK_BASED_YEAR);
        String isoWeek = "%d-W%02d".formatted(weekYear, week);

        for (Profile profile : profileRepository.findByOnboardingCompletedTrue()) {
            long applied = applicationRepository.countByUserIdAndCreatedAtBetween(profile.getUserId(), from, to);
            long drafts = variantRepository
                .countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
                    profile.getUserId(), CoverLetterVariant.Status.DRAFT, from, to);
            if (applied == 0 && drafts == 0) continue;
            if (!settingResolver.isEnabled(profile.getUserId(), NotificationType.WEEKLY_SUMMARY)) continue;
            producer.publishDeduped(profile.getUserId(), NotificationType.WEEKLY_SUMMARY,
                "이번 주 지원 %d건·자소서 초안 %d건을 정리했어요".formatted(applied, drafts),
                "WK:" + profile.getUserId() + ":" + isoWeek);
        }
    }

    /** 매일 도는 알림 (스케줄러용). cleanup 은 스케줄러가 NotificationService 로 별도 호출. */
    public void runDaily(LocalDate today) {
        generatePostingDeadline(today);
        generateScheduleD1(today);
        generateCoverLetterUnsubmitted(today);
        if (today.getDayOfWeek() == DayOfWeek.MONDAY) {
            generateWeeklySummary(today);
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
