package com.twochi.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
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
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));
        notificationRepository.deleteAll(); // 가입 환영 알림 제거 — 각 테스트가 직접 삽입하는 것만 검증

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        JsonNode body = om.readTree(login.getResponse().getContentAsString());
        accessToken = body.get("accessToken").asText();
        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void getNotifications_returnsRecentItemsDesc() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.forInbox(userId, NotificationType.POSTING_DEADLINE_D3, "최신", null, now.minus(Duration.ofHours(1))));
        notificationRepository.save(Notification.forInbox(userId, NotificationType.SCHEDULE_D1,         "오래된", null, now.minus(Duration.ofHours(10))));

        mockMvc.perform(get("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notifications.length()").value(2))
            .andExpect(jsonPath("$.notifications[0].title").value("최신"))
            .andExpect(jsonPath("$.notifications[0].type").value("POSTING_DEADLINE_D3"))
            .andExpect(jsonPath("$.notifications[1].title").value("오래된"));
    }

    @Test
    void getNotifications_filtersOut30DaysAgo() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "최근", null, now.minus(Duration.ofDays(5))));
        notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "오래", null, now.minus(Duration.ofDays(31))));

        mockMvc.perform(get("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].title").value("최근"));
    }

    @Test
    void getNotifications_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void markAllRead_setsReadAt() throws Exception {
        Instant now = Instant.now();
        Notification a = notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "a", null, now));
        Notification b = notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "b", null, now));

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        assertThat(notificationRepository.findById(a.getId()).orElseThrow().getReadAt()).isNotNull();
        assertThat(notificationRepository.findById(b.getId()).orElseThrow().getReadAt()).isNotNull();
    }

    @Test
    void deleteAll_removesAllInboxForUser() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "a", null, now));
        notificationRepository.save(Notification.forInbox(userId, NotificationType.WEEKLY_SUMMARY, "b", null, now));

        mockMvc.perform(delete("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        Instant cutoff = now.minus(Duration.ofDays(30));
        assertThat(notificationRepository.findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(userId, NotificationChannel.INBOX, cutoff)).isEmpty();
    }
}
