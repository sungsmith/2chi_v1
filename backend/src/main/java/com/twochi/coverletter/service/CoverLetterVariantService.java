package com.twochi.coverletter.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.coverletter.domain.CoverLetterVariant;
import com.twochi.coverletter.dto.*;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class CoverLetterVariantService {

    private final CoverLetterVariantRepository repository;
    private final JobPostingRepository postingRepository;
    private final CoverLetterAiService aiService;

    @Transactional(readOnly = true)
    public List<VariantListGroupedResponse> listGrouped(Long userId) {
        List<CoverLetterVariant> variants = repository.findAllActiveByUserId(userId);

        Set<Long> postingIds = new HashSet<>();
        for (var v : variants) if (v.getPostingId() != null) postingIds.add(v.getPostingId());
        Map<Long, JobPosting> postingMap = new HashMap<>();
        for (var p : postingRepository.findAllById(postingIds)) postingMap.put(p.getId(), p);

        Map<Long, List<CoverLetterVariant>> grouped = new LinkedHashMap<>();
        for (var v : variants) {
            grouped.computeIfAbsent(v.getPostingId(), k -> new ArrayList<>()).add(v);
        }

        List<VariantListGroupedResponse> result = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            Long pid = entry.getKey();
            JobPosting p = pid == null ? null : postingMap.get(pid);
            VariantListGroupedResponse.PostingRef ref = new VariantListGroupedResponse.PostingRef(
                pid,
                p == null ? "(공고 없음)" : p.getCompany(),
                p == null ? "" : p.getTitle()
            );
            List<VariantSummaryResponse> summaries = entry.getValue().stream()
                .map(VariantSummaryResponse::from).toList();
            result.add(new VariantListGroupedResponse(ref, summaries));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public VariantResponse get(Long userId, Long id) {
        CoverLetterVariant v = repository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VARIANT_NOT_FOUND));
        JobPosting p = v.getPostingId() == null ? null
            : postingRepository.findById(v.getPostingId()).orElse(null);
        return VariantResponse.from(v,
            p == null ? "(공고 없음)" : p.getCompany(),
            p == null ? "" : p.getTitle());
    }

    public VariantResponse createWithAiDraft(Long userId, VariantCreateRequest req) {
        JobPosting posting = postingRepository.findByIdAndUserId(req.postingId(), userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.POSTING_NOT_FOUND));

        var draft = aiService.generateDraft(
            userId, posting, req.itemType(), req.question(),
            req.charLimit(), req.userRequest()
        );

        Instant now = Instant.now();
        CoverLetterVariant v = CoverLetterVariant.createDraft(
            userId, req.postingId(), req.analysisId(), req.itemType(),
            req.question(), req.charLimit(), draft.text(), req.userRequest(),
            draft.model(), draft.tokensUsed(), now
        );
        CoverLetterVariant saved = repository.save(v);
        return VariantResponse.from(saved, posting.getCompany(), posting.getTitle());
    }

    public VariantResponse patch(Long userId, Long id, VariantPatchRequest req) {
        CoverLetterVariant v = repository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VARIANT_NOT_FOUND));

        String validationJson = null;
        if (req.userEdit() != null) {
            JobPosting p = v.getPostingId() == null ? null
                : postingRepository.findById(v.getPostingId()).orElse(null);
            validationJson = buildValidationJson(req.userEdit(), v.getCharLimit(),
                p == null ? new String[0] : p.getKeywords());
        }

        v.update(req.userEdit(), req.userRequest(), validationJson, req.status(), Instant.now());

        JobPosting p2 = v.getPostingId() == null ? null
            : postingRepository.findById(v.getPostingId()).orElse(null);
        return VariantResponse.from(v,
            p2 == null ? "(공고 없음)" : p2.getCompany(),
            p2 == null ? "" : p2.getTitle());
    }

    public void delete(Long userId, Long id) {
        CoverLetterVariant v = repository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VARIANT_NOT_FOUND));
        repository.delete(v);
    }

    @Transactional(readOnly = true)
    public ValidationResponse validate(Long userId, Long id) {
        CoverLetterVariant v = repository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VARIANT_NOT_FOUND));
        JobPosting p = v.getPostingId() == null ? null
            : postingRepository.findById(v.getPostingId()).orElse(null);
        String[] keywords = p == null ? new String[0] : p.getKeywords();
        String text = v.getUserEdit() == null ? "" : v.getUserEdit();
        return buildValidation(text, v.getCharLimit(), keywords);
    }

    static ValidationResponse buildValidation(String text, Integer charLimit, String[] keywords) {
        int count = text.length();
        boolean charOk = charLimit == null
            ? true
            : (count <= charLimit && count >= (int) (charLimit * 0.9));
        List<String> matched = new ArrayList<>();
        if (keywords != null) {
            for (String kw : keywords) {
                if (kw != null && !kw.isBlank() && text.contains(kw)) matched.add(kw);
            }
        }
        return new ValidationResponse(count, charOk, matched, matched.size(), matched.size() >= 3);
    }

    static String buildValidationJson(String text, Integer charLimit, String[] keywords) {
        ValidationResponse vr = buildValidation(text, charLimit, keywords);
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"charCount\":").append(vr.charCount()).append(",");
        sb.append("\"charLimitOk\":").append(vr.charLimitOk()).append(",");
        sb.append("\"matchedKeywords\":[");
        for (int i = 0; i < vr.matchedKeywords().size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escape(vr.matchedKeywords().get(i))).append("\"");
        }
        sb.append("],");
        sb.append("\"matchCount\":").append(vr.matchCount()).append(",");
        sb.append("\"matchOk\":").append(vr.matchOk());
        sb.append("}");
        return sb.toString();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
