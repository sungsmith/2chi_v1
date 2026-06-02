package com.twochi.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.certificate.repository.CertificateRepository;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class CertificateIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private com.twochi.user.repository.ProfileRepository profileRepository;
    @Autowired private CertificateRepository certificateRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        certificateRepository.deleteAll();
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
        certificateRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void create_returns_201_and_persists() throws Exception {
        Map<String, Object> req = Map.of(
            "name", "정보처리기사",
            "issuer", "한국산업인력공단",
            "acquiredAt", "2024-05-01",
            "score", "합격"
        );
        mockMvc.perform(post("/api/v1/me/certificates")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.name").value("정보처리기사"))
            .andExpect(jsonPath("$.issuer").value("한국산업인력공단"))
            .andExpect(jsonPath("$.score").value("합격"))
            .andExpect(jsonPath("$.orderIndex").value(0));

        assertThat(certificateRepository.count()).isEqualTo(1);
    }

    @Test
    void list_returns_orderIndex_asc() throws Exception {
        createSampleCertificate("정보처리기사", "한국산업인력공단");
        createSampleCertificate("SQLD", "한국데이터산업진흥원");

        mockMvc.perform(get("/api/v1/me/certificates")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.certificates").isArray())
            .andExpect(jsonPath("$.certificates.length()").value(2))
            .andExpect(jsonPath("$.certificates[0].orderIndex").value(0))
            .andExpect(jsonPath("$.certificates[1].orderIndex").value(1));
    }

    @Test
    void update_changes_fields() throws Exception {
        Long id = createSampleCertificate("정보처리기사", "한국산업인력공단");

        Map<String, Object> req = Map.of(
            "name", "정보보안기사",
            "issuer", "한국인터넷진흥원",
            "score", "1급"
        );
        mockMvc.perform(put("/api/v1/me/certificates/" + id)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("정보보안기사"))
            .andExpect(jsonPath("$.issuer").value("한국인터넷진흥원"))
            .andExpect(jsonPath("$.score").value("1급"));
    }

    @Test
    void delete_returns_204() throws Exception {
        Long id = createSampleCertificate("정보처리기사", "한국산업인력공단");

        mockMvc.perform(delete("/api/v1/me/certificates/" + id)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me/certificates")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(jsonPath("$.certificates.length()").value(0));
    }

    @Test
    void cross_user_404() throws Exception {
        Long aliceId = createSampleCertificate("정보처리기사", "한국산업인력공단");

        String bobToken = signupAndLogin("bob@example.com", "bob");

        Map<String, Object> req = Map.of(
            "name", "hijack"
        );

        mockMvc.perform(put("/api/v1/me/certificates/" + aliceId)
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CERTIFICATE_NOT_FOUND"));

        mockMvc.perform(delete("/api/v1/me/certificates/" + aliceId)
                .header("Authorization", "Bearer " + bobToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CERTIFICATE_NOT_FOUND"));
    }

    // ----- helpers -----

    private Long createSampleCertificate(String name, String issuer) throws Exception {
        Map<String, Object> req = Map.of(
            "name", name,
            "issuer", issuer
        );
        MvcResult result = mockMvc.perform(post("/api/v1/me/certificates")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andReturn();
        return om.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String signupAndLogin(String email, String nickname) throws Exception {
        Map<String, Object> signup = Map.of(
            "email", email,
            "password", "Pass1234!",
            "nickname", nickname,
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", "Pass1234!"))))
            .andReturn();
        return om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
