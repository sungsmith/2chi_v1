package com.twochi.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.domain.ConsentLog;
import com.twochi.consent.domain.ConsentType;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class SignupIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;

    private Map<String, Object> validBody;

    @BeforeEach
    void setUp() {
        validBody = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
    }

    @Test
    void signup_success_createsUserAndConsents() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(validBody)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").isNumber())
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.nickname").value("alice"));

        List<User> users = userRepository.findAll();
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getPasswordHash()).startsWith("$2");

        List<ConsentLog> consents = consentLogRepository.findAll();
        assertThat(consents).hasSize(3);
        assertThat(consents).extracting(ConsentLog::getConsentType)
            .containsExactlyInAnyOrder(ConsentType.TERMS, ConsentType.PRIVACY, ConsentType.MARKETING);
    }

    @Test
    void signup_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(validBody)))
            .andExpect(status().isCreated());

        Map<String, Object> dup = Map.of(
            "email", "alice@example.com",
            "password", "Other1234!",
            "nickname", "bob",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(dup)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("EMAIL_DUPLICATE"));
    }

    @Test
    void signup_duplicateNickname_returns409() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(validBody)))
            .andExpect(status().isCreated());

        Map<String, Object> dup = Map.of(
            "email", "bob@example.com",
            "password", "Other1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(dup)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("NICKNAME_DUPLICATE"));
    }

    // v1 클로즈드 베타: 비밀번호 정책 완화로 아래 두 테스트는 비활성화.
    // 서비스 출시 시 SignupRequest 의 @Size/@Pattern 주석 해제와 함께 활성화.
    //
    // @Test
    // void signup_passwordTooShort_returns400() throws Exception {
    //     Map<String, Object> body = withOverride("password", "Pa1!");
    //     mockMvc.perform(post("/api/v1/auth/signup")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(om.writeValueAsString(body)))
    //         .andExpect(status().isBadRequest())
    //         .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
    //         .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists());
    // }
    //
    // @Test
    // void signup_passwordOneCharType_returns400() throws Exception {
    //     Map<String, Object> body = withOverride("password", "abcdefgh");
    //     mockMvc.perform(post("/api/v1/auth/signup")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(om.writeValueAsString(body)))
    //         .andExpect(status().isBadRequest())
    //         .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists());
    // }

    @Test
    void signup_invalidEmail_returns400() throws Exception {
        Map<String, Object> body = withOverride("email", "not-an-email");
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists());
    }

    @Test
    void signup_invalidNickname_returns400() throws Exception {
        Map<String, Object> body = withOverride("nickname", "alice!!");
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field=='nickname')]").exists());
    }

    @Test
    void signup_ageNotConfirmed_returns422() throws Exception {
        Map<String, Object> body = withOverride("ageConfirmed", false);
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("AGE_NOT_CONFIRMED"));
    }

    @Test
    void signup_termsMissing_returns422() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", false, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("REQUIRED_CONSENT_MISSING"));
    }

    @Test
    void signup_privacyMissing_returns422() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", false, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("REQUIRED_CONSENT_MISSING"));
    }

    private Map<String, Object> withOverride(String key, Object value) {
        java.util.Map<String, Object> m = new java.util.HashMap<>(validBody);
        m.put(key, value);
        return m;
    }
}
