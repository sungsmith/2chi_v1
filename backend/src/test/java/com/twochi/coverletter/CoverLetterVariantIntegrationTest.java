package com.twochi.coverletter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.coverletter.service.CoverLetterAiClient;
import com.twochi.coverletter.service.MasterAnswerEncryptor;
import com.twochi.posting.domain.JobPosting;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class CoverLetterVariantIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CoverLetterVariantRepository variantRepo;
    @Autowired private JobPostingRepository postingRepo;
    @Autowired private MasterAnswerEncryptor encryptor;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private RedisConnectionFactory redis;

    @MockBean private CoverLetterAiClient aiClient;

    private String accessToken;
    private Long userId;
    private Long postingId;

    @BeforeEach
    void setUp() throws Exception {
        variantRepo.deleteAll();
        postingRepo.deleteAll();
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
        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();

        // 공고 1개 직접 insert (5.5 의 controller 호출은 LLM 키워드 추출까지 트리거하므로 회피)
        JobPosting p = JobPosting.create(
            userId, JobPosting.Source.MANUAL,
            "(주)테크컴퍼니", "백엔드 개발자", "백엔드",
            "Spring·MSA·Kafka", "Kafka 우대", "API 설계",
            LocalDate.of(2026, 6, 30), null,
            new String[]{"Spring Boot", "MSA", "Kafka", "PostgreSQL"},
            Instant.now()
        );
        postingId = postingRepo.save(p).getId();

        when(aiClient.generate(anyString())).thenReturn(
            new CoverLetterAiClient.Result(
                "AI 초안 본문: Spring Boot 와 MSA 경험을 살려…", "gpt-4o-mini", 1200
            )
        );
    }

    @AfterEach
    void tearDown() {
        variantRepo.deleteAll();
        postingRepo.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_variant_with_AI_draft_returns_201_and_encrypts_in_db() throws Exception {
        String body = om.writeValueAsString(Map.of(
            "postingId", postingId,
            "itemType", "MOTIVATION",
            "question", "우리 회사에 지원한 이유를 작성해주세요.",
            "charLimit", 500,
            "userRequest", "정량 강조"
        ));
        MvcResult result = mockMvc.perform(post("/api/v1/cover-letter-variants")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.aiDraft").value(org.hamcrest.Matchers.containsString("Spring Boot")))
            .andExpect(jsonPath("$.userEdit").value(org.hamcrest.Matchers.containsString("Spring Boot")))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.aiModel").value("gpt-4o-mini"))
            .andExpect(jsonPath("$.postingCompany").value("(주)테크컴퍼니"))
            .andReturn();
        long vid = om.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        String rawAi = jdbc.queryForObject(
            "SELECT ai_draft FROM cover_letter_variant WHERE id = ?", String.class, vid
        );
        assertThat(rawAi).isNotNull();
        assertThat(rawAi).doesNotContain("Spring Boot");
        assertThat(encryptor.decrypt(rawAi)).contains("Spring Boot");
    }

    @Test
    void patch_userEdit_updates_user_edit_and_validation_json() throws Exception {
        long vid = createVariant();

        String patchBody = om.writeValueAsString(Map.of(
            "userEdit", "Spring Boot 와 MSA 와 Kafka 경험을 살려 PostgreSQL 도 다뤘습니다."
        ));
        mockMvc.perform(patch("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(patchBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userEdit").value(org.hamcrest.Matchers.containsString("MSA")))
            .andExpect(jsonPath("$.status").value("DRAFT"));

        // validation_json 갱신 확인 — DB 직접 조회 + JSONB round-trip 검증
        // (Task 2 code-review I-1 follow-up: @JdbcTypeCode(SqlTypes.JSON) + String
        //  필드의 round-trip 검증. 만약 round-trip 실패 시 entity 필드 타입을
        //  Map<String,Object> 로 전환 + service/dto 매핑 갱신 필요.)
        String vj = jdbc.queryForObject(
            "SELECT validation_json::text FROM cover_letter_variant WHERE id = ?", String.class, vid
        );
        JsonNode node = om.readTree(vj);
        assertThat(node.get("matchCount").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(node.get("matchOk").asBoolean()).isTrue();
        // round-trip 확인: GET endpoint 의 validationJson 도 동일 JSON 구조
        MvcResult getResult = mockMvc.perform(get("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andReturn();
        String responseVj = om.readTree(getResult.getResponse().getContentAsString())
            .get("validationJson").asText();
        JsonNode responseNode = om.readTree(responseVj);
        assertThat(responseNode.get("matchCount").asInt()).isEqualTo(node.get("matchCount").asInt());
    }

    @Test
    void patch_status_to_COMPLETED_returns_completed() throws Exception {
        long vid = createVariant();
        String body = om.writeValueAsString(Map.of("status", "COMPLETED"));
        mockMvc.perform(patch("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void get_grouped_returns_by_posting_with_recent_first() throws Exception {
        // posting 두 개 생성
        JobPosting p2 = JobPosting.create(
            userId, JobPosting.Source.MANUAL,
            "(주)다른회사", "프론트엔드", "프론트",
            "React", "Next.js 우대", "UI 구현",
            LocalDate.of(2026, 7, 31), null,
            new String[]{"React", "Next.js"},
            Instant.now()
        );
        Long postingId2 = postingRepo.save(p2).getId();

        // 첫 posting 의 variant
        long v1 = createVariant();
        // 두번째 posting 의 variant (더 최근 — postingId2 그룹이 앞에 와야)
        Thread.sleep(10);
        String body = om.writeValueAsString(Map.of(
            "postingId", postingId2,
            "itemType", "MOTIVATION",
            "question", "Q",
            "charLimit", 500
        ));
        MvcResult r = mockMvc.perform(post("/api/v1/cover-letter-variants")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn();

        mockMvc.perform(get("/api/v1/cover-letter-variants/grouped")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            // 첫번째 그룹이 최근 작성된 posting2
            .andExpect(jsonPath("$[0].posting.id").value(postingId2.intValue()))
            .andExpect(jsonPath("$[1].posting.id").value(postingId.intValue()));
    }

    @Test
    void validate_returns_keyword_match_stats() throws Exception {
        long vid = createVariant();
        // userEdit 갱신 — 키워드 4개 포함되도록
        String patch = om.writeValueAsString(Map.of(
            "userEdit", "Spring Boot · MSA · Kafka · PostgreSQL 다 다뤄봤습니다."
        ));
        mockMvc.perform(patch("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(patch));

        mockMvc.perform(get("/api/v1/cover-letter-variants/" + vid + "/validation")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.matchCount").value(4))
            .andExpect(jsonPath("$.matchOk").value(true));
    }

    @Test
    void delete_variant_returns_204_and_404_on_subsequent_get() throws Exception {
        long vid = createVariant();
        mockMvc.perform(delete("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void cross_user_protection_returns_404() throws Exception {
        long vid = createVariant();
        // 다른 사용자로 signup + login
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

        mockMvc.perform(get("/api/v1/cover-letter-variants/" + vid)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound());
    }

    private long createVariant() throws Exception {
        String body = om.writeValueAsString(Map.of(
            "postingId", postingId,
            "itemType", "MOTIVATION",
            "question", "Q",
            "charLimit", 500
        ));
        MvcResult r = mockMvc.perform(post("/api/v1/cover-letter-variants")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }
}
