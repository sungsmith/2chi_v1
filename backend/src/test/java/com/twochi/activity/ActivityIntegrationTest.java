package com.twochi.activity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.posting.keyword.KeywordExtractor;
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

import static org.awaitility.Awaitility.await;
import static java.time.Duration.ofSeconds;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class ActivityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @MockBean private KeywordExtractor keywordExtractor;

    private String token;
    private Long postingId;

    @BeforeEach
    void setUp() throws Exception {
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of());
        redis.getConnection().serverCommands().flushDb();

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "act@example.com", "password", "Pass1234!", "nickname", "act",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "act@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        MvcResult cp = mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "네이버", "title", "백엔드", "jobRole", "백엔드")))).andReturn();
        postingId = om.readTree(cp.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void 빈_상태_200_빈_목록() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/activities")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("activities")).isNotNull();
        assertThat(body.get("counts").get("STAGE").asInt()).isEqualTo(0);
        assertThat(body.get("counts").get("APPLICATION").asInt()).isEqualTo(0);
        assertThat(body.get("page").asInt()).isEqualTo(0);
        assertThat(body.get("size").asInt()).isEqualTo(30);
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/activities")).andExpect(status().isUnauthorized());
    }

    @Test
    void category_파라미터_파싱() throws Exception {
        mockMvc.perform(get("/api/v1/activities?category=STAGE")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    }
}
