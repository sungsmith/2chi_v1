package com.twochi.match;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.activity.repository.ActivityLogRepository;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.posting.keyword.KeywordExtractor;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.career.repository.CareerRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class MatchIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private JobPostingRepository postingRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ActivityLogRepository activityLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;
    @MockBean private KeywordExtractor keywordExtractor;

    private String token;

    private void clean() {
        activityLogRepository.deleteAllInBatch();
        postingRepository.deleteAllInBatch();
        careerRepository.deleteAllInBatch();
        profileRepository.deleteAllInBatch();
        consentLogRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        redis.getConnection().serverCommands().flushDb();
    }

    @AfterEach
    void tearDown() { clean(); }

    @BeforeEach
    void setUp() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of());
        clean();
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "mt@example.com", "password", "Pass1234!", "nickname", "mt",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "mt@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void 공고없으면_percent0() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/me/match/dashboard")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode b = om.readTree(r.getResponse().getContentAsString());
        assertThat(b.get("percent").asInt()).isEqualTo(0);
        assertThat(b.get("postingCount").asInt()).isEqualTo(0);
        assertThat(b.get("gaps")).isEmpty();
    }

    @Test
    void 일부매칭_percent50_gap_Kafka() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of("Spring", "Kafka"));
        // 프로필 생성 — 온보딩 완료 후 소개 패치로 코퍼스에 "spring" 시드
        mockMvc.perform(post("/api/v1/onboarding")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "target", "EMPLOYMENT", "careerYear", 2, "targetJobs", List.of("BACKEND")))))
            .andExpect(status().is2xxSuccessful());
        mockMvc.perform(patch("/api/v1/me/profile")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("introduction", "Spring 기반 결제 정산 개발 경험"))))
            .andExpect(status().isOk());
        // 공고 생성 → keywords=[Spring,Kafka]
        mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "네이버", "title", "백엔드", "jobRole", "백엔드"))))
            .andExpect(status().is2xxSuccessful());

        MvcResult r = mockMvc.perform(get("/api/v1/me/match/dashboard")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode b = om.readTree(r.getResponse().getContentAsString());
        assertThat(b.get("postingCount").asInt()).isEqualTo(1);
        assertThat(b.get("percent").asInt()).isEqualTo(50);
        assertThat(b.get("gaps").get(0).get("keyword").asText()).isEqualTo("Kafka");
        assertThat(b.get("gaps").get(0).get("hitCount").asInt()).isEqualTo(1);
    }

    @Test
    void 공고별_매칭률_postingId_percent() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of("Spring", "Kafka"));
        mockMvc.perform(post("/api/v1/onboarding")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "target", "EMPLOYMENT", "careerYear", 2, "targetJobs", List.of("BACKEND")))))
            .andExpect(status().is2xxSuccessful());
        mockMvc.perform(patch("/api/v1/me/profile")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("introduction", "Spring 기반 결제 정산 개발 경험"))))
            .andExpect(status().isOk());
        MvcResult cp = mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "네이버", "title", "백엔드", "jobRole", "백엔드"))))
            .andExpect(status().is2xxSuccessful()).andReturn();
        long postingId = om.readTree(cp.getResponse().getContentAsString()).get("id").asLong();

        MvcResult r = mockMvc.perform(get("/api/v1/me/match/postings")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode b = om.readTree(r.getResponse().getContentAsString());
        assertThat(b.get("matches")).hasSize(1);
        assertThat(b.get("matches").get(0).get("postingId").asLong()).isEqualTo(postingId);
        assertThat(b.get("matches").get(0).get("percent").asInt()).isEqualTo(50);
    }

    @Test
    void 공고별_keywords_없으면_제외() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of());
        mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "노키워드", "title", "백엔드", "jobRole", "백엔드"))))
            .andExpect(status().is2xxSuccessful());
        MvcResult r = mockMvc.perform(get("/api/v1/me/match/postings")
            .header("Authorization", "Bearer " + token)).andReturn();
        assertThat(om.readTree(r.getResponse().getContentAsString()).get("matches")).isEmpty();
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/match/dashboard")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me/match/postings")).andExpect(status().isUnauthorized());
    }
}
