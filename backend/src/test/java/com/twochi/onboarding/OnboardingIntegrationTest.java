package com.twochi.onboarding;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.ProfileRepository;
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

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OnboardingIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

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
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void onboarding_validRequest_createsProfile() throws Exception {
        Map<String, Object> body = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 3,
            "targetJobs", List.of("BACKEND", "INFRA_CLOUD")
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.target").value("JOB_CHANGE"))
            .andExpect(jsonPath("$.careerYear").value(3))
            .andExpect(jsonPath("$.onboardingCompleted").value(true));

        var profile = profileRepository.findAll();
        assertThat(profile).hasSize(1);
        assertThat(profile.get(0).getTarget().name()).isEqualTo("JOB_CHANGE");
        assertThat(profile.get(0).getCareerYear()).isEqualTo((short) 3);
        assertThat(profile.get(0).targetJobs()).extracting(Enum::name)
            .containsExactlyInAnyOrder("BACKEND", "INFRA_CLOUD");
        assertThat(profile.get(0).isOnboardingCompleted()).isTrue();
    }

    @Test
    void onboarding_noToken_returns401() throws Exception {
        Map<String, Object> body = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 3,
            "targetJobs", List.of("BACKEND")
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void onboarding_invalidTargetEnum_returns400() throws Exception {
        String json = "{\"target\":\"FOO\",\"careerYear\":3,\"targetJobs\":[\"BACKEND\"]}";

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void onboarding_invalidTargetJobEnum_returns400() throws Exception {
        String json = "{\"target\":\"JOB_CHANGE\",\"careerYear\":3,\"targetJobs\":[\"DATA\"]}";

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void onboarding_careerYearNegative_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", -1,
            "targetJobs", List.of("BACKEND")
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void onboarding_careerYearTooLarge_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 8,
            "targetJobs", List.of("BACKEND")
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void onboarding_emptyTargetJobs_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 3,
            "targetJobs", List.of()
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void onboarding_secondCall_updatesProfileIdempotently() throws Exception {
        Map<String, Object> first = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 3,
            "targetJobs", List.of("BACKEND")
        );
        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(first)))
            .andExpect(status().isOk());

        Map<String, Object> second = Map.of(
            "target", "EMPLOYMENT",
            "careerYear", 0,
            "targetJobs", List.of("UI_UX")
        );
        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(second)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.target").value("EMPLOYMENT"))
            .andExpect(jsonPath("$.careerYear").value(0));

        var profiles = profileRepository.findAll();
        assertThat(profiles).hasSize(1);
        assertThat(profiles.get(0).getTarget().name()).isEqualTo("EMPLOYMENT");
        assertThat(profiles.get(0).getCareerYear()).isEqualTo((short) 0);
        assertThat(profiles.get(0).targetJobs()).extracting(Enum::name)
            .containsExactlyInAnyOrder("UI_UX");
    }
}
