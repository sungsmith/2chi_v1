package com.twochi.activity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.activity.repository.ActivityLogRepository;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.coverletter.service.CoverLetterAiClient;
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

import static org.awaitility.Awaitility.await;
import static java.time.Duration.ofSeconds;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class ActivityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private ActivityLogRepository activityLogRepository;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private CoverLetterVariantRepository variantRepository;
    @Autowired private JobPostingRepository postingRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;
    @MockBean private KeywordExtractor keywordExtractor;
    @MockBean private CoverLetterAiClient aiClient;

    private String token;
    private Long postingId;

    // 영속 테스트 DB(로컬 Postgres) — @DirtiesContext 가 DB 를 리셋하지 않으므로
    // 메서드 간 격리를 위해 직접 정리. deleteAllInBatch 는 엔티티 로드 없이 bulk DELETE 라
    // 암호화 컬럼(profile)의 stale 데이터 복호화 시도를 피한다. FK 순서: 자식 → 부모.
    private void clean() {
        activityLogRepository.deleteAllInBatch();
        eventRepository.deleteAllInBatch();
        applicationRepository.deleteAllInBatch();
        variantRepository.deleteAllInBatch();
        postingRepository.deleteAllInBatch();
        profileRepository.deleteAllInBatch();
        consentLogRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        redis.getConnection().serverCommands().flushDb();
    }

    @AfterEach
    void tearDown() {
        clean();
    }

    @BeforeEach
    void setUp() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of());
        when(aiClient.generate(any())).thenReturn(
            new CoverLetterAiClient.Result("AI 초안 본문입니다.", "gpt-4o-mini", 800));
        clean();

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "act@example.com", "password", "Pass1234!", "nickname", "act",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "act@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        MvcResult cp = mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "네이버", "title", "백엔드", "jobRole", "백엔드")))).andReturn();
        postingId = om.readTree(cp.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void 빈_상태_200_빈_목록() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/activities")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("activities")).isNotNull();
        assertThat(body.get("counts").get("STAGE").asInt()).isEqualTo(0);
        assertThat(body.get("counts").get("APPLICATION").asInt()).isEqualTo(0);
        assertThat(body.get("page").asInt()).isEqualTo(0);
        assertThat(body.get("size").asInt()).isEqualTo(30);
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/activities")).andExpect(status().isUnauthorized());
    }

    @Test
    void category_파라미터_파싱() throws Exception {
        mockMvc.perform(get("/api/v1/activities?category=STAGE")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    }

    @Test
    void 지원_등록_시_APPLICATION_CREATED_활동_로그_생성() throws Exception {
        mockMvc.perform(post("/api/v1/applications")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("postingId", postingId)))).andExpect(status().isCreated());

        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            MvcResult r = mockMvc.perform(get("/api/v1/activities")
                .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
            JsonNode body = om.readTree(r.getResponse().getContentAsString());
            assertThat(body.get("totalCount").asInt()).isGreaterThanOrEqualTo(1);
            JsonNode first = body.get("activities").get(0);
            assertThat(first.get("type").asText()).isEqualTo("APPLICATION_CREATED");
            assertThat(first.get("subject").asText()).contains("네이버");
            assertThat(body.get("counts").get("APPLICATION").asInt()).isGreaterThanOrEqualTo(1);
        });
    }

    @Test
    void AI_초안_생성_시_AI_DRAFT_GENERATED_기록() throws Exception {
        mockMvc.perform(post("/api/v1/cover-letter-variants")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "postingId", postingId,
                    "itemType", "MOTIVATION",
                    "question", "지원동기를 작성해주세요.",
                    "charLimit", 500))))
            .andExpect(status().isCreated());

        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            MvcResult r = mockMvc.perform(get("/api/v1/activities?category=COVER_LETTER")
                .header("Authorization", "Bearer " + token)).andReturn();
            JsonNode body = om.readTree(r.getResponse().getContentAsString());
            assertThat(body.get("activities").size()).isGreaterThanOrEqualTo(1);
            assertThat(body.get("activities").get(0).get("type").asText()).isEqualTo("AI_DRAFT_GENERATED");
            assertThat(body.get("activities").get(0).get("subject").asText()).contains("네이버");
        });
    }

    @Test
    void 가입_축하_알림이_활동_로그에_NOTIFICATION_으로_기록() throws Exception {
        // setUp 의 signup → WelcomeNotificationListener → 알림 → 활동 로그(NOTIFICATION)
        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            MvcResult r = mockMvc.perform(get("/api/v1/activities?category=NOTIFICATION")
                .header("Authorization", "Bearer " + token)).andReturn();
            JsonNode body = om.readTree(r.getResponse().getContentAsString());
            assertThat(body.get("activities").size()).isGreaterThanOrEqualTo(1);
            assertThat(body.get("activities").get(0).get("type").asText()).isEqualTo("NOTIFICATION");
            assertThat(body.get("activities").get(0).get("actor").asText()).isEqualTo("시스템 · 알림");
        });
    }

    @Test
    void 전형_변경_시_STAGE_CHANGED_from_to_기록() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("postingId", postingId)))).andReturn();
        Long appId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/v1/applications/" + appId)
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("currentStage", "FIRST_INTERVIEW")))).andExpect(status().isOk());

        await().atMost(ofSeconds(5)).untilAsserted(() -> {
            MvcResult r = mockMvc.perform(get("/api/v1/activities?category=STAGE")
                .header("Authorization", "Bearer " + token)).andReturn();
            JsonNode body = om.readTree(r.getResponse().getContentAsString());
            assertThat(body.get("totalCount").asInt()).isGreaterThanOrEqualTo(1);
            JsonNode first = body.get("activities").get(0);
            assertThat(first.get("type").asText()).isEqualTo("STAGE_CHANGED");
            assertThat(first.get("fromLabel").asText()).isEqualTo("서류 제출");
            assertThat(first.get("toLabel").asText()).isEqualTo("1차 면접");
            assertThat(first.get("suffix").asText()).contains("변경됐어요");
        });
    }
}
