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
class EventIntegrationTest {

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

    private String aliceToken;
    private Long aliceAppId;

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

        aliceToken = signupAndLogin("alice@example.com", "alice");
        Long postingId = createPosting(aliceToken, "(주)테크", "백엔드", "2026-06-30");
        aliceAppId = createApplication(aliceToken, postingId);
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

    private String signupAndLogin(String email, String nickname) throws Exception {
        Map<String, Object> signup = Map.of(
            "email", email, "password", "Pass1234!",
            "nickname", nickname, "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", "Pass1234!"))))
            .andReturn();
        return om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private Long createPosting(String token, String company, String role, String deadline) throws Exception {
        var body = new java.util.HashMap<String, Object>();
        body.put("source", "MANUAL");
        body.put("company", company);
        body.put("title", role);
        body.put("jobRole", role);
        if (deadline != null) body.put("deadline", deadline);
        MvcResult r = mockMvc.perform(post("/api/v1/postings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createApplication(String token, Long postingId) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/applications")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("postingId", postingId))))
            .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void create_정상() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "type", "FIRST_INTERVIEW",
                    "eventDate", "2026-07-10",
                    "eventTime", "14:00:00",
                    "memo", "본사 3 층"
                ))))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode n = om.readTree(r.getResponse().getContentAsString());
        assertThat(n.get("type").asText()).isEqualTo("FIRST_INTERVIEW");
        assertThat(n.get("eventDate").asText()).isEqualTo("2026-07-10");
        assertThat(n.get("eventTime").asText()).isEqualTo("14:00:00");
    }

    @Test
    void patch_부분_수정() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "type", "CODING_TEST",
                    "eventDate", "2026-07-05"
                ))))
            .andReturn();
        Long evId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(patch("/api/v1/events/" + evId)
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "eventDate", "2026-07-06",
                    "memo", "프로그래머스 7 문제"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eventDate").value("2026-07-06"))
            .andExpect(jsonPath("$.memo").value("프로그래머스 7 문제"))
            .andExpect(jsonPath("$.type").value("CODING_TEST"));
    }

    @Test
    void patch_cross_user_시_404() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("type", "ETC", "eventDate", "2026-07-15"))))
            .andReturn();
        Long evId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();

        String bobToken = signupAndLogin("bob@example.com", "bob");
        mockMvc.perform(patch("/api/v1/events/" + evId)
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("memo", "해킹"))))
            .andExpect(status().isNotFound());
    }

    @Test
    void delete_정상() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("type", "ETC", "eventDate", "2026-07-15"))))
            .andReturn();
        Long evId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(delete("/api/v1/events/" + evId)
                .header("Authorization", "Bearer " + aliceToken))
            .andExpect(status().isNoContent());
        assertThat(eventRepository.findById(evId)).isEmpty();
    }

    @Test
    void delete_cross_user_시_404() throws Exception {
        MvcResult cr = mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("type", "ETC", "eventDate", "2026-07-15"))))
            .andReturn();
        Long evId = om.readTree(cr.getResponse().getContentAsString()).get("id").asLong();
        String bobToken = signupAndLogin("bob@example.com", "bob");
        mockMvc.perform(delete("/api/v1/events/" + evId)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound());
    }
}
