package com.twochi.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenServiceTest {

    @Autowired private RefreshTokenService service;
    @Autowired private RedisConnectionFactory redisConnectionFactory;

    @BeforeEach
    void flushRedis() {
        redisConnectionFactory.getConnection().serverCommands().flushDb();
    }

    @Test
    void issue_storesHashedTokenInRedis() {
        String raw = service.issue(42L);
        assertThat(raw).isNotBlank();
        assertThat(service.findUserId(raw)).contains(42L);
    }

    @Test
    void rotate_invalidatesOldAndIssuesNew() {
        String old = service.issue(42L);
        RefreshTokenService.RotateResult fresh = service.rotate(old);

        assertThat(service.findUserId(old)).isEmpty();
        assertThat(service.findUserId(fresh.newToken())).contains(42L);
        assertThat(fresh.userId()).isEqualTo(42L);
    }

    @Test
    void rotate_unknownToken_throws() {
        org.junit.jupiter.api.Assertions.assertThrows(
            com.twochi.common.exception.BusinessException.class,
            () -> service.rotate("not-a-real-token")
        );
    }

    @Test
    void revoke_removesToken() {
        String raw = service.issue(42L);
        service.revoke(raw);
        assertThat(service.findUserId(raw)).isEmpty();
    }

    @Test
    void revoke_unknownToken_isIdempotent() {
        service.revoke("garbage");
    }
}
