package com.twochi.notification.domain;

/**
 * V1 notification.channel CHECK 와 매핑. V5 가 INBOX 추가.
 * INBOX: PR B1 의 in-app inbox 전용. 발송 워커 미경유.
 * EMAIL / WEB_PUSH: v2 발송 워커 채널.
 */
public enum NotificationChannel {
    EMAIL,
    WEB_PUSH,
    INBOX
}
