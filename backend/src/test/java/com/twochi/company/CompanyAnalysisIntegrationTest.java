package com.twochi.company;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.company.service.AnalysisAiClient;
import com.twochi.company.service.HomepageScraperService;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import com.twochi.company.repository.CompanyAnalysisRepository;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class CompanyAnalysisIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CompanyAnalysisRepository analysisRepository;
    @Autowired private RedisConnectionFactory redis;

    @MockBean private AnalysisAiClient aiClient;
    @MockBean private HomepageScraperService scraper;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        analysisRepository.deleteAll();
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

        when(scraper.scrape(anyList())).thenReturn(List.of("홈페이지 본문"));
        when(aiClient.generate(anyString())).thenReturn(
            new AnalysisAiClient.Result(
                "{\"talent_profile\":[\"고객 중심\",\"데이터 기반\"],\"action_points\":[\"포인트1\",\"포인트2\",\"포인트3\"]}",
                "gpt-4o-mini", 800
            )
        );
    }

    @AfterEach
    void tearDown() {
        analysisRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_returns_201_and_saves_summary_json() throws Exception {
        String body = om.writeValueAsString(Map.of(
            "company", "(주)테크컴퍼니",
            "urls", List.of("https://techcompany.kr/about")
        ));

        MvcResult r = mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.company").value("(주)테크컴퍼니"))
            .andExpect(jsonPath("$.generatedBy").value("gpt-4o-mini"))
            .andReturn();

        String json = r.getResponse().getContentAsString();
        JsonNode root = om.readTree(json);
        String summaryJson = root.get("summaryJson").asText();
        JsonNode summary = om.readTree(summaryJson);
        assertThat(summary.get("overview").get("businessArea").asText()).isEqualTo("결제·정산 SaaS");
        assertThat(summary.get("talent_profile").get(0).asText()).isEqualTo("고객 중심");
        assertThat(summary.get("action_points").size()).isEqualTo(3);
    }

    @Test
    void create_with_existing_company_updates_in_place_returns_200() throws Exception {
        String body = om.writeValueAsString(Map.of(
            "company", "(주)테크컴퍼니", "urls", List.of()
        ));

        mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());

        assertThat(analysisRepository.findAll().size()).isEqualTo(1);
    }

    @Test
    void list_returns_recent_first() throws Exception {
        for (String c : List.of("(주)테크컴퍼니", "삼성전자")) {
            mockMvc.perform(post("/api/v1/company-analyses")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsString(Map.of("company", c, "urls", List.of()))));
        }

        mockMvc.perform(get("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].company").value("삼성전자"))
            .andExpect(jsonPath("$[1].company").value("(주)테크컴퍼니"));
    }

    @Test
    void get_returns_full_summary() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("company", "(주)테크컴퍼니", "urls", List.of()))))
            .andExpect(status().isCreated())
            .andReturn();
        long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/v1/company-analyses/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.company").value("(주)테크컴퍼니"))
            .andExpect(jsonPath("$.expiresInDays").value(30));
    }

    @Test
    void by_company_returns_id_or_null() throws Exception {
        mockMvc.perform(get("/api/v1/company-analyses/by-company")
                .header("Authorization", "Bearer " + accessToken)
                .param("company", "미등록"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.nullValue()))
            .andExpect(jsonPath("$.company").value("미등록"));

        mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("company", "(주)테크컴퍼니", "urls", List.of()))));

        mockMvc.perform(get("/api/v1/company-analyses/by-company")
                .header("Authorization", "Bearer " + accessToken)
                .param("company", "(주)테크컴퍼니"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void delete_returns_204_and_404_on_subsequent_get() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("company", "(주)테크컴퍼니", "urls", List.of()))))
            .andReturn();
        long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/v1/company-analyses/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/company-analyses/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void cross_user_protection_returns_404() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/company-analyses")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("company", "(주)테크컴퍼니", "urls", List.of()))))
            .andReturn();
        long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "bob@example.com", "password", "Pass1234!",
                "nickname", "bob", "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)
            ))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!"))))
            .andReturn();
        String bobToken = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/company-analyses/" + id)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound());
    }
}
