package com.twochi.coverletter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.coverletter.repository.CoverLetterMasterRepository;
import com.twochi.coverletter.service.MasterAnswerEncryptor;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class CoverLetterMasterIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CoverLetterMasterRepository masterRepository;
    @Autowired private MasterAnswerEncryptor encryptor;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        masterRepository.deleteAll();
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
        masterRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    private long createMaster(String itemType, String title, String answer, boolean isDefault) throws Exception {
        String body = om.writeValueAsString(Map.of(
            "itemType", itemType,
            "title", title,
            "masterAnswer", answer,
            "isDefault", isDefault
        ));
        MvcResult r = mockMvc.perform(post("/api/v1/cover-letters/masters")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void create_default_true_first_master_succeeds() throws Exception {
        String body = om.writeValueAsString(Map.of(
            "itemType", "MOTIVATION",
            "title", "지원동기 A형",
            "masterAnswer", "저는 백엔드 개발자로서 성장하고 싶습니다.",
            "isDefault", true
        ));
        mockMvc.perform(post("/api/v1/cover-letters/masters")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.itemType").value("MOTIVATION"))
            .andExpect(jsonPath("$.title").value("지원동기 A형"))
            .andExpect(jsonPath("$.masterAnswer").value("저는 백엔드 개발자로서 성장하고 싶습니다."))
            .andExpect(jsonPath("$.isDefault").value(true));
    }

    @Test
    void create_default_true_second_master_unsetsOldDefault() throws Exception {
        long aId = createMaster("MOTIVATION", "A형", "답변 A", true);
        long bId = createMaster("MOTIVATION", "B형", "답변 B", true);

        mockMvc.perform(get("/api/v1/cover-letters/masters/" + aId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.isDefault").value(false));
        mockMvc.perform(get("/api/v1/cover-letters/masters/" + bId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.isDefault").value(true));
    }

    @Test
    void master_answer_is_encrypted_in_db() throws Exception {
        long id = createMaster("MOTIVATION", "A형", "평문 답변입니다", true);

        String raw = jdbc.queryForObject(
            "SELECT master_answer FROM cover_letter_master WHERE id = ?",
            String.class, id
        );
        assertThat(raw).isNotNull();
        assertThat(raw).isNotEqualTo("평문 답변입니다");
        assertThat(encryptor.decrypt(raw)).isEqualTo("평문 답변입니다");

        mockMvc.perform(get("/api/v1/cover-letters/masters/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.masterAnswer").value("평문 답변입니다"));
    }

    @Test
    void patch_isDefault_true_unsets_other_default() throws Exception {
        long aId = createMaster("TEAMWORK", "A", "답변 A", true);
        long bId = createMaster("TEAMWORK", "B", "답변 B", false);

        String patch = om.writeValueAsString(Map.of("isDefault", true));
        mockMvc.perform(patch("/api/v1/cover-letters/masters/" + bId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(patch))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isDefault").value(true));

        mockMvc.perform(get("/api/v1/cover-letters/masters/" + aId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.isDefault").value(false));
    }

    @Test
    void copy_creates_new_row_with_suffix_and_not_default() throws Exception {
        long srcId = createMaster("STRENGTH", "강점", "원본 답변", true);

        MvcResult r = mockMvc.perform(post("/api/v1/cover-letters/masters/" + srcId + "/copy")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("강점 사본"))
            .andExpect(jsonPath("$.isDefault").value(false))
            .andExpect(jsonPath("$.masterAnswer").value("원본 답변"))
            .andReturn();
        long copyId = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        assertThat(copyId).isNotEqualTo(srcId);
    }

    @Test
    void delete_default_promotes_next_recent() throws Exception {
        long aId = createMaster("FUTURE_PLAN", "A", "답변 A", true);
        long bId = createMaster("FUTURE_PLAN", "B", "답변 B", false);

        mockMvc.perform(delete("/api/v1/cover-letters/masters/" + aId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.newDefaultId").value((int) bId));

        mockMvc.perform(get("/api/v1/cover-letters/masters/" + bId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.isDefault").value(true));
    }
}
