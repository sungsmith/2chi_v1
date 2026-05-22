package com.twochi.application;

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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class EventQueryIntegrationTest {

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
        Long pid = createPosting(aliceToken, "(주)테크", "백엔드", "2026-07-15");
        aliceAppId = createApplication(aliceToken, pid);
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
    void list_월별_정상_조회_정렬_확인() throws Exception {
        mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
            .header("Authorization", "Bearer " + aliceToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("type", "FIRST_INTERVIEW", "eventDate", "2026-07-20", "eventTime", "14:00:00"))));
        mockMvc.perform(post("/api/v1/applications/" + aliceAppId + "/events")
            .header("Authorization", "Bearer " + aliceToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("type", "CODING_TEST", "eventDate", "2026-07-10"))));
        mockMvc.perform(get("/api/v1/events?from=2026-07-01&to=2026-07-31")
                .header("Authorization", "Bearer " + aliceToken))
            .andExpect(status().isOk())
            // 자동 생성된 DOC_DEADLINE (7/15) + CODING_TEST (7/10) + FIRST_INTERVIEW (7/20)
            .andExpect(jsonPath("$.length()").value(3))
            // event_date ASC 정렬
            .andExpect(jsonPath("$[0].eventDate").value("2026-07-10"))
            .andExpect(jsonPath("$[0].type").value("CODING_TEST"))
            .andExpect(jsonPath("$[1].eventDate").value("2026-07-15"))
            .andExpect(jsonPath("$[1].type").value("DOC_DEADLINE"))
            .andExpect(jsonPath("$[2].eventDate").value("2026-07-20"))
            .andExpect(jsonPath("$[2].company").value("(주)테크"));
    }

    @Test
    void list_빈_결과() throws Exception {
        mockMvc.perform(get("/api/v1/events?from=2027-01-01&to=2027-01-31")
                .header("Authorization", "Bearer " + aliceToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void list_cross_user_격리() throws Exception {
        // Bob 의 application 과 event 는 alice 의 응답에 나오지 않아야 함
        String bobToken = signupAndLogin("bob@example.com", "bob");
        Long bobPid = createPosting(bobToken, "(주)밥회사", "ML", null);
        Long bobAppId = createApplication(bobToken, bobPid);
        mockMvc.perform(post("/api/v1/applications/" + bobAppId + "/events")
            .header("Authorization", "Bearer " + bobToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("type", "FIRST_INTERVIEW", "eventDate", "2026-07-12"))));
        // alice 의 응답엔 alice 자신의 event 만 (자동 생성 DOC_DEADLINE 1 개)
        mockMvc.perform(get("/api/v1/events?from=2026-07-01&to=2026-07-31")
                .header("Authorization", "Bearer " + aliceToken))
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].company").value("(주)테크"));
    }
}
