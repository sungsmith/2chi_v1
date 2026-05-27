package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.UserNotiSettingRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class NotiSettingsIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private UserNotiSettingRepository userNotiSettingRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        userNotiSettingRepository.deleteAll();
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
        userNotiSettingRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void getNotiSettings_noOverride_returnsDefaults() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.settings.length()").value(12))
            // deadline-d3: defaultOn=true, locked=false
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].enabled").value(true))
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].locked").value(false))
            // weekly-summary: defaultOn=false, locked=false
            .andExpect(jsonPath("$.settings[?(@.id == 'weekly-summary')].enabled").value(false))
            .andExpect(jsonPath("$.settings[?(@.id == 'weekly-summary')].locked").value(false))
            // signup-verify: defaultOn=true, locked=true
            .andExpect(jsonPath("$.settings[?(@.id == 'signup-verify')].enabled").value(true))
            .andExpect(jsonPath("$.settings[?(@.id == 'signup-verify')].locked").value(true))
            // iteration order = NotiSettingDef enum 선언 순서 (FE 가 의존하는 contract)
            .andExpect(jsonPath("$.settings[0].id").value("deadline-d3"))
            .andExpect(jsonPath("$.settings[11].id").value("channel-push"))
            // field-drift 보호: label 도 검증
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].label").value("채용공고 마감 D-3"));
    }

    @Test
    void getNotiSettings_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/noti-settings"))
            .andExpect(status().isUnauthorized());
    }
}
