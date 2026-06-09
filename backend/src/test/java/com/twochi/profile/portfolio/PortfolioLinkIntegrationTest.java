package com.twochi.profile.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.portfolio.repository.PortfolioLinkRepository;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PortfolioLinkIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private PortfolioLinkRepository portfolioLinkRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;

    private String token;

    private void clean() {
        portfolioLinkRepository.deleteAllInBatch();
        profileRepository.deleteAllInBatch();
        consentLogRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        redis.getConnection().serverCommands().flushDb();
    }

    @AfterEach
    void tearDown() { clean(); }

    @BeforeEach
    void setUp() throws Exception {
        clean();
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "pf@example.com", "password", "Pass1234!", "nickname", "pf",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "pf@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private Long createLink(String kind, String title, String url) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", kind, "title", title, "url", url))))
            .andExpect(status().isCreated()).andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void 생성_후_목록_조회() throws Exception {
        createLink("GITHUB", "내 깃허브", "https://github.com/somi");
        createLink("BLOG", "기술 블로그", "https://somi.dev");
        MvcResult r = mockMvc.perform(get("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("links")).hasSize(2);
        assertThat(body.get("links").get(0).get("kind").asText()).isEqualTo("GITHUB");
        assertThat(body.get("links").get(0).get("orderIndex").asInt()).isEqualTo(0);
        assertThat(body.get("links").get(1).get("orderIndex").asInt()).isEqualTo(1);
    }

    @Test
    void 수정() throws Exception {
        Long id = createLink("GITHUB", "old", "https://github.com/old");
        mockMvc.perform(put("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "NOTION", "title", "new", "url", "https://notion.so/x"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.kind").value("NOTION"))
            .andExpect(jsonPath("$.title").value("new"));
    }

    @Test
    void 삭제() throws Exception {
        Long id = createLink("OTHER", "x", "https://x.com");
        mockMvc.perform(delete("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        MvcResult r = mockMvc.perform(get("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token)).andReturn();
        assertThat(om.readTree(r.getResponse().getContentAsString()).get("links")).isEmpty();
    }

    @Test
    void cross_user_수정_404() throws Exception {
        Long id = createLink("GITHUB", "mine", "https://github.com/mine");
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "bob@example.com", "password", "Pass1234!", "nickname", "bob",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult bobLogin = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!")))).andReturn();
        String bob = om.readTree(bobLogin.getResponse().getContentAsString()).get("accessToken").asText();
        mockMvc.perform(put("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + bob).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "hack", "url", "https://github.com/hack"))))
            .andExpect(status().isNotFound());
    }

    @Test
    void 검증_실패_400() throws Exception {
        mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "", "url", "https://github.com/x"))))
            .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "x", "url", "ftp://x"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/portfolio-links")).andExpect(status().isUnauthorized());
    }
}
