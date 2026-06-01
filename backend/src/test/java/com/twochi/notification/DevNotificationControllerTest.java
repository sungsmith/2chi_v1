package com.twochi.notification;

import com.twochi.auth.jwt.JwtTokenProvider;
import com.twochi.config.SecurityConfig;
import com.twochi.notification.controller.DevNotificationController;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DevNotificationController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("dev")
class DevNotificationControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean NotificationGenerator generator;
    @MockitoBean NotificationService service;
    /** SecurityConfig -> JwtAuthenticationFilter 가 JwtTokenProvider 를 필요로 함. WebMvcTest 슬라이스에선 누락되므로 mock 제공. */
    @MockitoBean JwtTokenProvider jwtTokenProvider;

    @Test
    void run_cron_은_date_파라미터로_generator_와_cleanup_호출() throws Exception {
        mvc.perform(post("/api/v1/dev/notifications/run-cron").param("date", "2026-05-28"))
            .andExpect(status().isOk());

        verify(generator).runDaily(LocalDate.of(2026, 5, 28));
        verify(service).cleanup(any(java.time.Instant.class));
    }
}
