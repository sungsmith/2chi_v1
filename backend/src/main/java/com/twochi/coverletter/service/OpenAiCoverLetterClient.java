package com.twochi.coverletter.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiCoverLetterClient implements CoverLetterAiClient {

    @Value("${openai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final ObjectMapper objectMapper;
    private RestClient client;

    @PostConstruct
    void init() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "OPENAI_API_KEY 환경변수가 설정되지 않았어요."
            );
        }
        this.client = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public Result generate(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 1500,
            "temperature", 0.7,
            "messages", List.of(
                Map.of("role", "system",
                       "content", "너는 한국어 자소서 작성 전문가야. PRAR 구조로 자연스럽고 구체적으로 작성해."),
                Map.of("role", "user", "content", prompt)
            )
        );

        String responseBody = client.post()
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.path("choices").get(0).path("message").path("content").asText();
            Integer tokensUsed = root.path("usage").path("total_tokens").asInt(0);
            return new Result(text, model, tokensUsed);
        } catch (Exception e) {
            log.warn("OpenAI 응답 파싱 실패: {}", responseBody);
            throw new RuntimeException("AI 응답 파싱 실패", e);
        }
    }
}
