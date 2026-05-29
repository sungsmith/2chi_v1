package com.twochi.notification.service;

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

    public NotificationGenerator(JobPostingRepository jobPostingRepository,
                                 NotiSettingResolver settingResolver,
                                 NotificationProducer producer) {
        this.jobPostingRepository = jobPostingRepository;
        this.settingResolver = settingResolver;
        this.producer = producer;
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
}
