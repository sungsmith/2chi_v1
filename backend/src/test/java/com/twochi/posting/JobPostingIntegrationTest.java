package com.twochi.posting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.posting.repository.JobPostingRepository;
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
class JobPostingIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private JobPostingRepository jobPostingRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        jobPostingRepository.deleteAll();
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
        jobPostingRepository.deleteAll();
        projectRepository.deleteAll();
        careerRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void createPosting_returns201() throws Exception {
        Map<String, Object> req = Map.of(
            "source", "MANUAL",
            "company", "(주)테크",
            "title", "백엔드"
        );
        mockMvc.perform(post("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.company").value("(주)테크"))
            .andExpect(jsonPath("$.title").value("백엔드"))
            .andExpect(jsonPath("$.source").value("MANUAL"))
            .andExpect(jsonPath("$.keywords").isArray())
            .andExpect(jsonPath("$.keywords.length()").value(0));
    }

    @Test
    void getAllPostings_returnsRecentFirst() throws Exception {
        createSamplePosting("첫 번째 회사", "첫 공고");
        // 약간의 시간 차를 두기 위해 두 번째 생성
        createSamplePosting("두 번째 회사", "두 번째 공고");

        mockMvc.perform(get("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].company").value("두 번째 회사"))
            .andExpect(jsonPath("$[1].company").value("첫 번째 회사"));
    }

    @Test
    void patchPosting_updatesFieldsOnly() throws Exception {
        Long id = createSamplePosting("원래 회사", "원래 공고");

        Map<String, Object> patch = Map.of("title", "백엔드 (수정)");
        mockMvc.perform(patch("/api/v1/postings/" + id)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(patch)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("백엔드 (수정)"))
            .andExpect(jsonPath("$.company").value("원래 회사"));
    }

    @Test
    void deletePosting_returns204() throws Exception {
        Long id = createSamplePosting("삭제할 회사", "삭제할 공고");

        mockMvc.perform(delete("/api/v1/postings/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    // ----- helpers -----

    private Long createSamplePosting(String company, String title) throws Exception {
        Map<String, Object> req = Map.of(
            "source", "MANUAL",
            "company", company,
            "title", title
        );
        MvcResult result = mockMvc.perform(post("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andReturn();
        return om.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
