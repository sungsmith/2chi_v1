package com.twochi.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
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
        String fresh = service.rotate(old);

        assertThat(service.findUserId(old)).isEmpty();
        assertThat(service.findUserId(fresh)).contains(42L);
    }

    @Test
    void rotate_unknownToken_throws() {
        org.junit.jupiter.api.Assertions.assertThrows(
            IllegalStateException.class,
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
