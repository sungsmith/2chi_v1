package com.twochi.coverletter.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.common.ai.AbstractOpenAiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAiCoverLetterClient extends AbstractOpenAiClient implements CoverLetterAiClient {

    public OpenAiCoverLetterClient(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected String missingKeyWarning() {
        return "OPENAI_API_KEY 미설정 — 자소서 AI 생성 요청은 실패합니다. (앱 기동은 정상)";
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
