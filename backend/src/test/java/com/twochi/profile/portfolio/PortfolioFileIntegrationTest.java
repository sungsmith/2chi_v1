package com.twochi.profile.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.portfolio.repository.PortfolioFileRepository;
import com.twochi.profile.portfolio.storage.FileStorage;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PortfolioFileIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private PortfolioFileRepository fileRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;
    @MockBean private FileStorage fileStorage;

    private String token;

    private void clean() {
        fileRepository.deleteAllInBatch();
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

    private MockMultipartFile pdf(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/pdf", bytes);
    }

    @Test
    void 업로드_후_목록() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("이력서.pdf", "hello".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("filename").asText()).isEqualTo("이력서.pdf");
        assertThat(body.get("contentType").asText()).isEqualTo("application/pdf");
        verify(fileStorage).put(anyString(), any(), anyLong(), eq("application/pdf"));

        MvcResult list = mockMvc.perform(get("/api/v1/me/portfolio-files")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(list.getResponse().getContentAsString()).get("files")).hasSize(1);
    }

    @Test
    void 타입_불가_400() throws Exception {
        mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(new MockMultipartFile("file", "a.txt", "text/plain", "x".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 개수_초과_409() throws Exception {
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                    .file(pdf("f" + i + ".pdf", "x".getBytes()))
                    .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
        }
        mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("over.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isConflict());
    }

    @Test
    void 다운로드_presigned_url() throws Exception {
        when(fileStorage.presignedGetUrl(anyString(), anyString())).thenReturn("http://localhost:9000/portfolio/x?sig=abc");
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        MvcResult d = mockMvc.perform(get("/api/v1/me/portfolio-files/" + id + "/download")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(d.getResponse().getContentAsString()).get("url").asText()).contains("sig=abc");
    }

    @Test
    void 삭제_204_및_storage_remove() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(delete("/api/v1/me/portfolio-files/" + id)
            .header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        verify(fileStorage).remove(anyString());
    }

    @Test
    void cross_user_다운로드_404() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "bob@example.com", "password", "Pass1234!", "nickname", "bob",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult bl = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!")))).andReturn();
        String bob = om.readTree(bl.getResponse().getContentAsString()).get("accessToken").asText();
        mockMvc.perform(get("/api/v1/me/portfolio-files/" + id + "/download")
            .header("Authorization", "Bearer " + bob)).andExpect(status().isNotFound());
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/portfolio-files")).andExpect(status().isUnauthorized());
    }
}
