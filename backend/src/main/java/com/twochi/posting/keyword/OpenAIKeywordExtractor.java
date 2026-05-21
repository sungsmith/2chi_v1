package com.twochi.posting.keyword;

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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAIKeywordExtractor implements KeywordExtractor {

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
                "OPENAI_API_KEY 환경변수가 설정되지 않았어요. " +
                ".env 파일 또는 환경변수에 OPENAI_API_KEY=sk-... 추가하세요."
            );
        }
        this.client = RestClient.builder()
            // HTTP/1.1 강제: JDK HttpClient 기본 (HTTP/2) 가 api.openai.com 과
            // RST_STREAM 충돌 — SimpleClientHttpRequestFactory 는 HttpURLConnection
            // 기반 (HTTP/1.1) 이라 안정적.
            .requestFactory(new SimpleClientHttpRequestFactory())
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public List<String> extract(String mainTasks, String requirements, String preferred) {
        String userPrompt = """
            다음 채용공고에서 핵심 기술·키워드를 10개 이내로 추출하세요.
            결과는 JSON 배열만 반환하세요. 다른 텍스트·설명·코드블록 금지.
            예: ["Spring Boot", "MSA", "Kafka"]

            ---
            주요 업무: %s
            자격 요건: %s
            우대 사항: %s
            """.formatted(safe(mainTasks), safe(requirements), safe(preferred));

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 256,
            "temperature", 0.2,
            "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );

        try {
            String responseBody = client.post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);
            return parseKeywords(responseBody);
        } catch (Exception e) {
            log.warn("LLM 키워드 추출 실패 — 빈 배열로 폴백 ({})", e.getMessage());
            return List.of();
        }
    }

    private List<String> parseKeywords(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            // OpenAI chat completions: choices[0].message.content
            String text = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode arr = objectMapper.readTree(text);
            List<String> out = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode n : arr) {
                    if (n.isTextual() && !n.asText().isBlank()) out.add(n.asText().trim());
                }
            }
            return out;
        } catch (Exception e) {
            log.warn("LLM 응답 파싱 실패 — 빈 배열로 폴백: {}", responseBody);
            return List.of();
        }
    }

    private static String safe(String s) { return s == null ? "" : s; }
}
