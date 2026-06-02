package com.twochi.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
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

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class ProfilePiiEncryptionIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();

        // 1. 회원가입
        Map<String, Object> signup = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(signup)))
            .andExpect(status().isCreated());

        // 2. 로그인
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andExpect(status().isOk())
            .andReturn();
        accessToken = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        // 3. 온보딩 완료 → Profile 행 생성
        Map<String, Object> onboarding = Map.of(
            "target", "JOB_CHANGE",
            "careerYear", 2,
            "targetJobs", List.of("BACKEND")
        );
        mockMvc.perform(post("/api/v1/onboarding")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(onboarding)))
            .andExpect(status().isOk());
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void name_and_phone_are_encrypted_at_rest_and_decrypted_on_read() throws Exception {
        // PATCH → name/phone 저장
        Map<String, Object> req = Map.of(
            "name", "홍길동",
            "birthDate", "1998-03-01",
            "phone", "010-1234-5678",
            "region", "서울",
            "introduction", "백엔드 지망"
        );
        mockMvc.perform(patch("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk());

        // DB 원문 확인: 암호문이어야 함 (평문과 달라야 함)
        Long userId = userRepository.findAll().get(0).getId();
        Map<String, Object> raw = jdbc.queryForMap(
            "SELECT name, phone FROM profile WHERE user_id = ?", userId
        );

        String rawName  = (String) raw.get("name");
        String rawPhone = (String) raw.get("phone");

        assertThat(rawName).isNotBlank();
        assertThat(rawName).isNotEqualTo("홍길동");

        assertThat(rawPhone).isNotBlank();
        assertThat(rawPhone).isNotEqualTo("010-1234-5678");

        // GET → 복호화된 평문이 반환되어야 함
        mockMvc.perform(get("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("홍길동"))
            .andExpect(jsonPath("$.phone").value("010-1234-5678"));
    }
}
