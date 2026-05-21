package com.twochi.posting.parser;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PostingParseControllerTest {

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
        jobPostingRepository.deleteAll();
        projectRepository.deleteAll();
        careerRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void parse_unsupportedDomain_returns422() throws Exception {
        Map<String, String> req = Map.of("url", "https://example.com/x");
        mockMvc.perform(post("/api/v1/postings/parse")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("UNSUPPORTED_PARSE_SITE"));
    }

    @Test
    void parse_unauthenticated_returns401() throws Exception {
        Map<String, String> req = Map.of("url", "https://example.com/x");
        mockMvc.perform(post("/api/v1/postings/parse")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isUnauthorized());
    }
}
