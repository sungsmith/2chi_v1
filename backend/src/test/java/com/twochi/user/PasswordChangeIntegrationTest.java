package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PasswordChangeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private PasswordEncoder passwordEncoder;

    private String accessToken;
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
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        JsonNode body = om.readTree(login.getResponse().getContentAsString());
        accessToken = body.get("accessToken").asText();
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
    void changePassword_validInput_updatesHashAndChangedAt() throws Exception {
        User snapshot = userRepository.findById(userId).orElseThrow();
        Instant before = snapshot.getPasswordChangedAt();
        Instant beforeUpdatedAt = snapshot.getUpdatedAt();

        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "Pass1234!",
                    "newPassword", "NewPass5678!"
                ))))
            .andExpect(status().isNoContent());

        User updated = userRepository.findById(userId).orElseThrow();
        assertThat(passwordEncoder.matches("NewPass5678!", updated.getPasswordHash())).isTrue();
        assertThat(updated.getPasswordChangedAt()).isAfter(before);
        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(beforeUpdatedAt);
    }

    @Test
    void changePassword_wrongCurrent_returns400() throws Exception {
        String hashBefore = userRepository.findById(userId).orElseThrow().getPasswordHash();

        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "WrongPass!",
                    "newPassword", "NewPass5678!"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_MISMATCH"));

        String hashAfter = userRepository.findById(userId).orElseThrow().getPasswordHash();
        assertThat(hashAfter).isEqualTo(hashBefore);
    }

    @Test
    void changePassword_sameAsCurrent_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "Pass1234!",
                    "newPassword", "Pass1234!"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_UNCHANGED"));
    }

    @Test
    void changePassword_blankNewPassword_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "Pass1234!",
                    "newPassword", ""
                ))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void changePassword_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "Pass1234!",
                    "newPassword", "NewPass5678!"
                ))))
            .andExpect(status().isUnauthorized());
    }
}
