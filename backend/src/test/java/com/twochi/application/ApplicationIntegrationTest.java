package com.twochi.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.posting.keyword.KeywordExtractor;
import com.twochi.posting.repository.JobPostingRepository;
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
class ApplicationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private JobPostingRepository postingRepository;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private CoverLetterVariantRepository variantRepository;
    @Autowired private RedisConnectionFactory redis;
    @MockBean private KeywordExtractor keywordExtractor;

    private String accessToken;
    private Long postingId;

    @BeforeEach
    void setUp() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of());
        eventRepository.deleteAll();
        applicationRepository.deleteAll();
        variantRepository.deleteAll();
        postingRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();

        Map<String, Object> signup = Map.of(
            "email", "alice@example.com", "password", "Pass1234!",
            "nickname", "alice", "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        accessToken = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        // 공고 1 개 사전 생성 (deadline 포함)
        MvcResult createPosting = mockMvc.perform(post("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "source", "MANUAL",
                    "company", "(주)테크",
                    "title", "백엔드 (2~5년)",
                    "jobRole", "백엔드",
                    "deadline", "2026-06-30"
                ))))
            .andReturn();
        postingId = om.readTree(createPosting.getResponse().getContentAsString()).get("id").asLong();
    }

    @AfterEach
    void tearDown() {
        eventRepository.deleteAll();
        applicationRepository.deleteAll();
        variantRepository.deleteAll();
        postingRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_정상_시_application_과_DOC_DEADLINE_이벤트_자동_생성() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode node = om.readTree(result.getResponse().getContentAsString());
        assertThat(node.get("company").asText()).isEqualTo("(주)테크");
        assertThat(node.get("currentStage").asText()).isEqualTo("DOC_SUBMITTED");
        assertThat(node.get("currentResult").asText()).isEqualTo("IN_PROGRESS");
        assertThat(node.get("events")).hasSize(1);
        assertThat(node.get("events").get(0).get("type").asText()).isEqualTo("DOC_DEADLINE");
        assertThat(node.get("events").get(0).get("eventDate").asText()).isEqualTo("2026-06-30");
    }

    @Test
    void create_deadline_null_이면_event_생성_안됨() throws Exception {
        // 새 공고 (deadline 없음)
        MvcResult cp = mockMvc.perform(post("/api/v1/postings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "source", "MANUAL",
                    "company", "(주)노데드라인",
                    "title", "프론트엔드",
                    "jobRole", "프론트엔드"
                ))))
            .andReturn();
        Long pid = om.readTree(cp.getResponse().getContentAsString()).get("id").asLong();

        MvcResult result = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", pid))))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode node = om.readTree(result.getResponse().getContentAsString());
        assertThat(node.get("events")).isEmpty();
    }

    @Test
    void create_중복_시_409() throws Exception {
        mockMvc.perform(post("/api/v1/applications")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("postingId", postingId))));
        mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andExpect(status().isConflict());
    }

    @Test
    void list_필터_stage_와_result() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andReturn();
        Long appId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        // stage 변경
        mockMvc.perform(patch("/api/v1/applications/" + appId)
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("currentStage", "FIRST_INTERVIEW"))));
        // 매칭 필터
        mockMvc.perform(get("/api/v1/applications?stage=FIRST_INTERVIEW")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
        // 안 맞는 필터
        mockMvc.perform(get("/api/v1/applications?stage=PASSED")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.length()").value(0));
        // result 필터: 매칭
        mockMvc.perform(get("/api/v1/applications?result=IN_PROGRESS")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.length()").value(1));
        // result 필터: 안 맞는
        mockMvc.perform(get("/api/v1/applications?result=PASSED")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getOne_cross_user_시_404() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andReturn();
        Long appId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();

        // 다른 사용자 signup + login
        Map<String, Object> bob = Map.of(
            "email", "bob@example.com", "password", "Pass1234!",
            "nickname", "bob", "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(bob)));
        MvcResult bobLogin = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!"))))
            .andReturn();
        String bobToken = om.readTree(bobLogin.getResponse().getContentAsString()).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/applications/" + appId)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void patch_stage_result_memo_정상() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andReturn();
        Long appId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(patch("/api/v1/applications/" + appId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentStage", "EXEC_INTERVIEW",
                    "currentResult", "IN_PROGRESS",
                    "memo", "임원 면접 잘 봤다"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.currentStage").value("EXEC_INTERVIEW"))
            .andExpect(jsonPath("$.memo").value("임원 면접 잘 봤다"));
    }

    @Test
    void delete_시_events_도_함께_삭제() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andReturn();
        Long appId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        // events 1 개 자동 생성 확인
        assertThat(eventRepository.findByApplicationIdOrderByEventDateAsc(appId)).hasSize(1);
        mockMvc.perform(delete("/api/v1/applications/" + appId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());
        // CASCADE 검증
        assertThat(eventRepository.findByApplicationIdOrderByEventDateAsc(appId)).isEmpty();
        assertThat(applicationRepository.findById(appId)).isEmpty();
    }
}
