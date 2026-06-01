package com.twochi.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.education.repository.EducationRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class EducationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private EducationRepository educationRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        educationRepository.deleteAll();
        projectRepository.deleteAll();
        careerRepository.deleteAll();
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
        educationRepository.deleteAll();
        projectRepository.deleteAll();
        careerRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_returns_201_and_persists() throws Exception {
        Map<String, Object> req = Map.of(
            "level", "UNIVERSITY",
            "school", "서울대",
            "major", "컴공",
            "status", "ATTENDING"
        );
        mockMvc.perform(post("/api/v1/me/educations")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.school").value("서울대"))
            .andExpect(jsonPath("$.level").value("UNIVERSITY"))
            .andExpect(jsonPath("$.status").value("ATTENDING"))
            .andExpect(jsonPath("$.orderIndex").value(0));

        // DB에 1건 저장 확인
        assert educationRepository.count() == 1;
    }

    @Test
    void list_returns_orderIndex_asc() throws Exception {
        // 2개 생성
        createSampleEducation("서울대", "UNIVERSITY", "GRADUATED");
        createSampleEducation("연세대", "GRADUATE", "ATTENDING");

        mockMvc.perform(get("/api/v1/me/educations")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.educations").isArray())
            .andExpect(jsonPath("$.educations.length()").value(2))
            .andExpect(jsonPath("$.educations[0].orderIndex").value(0))
            .andExpect(jsonPath("$.educations[1].orderIndex").value(1));
    }

    @Test
    void update_changes_fields() throws Exception {
        Long id = createSampleEducation("서울대", "UNIVERSITY", "ATTENDING");

        Map<String, Object> req = Map.of(
            "level", "UNIVERSITY",
            "school", "고려대",
            "major", "소프트웨어",
            "status", "GRADUATED"
        );
        mockMvc.perform(put("/api/v1/me/educations/" + id)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.school").value("고려대"))
            .andExpect(jsonPath("$.status").value("GRADUATED"));
    }

    @Test
    void delete_removes() throws Exception {
        Long id = createSampleEducation("서울대", "UNIVERSITY", "ATTENDING");

        mockMvc.perform(delete("/api/v1/me/educations/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me/educations")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.educations.length()").value(0));
    }

    @Test
    void cross_user_404() throws Exception {
        Long aliceId = createSampleEducation("서울대", "UNIVERSITY", "ATTENDING");

        // 두 번째 사용자 가입 + 토큰 획득
        String bobToken = signupAndLogin("bob@example.com", "bob");

        Map<String, Object> req = Map.of(
            "level", "UNIVERSITY",
            "school", "hijack",
            "status", "ATTENDING"
        );

        // bob이 alice의 education에 PUT → 404
        mockMvc.perform(put("/api/v1/me/educations/" + aliceId)
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("EDUCATION_NOT_FOUND"));

        // bob이 alice의 education에 DELETE → 404
        mockMvc.perform(delete("/api/v1/me/educations/" + aliceId)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("EDUCATION_NOT_FOUND"));
    }

    // ----- helpers -----

    private Long createSampleEducation(String school, String level, String status) throws Exception {
        Map<String, Object> req = Map.of(
            "level", level,
            "school", school,
            "status", status
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/educations")
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
