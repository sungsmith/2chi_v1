package com.twochi.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LoginIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private RedisConnectionFactory redis;

    @BeforeEach
    void setUp() throws Exception {
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();

        Map<String, Object> signup = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(signup)))
            .andExpect(status().isCreated());
    }

    @AfterEach
    void tearDown() {
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void login_success_returnsAccessTokenAndSetsRefreshCookie() throws Exception {
        Map<String, Object> body = Map.of("email", "alice@example.com", "password", "Pass1234!");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isString())
            .andExpect(jsonPath("$.user.email").value("alice@example.com"))
            .andExpect(jsonPath("$.user.nickname").value("alice"))
            .andExpect(cookie().exists("refresh_token"))
            .andExpect(cookie().httpOnly("refresh_token", true))
            .andExpect(cookie().path("refresh_token", "/api/v1/auth"))
            .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).contains("SameSite=Strict");
    }

    @Test
    void login_wrongPassword_returns401_andIncrementsFailureCount() throws Exception {
        Map<String, Object> body = Map.of("email", "alice@example.com", "password", "WrongPass!");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        var u = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow();
        assertThat(u.getFailedLoginCount()).isEqualTo(1);
    }

    @Test
    void login_emailNotFound_returns401() throws Exception {
        Map<String, Object> body = Map.of("email", "nobody@example.com", "password", "Pass1234!");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void login_fiveConsecutiveFailures_locksAccountReturning423() throws Exception {
        Map<String, Object> body = Map.of("email", "alice@example.com", "password", "WrongPass!");

        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isLocked())
            .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"))
            .andExpect(jsonPath("$.metadata.retryAfterSeconds").isNumber());

        var u = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow();
        assertThat(u.getLockedUntil()).isNotNull();
    }

    @Test
    void login_lockedAccount_evenCorrectPassword_returns423() throws Exception {
        Map<String, Object> wrong = Map.of("email", "alice@example.com", "password", "WrongPass!");
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsString(wrong)));
        }
        Map<String, Object> correct = Map.of("email", "alice@example.com", "password", "Pass1234!");
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(correct)))
            .andExpect(status().isLocked())
            .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
    }

    @Test
    void login_fourFailuresThenSuccess_resetsCounter() throws Exception {
        Map<String, Object> wrong = Map.of("email", "alice@example.com", "password", "WrongPass!");
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsString(wrong)));
        }
        Map<String, Object> correct = Map.of("email", "alice@example.com", "password", "Pass1234!");
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(correct)))
            .andExpect(status().isOk());

        var u = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow();
        assertThat(u.getFailedLoginCount()).isZero();
        assertThat(u.getLockedUntil()).isNull();
        assertThat(u.getLastLoginAt()).isNotNull();
    }
}
