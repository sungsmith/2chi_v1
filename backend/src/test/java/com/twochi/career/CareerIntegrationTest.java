package com.twochi.career;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CareerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
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
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        accessToken = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @AfterEach
    void tearDown() {
        projectRepository.deleteAll();
        careerRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void getCareers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/me/careers"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void getCareers_authenticatedEmpty_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/v1/me/careers").header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.careers").isArray())
            .andExpect(jsonPath("$.careers.length()").value(0));
    }

    @Test
    void createCareer_validRequest_returns201AndAutoOrder() throws Exception {
        // 첫 회사 — orderIndex = 0
        Map<String, Object> req = Map.of(
            "company", "(주)현재회사",
            "position", "백엔드 개발자",
            "startDate", "2024-04-01"
        );
        mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.company").value("(주)현재회사"))
            .andExpect(jsonPath("$.orderIndex").value(0))
            .andExpect(jsonPath("$.isCurrent").value(true));

        // 두 번째 — orderIndex = 1
        Map<String, Object> req2 = Map.of(
            "company", "(주)이전회사",
            "position", "백엔드 개발자",
            "startDate", "2023-07-01",
            "endDate", "2024-03-31"
        );
        mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req2)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderIndex").value(1))
            .andExpect(jsonPath("$.isCurrent").value(false));
    }

    @Test
    void createCareer_blankCompany_returns400() throws Exception {
        Map<String, Object> req = Map.of(
            "company", "",
            "position", "백엔드",
            "startDate", "2024-01-01"
        );
        mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void updateCareer_ownResource_updatesAndReturns200() throws Exception {
        Long careerId = createSampleCareer();

        Map<String, Object> req = Map.of(
            "company", "수정된 회사",
            "position", "시니어 백엔드",
            "startDate", "2024-04-01",
            "endDate", "2025-12-31"
        );
        mockMvc.perform(put("/api/v1/me/careers/" + careerId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.company").value("수정된 회사"))
            .andExpect(jsonPath("$.isCurrent").value(false));
    }

    @Test
    void updateCareer_otherUserResource_returns404() throws Exception {
        Long bobCareerId = createCareerForAnotherUser("bob@example.com");

        Map<String, Object> req = Map.of(
            "company", "hijack",
            "position", "p",
            "startDate", "2024-01-01"
        );
        mockMvc.perform(put("/api/v1/me/careers/" + bobCareerId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CAREER_NOT_FOUND"));
    }

    @Test
    void deleteCareer_cascadeDeletesProjects() throws Exception {
        Long careerId = createSampleCareer();
        // 프로젝트 직접 삽입 (ProjectController 는 Task 5 — 아직 미구현)
        com.twochi.career.domain.Project p = com.twochi.career.domain.Project.create(
            userRepository.findAll().get(0).getId(),
            careerId, "프로젝트 1",
            java.time.LocalDate.of(2024, 5, 1), null,
            0, java.time.Instant.now()
        );
        projectRepository.save(p);

        // 회사 삭제 → 204
        mockMvc.perform(delete("/api/v1/me/careers/" + careerId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        // 확인: 빈 트리
        mockMvc.perform(get("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.careers.length()").value(0));
    }

    @Test
    void deleteCareer_nonExistent_returns404() throws Exception {
        mockMvc.perform(delete("/api/v1/me/careers/99999")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CAREER_NOT_FOUND"));
    }

    // ----- helpers -----

    private Long createSampleCareer() throws Exception {
        Map<String, Object> req = Map.of(
            "company", "(주)현재회사",
            "position", "백엔드 개발자",
            "startDate", "2024-04-01"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andReturn();
        return om.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createCareerForAnotherUser(String email) throws Exception {
        Map<String, Object> signup = Map.of(
            "email", email,
            "password", "Pass1234!",
            "nickname", email.substring(0, email.indexOf("@")),
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
        String token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        Map<String, Object> req = Map.of(
            "company", "bob co",
            "position", "p",
            "startDate", "2024-01-01"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andReturn();
        return om.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
