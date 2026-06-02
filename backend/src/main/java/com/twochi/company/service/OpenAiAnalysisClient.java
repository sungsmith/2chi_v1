package com.twochi.company.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.common.ai.AbstractOpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAiAnalysisClient extends AbstractOpenAiClient implements AnalysisAiClient {

    public OpenAiAnalysisClient(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected String missingKeyWarning() {
        return "OPENAI_API_KEY 미설정 — 기업분석 생성 요청은 503 으로 실패합니다. (앱 기동은 정상)";
    }

    @Override
    public Result generate(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 1500,
            "temperature", 0.5,
            "response_format", Map.of("type", "json_object"),
            "messages", List.of(
                Map.of("role", "system",
                       "content", "너는 한국어 기업분석 전문가야. 인재상 키워드와 자소서·면접 활용 포인트를 JSON 으로만 반환해."),
                Map.of("role", "user", "content", prompt)
            )
        );

        String responseBody = chatCompletion(requestBody);

        try {
            var root = parseResponse(responseBody);
            String text = extractContent(root);
            int tokensUsed = extractTotalTokens(root);
            return new Result(text, model, tokensUsed);
        } catch (Exception e) {
            log.warn("OpenAI 응답 파싱 실패: {}", responseBody);
            throw new RuntimeException("AI 응답 파싱 실패", e);
        }
    }
}
