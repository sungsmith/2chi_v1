package com.twochi.auth.jwt;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-must-be-at-least-32-bytes-long-1234";
    private final JwtTokenProvider provider = new JwtTokenProvider(SECRET, Duration.ofMinutes(30));

    @Test
    void issue_returnsTokenWithExpectedClaims() {
        String token = provider.issue(42L, "alice@example.com", "alice", "USER");

        Claims claims = provider.parse(token);
        assertThat(claims.getSubject()).isEqualTo("42");
        assertThat(claims.get("email")).isEqualTo("alice@example.com");
        assertThat(claims.get("nickname")).isEqualTo("alice");
        assertThat(claims.get("role")).isEqualTo("USER");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    void parse_rejectsTamperedToken() {
        String token = provider.issue(1L, "a@b.com", "alice", "USER");
        String tampered = token.substring(0, token.length() - 2) + "xx";
        assertThatThrownBy(() -> provider.parse(tampered)).isInstanceOf(Exception.class);
    }

    @Test
    void parse_rejectsTokenSignedWithDifferentSecret() {
        JwtTokenProvider other = new JwtTokenProvider("other-secret-min-32-bytes-long-aaaaaa", Duration.ofMinutes(30));
        String token = other.issue(1L, "a@b.com", "alice", "USER");
        assertThatThrownBy(() -> provider.parse(token)).isInstanceOf(Exception.class);
    }
}
