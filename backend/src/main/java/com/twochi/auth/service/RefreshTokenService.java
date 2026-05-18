package com.twochi.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private static final String KEY_PREFIX = "refresh:";

    private final StringRedisTemplate redis;
    private final Duration ttl;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(
        StringRedisTemplate redis,
        @Value("${app.refresh.ttl}") Duration ttl
    ) {
        this.redis = redis;
        this.ttl = ttl;
    }

    public String issue(Long userId) {
        String raw = newRawToken();
        redis.opsForValue().set(key(raw), String.valueOf(userId), ttl);
        return raw;
    }

    public Optional<Long> findUserId(String raw) {
        if (raw == null || raw.isBlank()) return Optional.empty();
        String value = redis.opsForValue().get(key(raw));
        if (value == null) return Optional.empty();
        return Optional.of(Long.parseLong(value));
    }

    public record RotateResult(String newToken, Long userId) {}

    public RotateResult rotate(String oldRaw) {
        Long userId = findUserId(oldRaw)
            .orElseThrow(() -> new com.twochi.common.exception.BusinessException(
                com.twochi.common.exception.ErrorCode.INVALID_REFRESH_TOKEN));
        revoke(oldRaw);
        return new RotateResult(issue(userId), userId);
    }

    public void revoke(String raw) {
        if (raw == null || raw.isBlank()) return;
        redis.delete(key(raw));
    }

    private String newRawToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String key(String raw) {
        return KEY_PREFIX + sha256Hex(raw);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
