package com.twochi.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.Instant;

@Entity
@Table(name = "app_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", length = 60)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    private User(String email, String passwordHash, String nickname) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.role = "USER";
        this.emailVerified = false;
        this.failedLoginCount = 0;
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public static User createEmailUser(String email, String passwordHash, String nickname) {
        return new User(email, passwordHash, nickname);
    }

    private static final int MAX_FAILURES = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(10);

    public boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public long retryAfterSeconds(Instant now) {
        if (!isLocked(now)) return 0;
        return Duration.between(now, lockedUntil).getSeconds();
    }

    public void recordLoginFailure(Instant now) {
        this.failedLoginCount = this.failedLoginCount + 1;
        if (this.failedLoginCount >= MAX_FAILURES) {
            this.lockedUntil = now.plus(LOCK_DURATION);
        }
        this.updatedAt = now;
    }

    public void recordLoginSuccess(Instant now) {
        this.failedLoginCount = 0;
        this.lockedUntil = null;
        this.lastLoginAt = now;
        this.updatedAt = now;
    }
}
