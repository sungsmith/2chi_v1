package com.twochi.notification.listener;

import com.twochi.auth.event.UserSignedUpEvent;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotificationProducer;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 가입 완료 → 환영 알림 발행. 가입 트랜잭션 커밋 후에만 발화(AFTER_COMMIT)하여
 * 가입/알림을 디커플링. publishDeduped(dedupKey="WELCOME") 로 사용자당 1건 멱등.
 */
@Component
public class WelcomeNotificationListener {

    private static final String WELCOME_TITLE =
        "이취 시작을 축하해요! 첫 자소서부터 차근차근 정리해드릴게요";
    private static final String WELCOME_DEDUP_KEY = "WELCOME";

    private final NotificationProducer producer;

    public WelcomeNotificationListener(NotificationProducer producer) {
        this.producer = producer;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserSignedUp(UserSignedUpEvent event) {
        producer.publishDeduped(
            event.userId(), NotificationType.WELCOME, WELCOME_TITLE, WELCOME_DEDUP_KEY);
    }
}
