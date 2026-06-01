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
class ProfileBasicInfoIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
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

        // 3. 온보딩 완료 → Profile 행 생성 (signup은 Profile 행을 생성하지 않음)
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
    void patch_updates_basic_info() throws Exception {
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
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("홍길동"))
            .andExpect(jsonPath("$.birthDate").value("1998-03-01"))
            .andExpect(jsonPath("$.phone").value("010-1234-5678"))
            .andExpect(jsonPath("$.region").value("서울"))
            .andExpect(jsonPath("$.introduction").value("백엔드 지망"));

        // GET으로도 반영 확인
        mockMvc.perform(get("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("홍길동"))
            .andExpect(jsonPath("$.birthDate").value("1998-03-01"))
            .andExpect(jsonPath("$.phone").value("010-1234-5678"))
            .andExpect(jsonPath("$.region").value("서울"))
            .andExpect(jsonPath("$.introduction").value("백엔드 지망"));

        // DB에도 반영 확인
        var profiles = profileRepository.findAll();
        assertThat(profiles).hasSize(1);
        assertThat(profiles.get(0).getName()).isEqualTo("홍길동");
        assertThat(profiles.get(0).getPhone()).isEqualTo("010-1234-5678");
    }

    @Test
    void get_returns_profile() throws Exception {
        mockMvc.perform(get("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.target").value("JOB_CHANGE"))
            .andExpect(jsonPath("$.careerYear").value(2))
            .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    void unauthenticated_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/profile"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void get_without_profile_returns_404() throws Exception {
        // 온보딩 없이 가입만 한 유저는 Profile 행이 없으므로 404
        Map<String, Object> signupReq = Map.of(
            "email", "bob@example.com",
            "password", "Pass1234!",
            "nickname", "bob",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(signupReq)))
            .andExpect(status().isCreated());

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!"))))
            .andExpect(status().isOk())
            .andReturn();
        String bobToken = om.readTree(loginRes.getResponse().getContentAsString()).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/me/profile")
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PROFILE_NOT_FOUND"));
    }

    @Test
    void patch_partial_preserves_omitted_fields() throws Exception {
        // 먼저 전체 필드 채우기
        Map<String, Object> full = Map.of(
            "name", "홍길동",
            "birthDate", "1998-03-01",
            "phone", "010-1234-5678",
            "region", "서울",
            "introduction", "백엔드 지망"
        );
        mockMvc.perform(patch("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(full)))
            .andExpect(status().isOk());

        // name 만 변경 — 나머지 필드는 유지돼야 함
        Map<String, Object> partial = Map.of("name", "김철수");
        mockMvc.perform(patch("/api/v1/me/profile")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(partial)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("김철수"))
            .andExpect(jsonPath("$.phone").value("010-1234-5678"))
            .andExpect(jsonPath("$.region").value("서울"))
            .andExpect(jsonPath("$.introduction").value("백엔드 지망"));
    }
}
