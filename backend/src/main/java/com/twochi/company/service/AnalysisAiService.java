package com.twochi.company.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.career.domain.Career;
import com.twochi.career.repository.CareerRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisAiService {

    private final AnalysisAiClient client;
    private final CareerRepository careerRepository;
    private final ObjectMapper objectMapper;

    public Result generate(
        Long userId, String company, DartFacts dart, List<String> scrapedTexts
    ) {
        List<Career> careers = careerRepository.findAllByUserIdOrderByOrderIndexDesc(userId);
        String prompt = buildPrompt(company, dart, scrapedTexts, careers);
        try {
            AnalysisAiClient.Result aiResult = client.generate(prompt);
            Parsed parsed = parse(aiResult.text());
            return new Result(parsed.talentProfile(), parsed.actionPoints(), aiResult.model(), aiResult.tokensUsed());
        } catch (Exception e) {
            log.warn("기업분석 AI 생성 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.ANALYSIS_GENERATION_FAILED);
        }
    }

    private String buildPrompt(String company, DartFacts dart, List<String> scrapedTexts, List<Career> careers) {
        String scrapedBlock = scrapedTexts == null || scrapedTexts.isEmpty()
            ? "(URL 입력 없음)"
            : scrapedTexts.stream()
                .filter(s -> s != null && !s.isBlank())
                .reduce((a, b) -> a + "\n---\n" + b)
                .orElse("(URL 입력 없음)");

        String careerBlock = careers.isEmpty()
            ? "(등록된 경력 없음)"
            : careers.stream()
                .map(c -> "- %s (%s ~ %s) %s".formatted(
                    c.getCompany(),
                    c.getStartDate(),
                    c.getEndDate() == null ? "현재" : c.getEndDate().toString(),
                    c.getPosition() == null ? "" : c.getPosition()
                ))
                .collect(Collectors.joining("\n"));

        String productsBlock = dart.mainProducts() == null || dart.mainProducts().isEmpty()
            ? "(미상)"
            : String.join(", ", dart.mainProducts());

        return """
            [회사명] %s

            [DART 공시 요약]
            - 사업 영역: %s
            - 주요 제품: %s
            - 매출: %s
            - 임직원: %s
            - 소재: %s

            [회사 홈페이지 스크랩 본문]
            %s

            [지원자 경력]
            %s

            다음 JSON 으로 정확히 반환 (다른 텍스트·코드블록·설명 금지):
            {
              "talent_profile": ["키워드1", "키워드2", ...],
              "action_points": ["문장1", "문장2", ...]
            }

            규칙:
            1. talent_profile: 회사 홈페이지 본문에서 추출한 인재상·핵심 가치 키워드 5~7개 (간결한 명사형). URL 입력 없으면 빈 배열.
            2. action_points: DART + 홈페이지 + 사용자 경력을 묶어서 자소서·면접에 활용할 구체 추천 3~4개. 각 1~2문장. 1인칭, 해요체. 회사 특이성·정량 지표 강조.
            3. JSON 외 출력 금지. 코드블록(```) 금지.
            """.formatted(
                company,
                safe(dart.businessArea()),
                productsBlock,
                safe(dart.revenue()),
                dart.employees() == null ? "(미상)" : dart.employees() + "명",
                safe(dart.location()),
                scrapedBlock,
                careerBlock
            );
    }

    private Parsed parse(String text) throws Exception {
        // ```json ... ``` 트림
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNl = trimmed.indexOf('\n');
            if (firstNl > 0) trimmed = trimmed.substring(firstNl + 1);
            if (trimmed.endsWith("```")) trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }
        JsonNode root = objectMapper.readTree(trimmed);
        List<String> talent = readStringArray(root.path("talent_profile"));
        List<String> actions = readStringArray(root.path("action_points"));
        return new Parsed(talent, actions);
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode n : node) {
                if (n.isTextual() && !n.asText().isBlank()) out.add(n.asText().trim());
            }
        }
        return out;
    }

    private static String safe(String s) { return s == null || s.isBlank() ? "(미상)" : s; }

    public record Result(
        List<String> talentProfile,
        List<String> actionPoints,
        String model,
        Integer tokensUsed
    ) {}

    private record Parsed(List<String> talentProfile, List<String> actionPoints) {}
}
