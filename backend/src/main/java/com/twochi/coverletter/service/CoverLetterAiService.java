package com.twochi.coverletter.service;

import com.twochi.career.domain.Career;
import com.twochi.career.repository.CareerRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.posting.domain.JobPosting;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoverLetterAiService {

    private final CoverLetterAiClient client;
    private final CareerRepository careerRepository;

    public Draft generateDraft(
        Long userId, JobPosting posting, ItemType itemType,
        String question, Integer charLimit, String userRequest
    ) {
        List<Career> careers = careerRepository.findAllByUserIdOrderByOrderIndexDesc(userId);
        String prompt = buildPrompt(posting, itemType, question, charLimit, userRequest, careers);
        try {
            CoverLetterAiClient.Result r = client.generate(prompt);
            return new Draft(r.text().trim(), r.model(), r.tokensUsed());
        } catch (Exception e) {
            log.warn("AI 초안 생성 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_DRAFT_FAILED);
        }
    }

    private String buildPrompt(
        JobPosting p, ItemType itemType, String question, Integer charLimit,
        String userRequest, List<Career> careers
    ) {
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

        String keywordsBlock = (p.getKeywords() == null || p.getKeywords().length == 0)
            ? "(추출된 키워드 없음)"
            : String.join(", ", p.getKeywords());

        String descBlock = "주요 업무: %s\n자격 요건: %s\n우대 사항: %s".formatted(
            safe(p.getMainTasks()), safe(p.getRequirements()), safe(p.getPreferred())
        );
        if (descBlock.length() > 1500) descBlock = descBlock.substring(0, 1500) + "...";

        return """
            [항목]
            %s — "%s"

            [글자수 제한]
            %d자 이내 (±5%% 허용)

            [지원자 경력]
            %s

            [채용공고]
            - 회사: %s
            - 직군: %s
            - 추출 키워드: %s
            %s

            [사용자 요청사항]
            %s

            [작성 규칙]
            1. PRAR (Problem-Result-Action-Result) 구조로 1~3 문단.
            2. 정량 수치 활용. 추출 키워드 중 3개 이상 자연스럽게 포함.
            3. 회사명·제품명을 정확히 사용.
            4. 1인칭, 해요체.
            5. 글자수 제한 ±5%% 이내 (한국어 공백 포함).
            """.formatted(
                itemTypeLabel(itemType), question,
                charLimit,
                careerBlock,
                p.getCompany(),
                p.getJobRole() == null ? "(미상)" : p.getJobRole(),
                keywordsBlock,
                descBlock,
                userRequest == null || userRequest.isBlank() ? "(없음)" : userRequest
            );
    }

    private static String itemTypeLabel(ItemType t) {
        return switch (t) {
            case MOTIVATION -> "지원동기";
            case FUTURE_PLAN -> "입사 후 포부";
            case TEAMWORK -> "협업 경험";
            case CONFLICT -> "갈등 해결";
            case ACHIEVEMENT -> "성취 경험";
            case PROBLEM_SOLVING -> "문제 해결";
            case STRENGTH -> "본인의 강점";
            case WEAKNESS -> "본인의 약점";
            case OTHER -> "기타";
        };
    }

    private static String safe(String s) { return s == null ? "" : s; }

    public record Draft(String text, String model, Integer tokensUsed) {}
}
