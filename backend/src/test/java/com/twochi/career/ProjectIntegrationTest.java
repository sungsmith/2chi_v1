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
class ProjectIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private Long careerId;

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

        // 기본 career 생성
        Map<String, Object> careerReq = Map.of(
            "company", "(주)현재회사",
            "position", "백엔드",
            "startDate", "2024-04-01"
        );
        MvcResult careerRes = mockMvc.perform(post("/api/v1/me/careers")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(careerReq)))
            .andReturn();
        careerId = om.readTree(careerRes.getResponse().getContentAsString()).get("id").asLong();
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
    void createProject_validRequest_returns201() throws Exception {
        Map<String, Object> req = Map.of(
            "title", "주문 정산 시스템 성능 개선",
            "periodStart", "2025-02-01",
            "periodEnd", "2025-06-30"
        );
        mockMvc.perform(post("/api/v1/me/careers/" + careerId + "/projects")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("주문 정산 시스템 성능 개선"))
            .andExpect(jsonPath("$.structureType").value("PRAR"))
            .andExpect(jsonPath("$.techStack").isArray())
            .andExpect(jsonPath("$.metrics").isArray());
    }

    @Test
    void createProject_onOtherUserCareer_returns404() throws Exception {
        Long bobCareerId = createCareerForAnotherUser("bob@example.com");

        Map<String, Object> req = Map.of(
            "title", "hijack",
            "periodStart", "2024-01-01"
        );
        mockMvc.perform(post("/api/v1/me/careers/" + bobCareerId + "/projects")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CAREER_NOT_FOUND"));
    }

    @Test
    void patchProject_prarSingleField_updatesOnlyThatField() throws Exception {
        Long pid = createSampleProject();

        String body = """
            { "prar": { "problem": "월말 정산 TPS 500 한계" } }
            """;
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.prar.problem").value("월말 정산 TPS 500 한계"))
            .andExpect(jsonPath("$.prar.rootCause").doesNotExist());

        // 두 번째 PATCH — rootCause 만. problem 은 이전 값 유지
        String body2 = """
            { "prar": { "rootCause": "N+1 쿼리" } }
            """;
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body2))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.prar.problem").value("월말 정산 TPS 500 한계"))
            .andExpect(jsonPath("$.prar.rootCause").value("N+1 쿼리"));
    }

    @Test
    void patchProject_metricsArrayReplaces() throws Exception {
        Long pid = createSampleProject();

        String body = """
            {
              "metrics": [
                { "k": "TPS", "before": "500", "after": "2000" },
                { "k": "월간 운영비", "delta": "-₩2,000,000", "dir": "down" }
              ]
            }
            """;
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.metrics.length()").value(2))
            .andExpect(jsonPath("$.metrics[0].k").value("TPS"))
            .andExpect(jsonPath("$.metrics[1].dir").value("down"));

        // 빈 배열 → metrics 비워짐
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"metrics\": [] }"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.metrics.length()").value(0));
    }

    @Test
    void patchProject_titleAndDates_combined() throws Exception {
        Long pid = createSampleProject();

        String body = """
            {
              "title": "주문 정산 v2",
              "periodStart": "2025-03-01",
              "periodEnd": "2025-07-31",
              "role": "PL"
            }
            """;
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("주문 정산 v2"))
            .andExpect(jsonPath("$.periodStart").value("2025-03-01"))
            .andExpect(jsonPath("$.periodEnd").value("2025-07-31"))
            .andExpect(jsonPath("$.role").value("PL"));
    }

    @Test
    void patchProject_nonExistent_returns404() throws Exception {
        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/99999")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"title\": \"x\" }"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    @Test
    void deleteProject_ownResource_returns204() throws Exception {
        Long pid = createSampleProject();
        mockMvc.perform(delete("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/v1/me/careers/" + careerId + "/projects/" + pid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"title\": \"y\" }"))
            .andExpect(status().isNotFound());
    }

    // ----- helpers -----

    private Long createSampleProject() throws Exception {
        Map<String, Object> req = Map.of(
            "title", "샘플 프로젝트",
            "periodStart", "2025-01-01"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/careers/" + careerId + "/projects")
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
