package com.twochi.common.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
public abstract class AbstractOpenAiClient {

    @Value("${openai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    protected String model;

    private RestClient client;

    protected final ObjectMapper objectMapper;

    protected AbstractOpenAiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("{}", missingKeyWarning());
            return;
        }
        this.client = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    protected abstract String missingKeyWarning();

    protected boolean hasClient() {
        return client != null;
    }

    protected RestClient requireClient() {
        if (client == null) {
            throw new IllegalStateException("OPENAI_API_KEY 미설정 — AI 기능 불가");
        }
        return client;
    }

    protected String chatCompletion(Map<String, Object> requestBody) {
        return requireClient().post()
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(String.class);
    }

    protected JsonNode parseResponse(String responseBody) throws Exception {
        return objectMapper.readTree(responseBody);
    }

    protected String extractContent(JsonNode root) {
        return root.path("choices").get(0).path("message").path("content").asText();
    }

    protected int extractTotalTokens(JsonNode root) {
        return root.path("usage").path("total_tokens").asInt(0);
    }
}
