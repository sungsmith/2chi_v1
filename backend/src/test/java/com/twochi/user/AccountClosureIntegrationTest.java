package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class AccountClosureIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private String refreshTokenCookie;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        profileRepository.deleteAll();
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
                .content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        JsonNode body = om.readTree(login.getResponse().getContentAsString());
        accessToken = body.get("accessToken").asText();

        String setCookie = login.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            Matcher m = Pattern.compile("refresh_token=([^;]+)").matcher(setCookie);
            if (m.find()) refreshTokenCookie = m.group(1);
        }

        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void withdraw_validPassword_setsDeletedAt() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        var u = userRepository.findById(userId).orElseThrow();
        assertThat(u.getDeletedAt()).isNotNull();
    }

    @Test
    void withdraw_wrongPassword_returns400() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "WrongPass!"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_MISMATCH"));

        var u = userRepository.findById(userId).orElseThrow();
        assertThat(u.getDeletedAt()).isNull();
    }

    @Test
    void withdraw_alreadyWithdrawn_returns409() throws Exception {
        // 같은 access token 으로 두 번 호출 가능한 이유: JwtAuthenticationFilter 가 claims-only
        // (DB lookup 없음, §6.1). filter 단에서 deletedAt 체크가 추가되면 이 케이스는
        // 두 번째 호출 시 410 USER_WITHDRAWN 으로 바뀜.
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("ALREADY_WITHDRAWN"));
    }

    @Test
    void withdraw_thenLogin_returns410WithdrawnGrace() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "alice@example.com", "password", "Pass1234!"))))
            .andExpect(status().isGone())
            .andExpect(jsonPath("$.code").value("USER_WITHDRAWN_GRACE"));
    }

    @Test
    void withdraw_thenRefresh_returns410WithdrawnGrace() throws Exception {
        Assumptions.assumeTrue(refreshTokenCookie != null,
            "refresh_token cookie not captured from login response");

        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(new Cookie("refresh_token", refreshTokenCookie)))
            .andExpect(status().isGone())
            .andExpect(jsonPath("$.code").value("USER_WITHDRAWN_GRACE"));
    }

    @Test
    void withdraw_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isUnauthorized());
    }
}
