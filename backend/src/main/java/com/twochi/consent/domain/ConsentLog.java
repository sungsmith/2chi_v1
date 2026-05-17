package com.twochi.consent.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "consent_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConsentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 50)
    private ConsentType consentType;

    @Column(nullable = false)
    private boolean agreed;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(length = 45)
    private String ip;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    private ConsentLog(Long userId, ConsentType type, boolean agreed, String version, String ip, String ua) {
        this.userId = userId;
        this.consentType = type;
        this.agreed = agreed;
        this.version = version;
        this.ip = ip;
        this.userAgent = ua;
        this.createdAt = Instant.now();
    }

    public static ConsentLog record(Long userId, ConsentType type, boolean agreed, String version, String ip, String ua) {
        return new ConsentLog(userId, type, agreed, version, ip, ua);
    }
}
