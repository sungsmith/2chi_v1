package com.twochi.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.experience.repository.ExperienceRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class ExperienceIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private ExperienceRepository experienceRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        experienceRepository.deleteAll();
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
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        accessToken = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @AfterEach
    void tearDown() {
        experienceRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_returns_201_and_persists() throws Exception {
        Map<String, Object> req = Map.of(
            "type", "INTERN",
            "name", "백엔드 인턴",
            "organization", "토스",
            "role", "결제 API"
        );
        mockMvc.perform(post("/api/v1/me/experiences")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.type").value("INTERN"))
            .andExpect(jsonPath("$.name").value("백엔드 인턴"))
            .andExpect(jsonPath("$.organization").value("토스"))
            .andExpect(jsonPath("$.role").value("결제 API"))
            .andExpect(jsonPath("$.orderIndex").value(0));

        assertThat(experienceRepository.count()).isEqualTo(1);
    }

    @Test
    void list_returns_orderIndex_asc() throws Exception {
        createSampleExperience("백엔드 인턴", "INTERN");
        createSampleExperience("해커톤", "CONTEST");

        mockMvc.perform(get("/api/v1/me/experiences")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.experiences").isArray())
            .andExpect(jsonPath("$.experiences.length()").value(2))
            .andExpect(jsonPath("$.experiences[0].orderIndex").value(0))
            .andExpect(jsonPath("$.experiences[1].orderIndex").value(1));
    }

    @Test
    void update_changes_fields() throws Exception {
        Long id = createSampleExperience("백엔드 인턴", "INTERN");

        Map<String, Object> req = Map.of(
            "type", "CLUB",
            "name", "개발 동아리"
        );
        mockMvc.perform(put("/api/v1/me/experiences/" + id)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("CLUB"))
            .andExpect(jsonPath("$.name").value("개발 동아리"));
    }

    @Test
    void delete_204() throws Exception {
        Long id = createSampleExperience("백엔드 인턴", "INTERN");

        mockMvc.perform(delete("/api/v1/me/experiences/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me/experiences")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.experiences.length()").value(0));
    }

    @Test
    void cross_user_404() throws Exception {
        Long aliceId = createSampleExperience("백엔드 인턴", "INTERN");

        String bobToken = signupAndLogin("bob@example.com", "bob");

        Map<String, Object> req = Map.of(
            "type", "INTERN",
            "name", "hijack"
        );

        mockMvc.perform(put("/api/v1/me/experiences/" + aliceId)
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("EXPERIENCE_NOT_FOUND"));

        mockMvc.perform(delete("/api/v1/me/experiences/" + aliceId)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("EXPERIENCE_NOT_FOUND"));
    }

    // ----- helpers -----

    private Long createSampleExperience(String name, String type) throws Exception {
        Map<String, Object> req = Map.of(
            "type", type,
            "name", name
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/experiences")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andReturn();
        return om.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String signupAndLogin(String email, String nickname) throws Exception {
        Map<String, Object> signup = Map.of(
            "email", email,
            "password", "Pass1234!",
            "nickname", nickname,
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", "Pass1234!"))))
            .andReturn();
        return om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
