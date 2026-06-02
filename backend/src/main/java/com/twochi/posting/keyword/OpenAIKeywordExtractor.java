package com.twochi.posting.keyword;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.common.ai.AbstractOpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAIKeywordExtractor extends AbstractOpenAiClient implements KeywordExtractor {

    public OpenAIKeywordExtractor(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected String missingKeyWarning() {
        return "OPENAI_API_KEY 미설정 — 공고 키워드 추출은 생략됩니다 (빈 키워드로 진행). (앱 기동은 정상)";
    }

    @Override
    public List<String> extract(String mainTasks, String requirements, String preferred) {
        if (!hasClient()) {
            log.debug("OPENAI_API_KEY 미설정 — 공고 키워드 추출 건너뜀 (빈 키워드로 진행)");
            return List.of();
        }
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
            String responseBody = chatCompletion(requestBody);
            return parseKeywords(responseBody);
        } catch (Exception e) {
            log.warn("LLM 키워드 추출 실패 — 빈 배열로 폴백 ({})", e.getMessage());
            return List.of();
        }
    }

    private List<String> parseKeywords(String responseBody) {
        try {
            // OpenAI chat completions: choices[0].message.content
            String text = extractContent(parseResponse(responseBody));
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
