package com.twochi.coverletter.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<VariantListGroupedResponse> listGrouped(Long userId) {
        List<CoverLetterVariant> variants = repository.findAllActiveByUserId(userId);

        Set<Long> postingIds = new HashSet<>();
        for (var v : variants) if (v.getPostingId() != null) postingIds.add(v.getPostingId());
        Map<Long, JobPosting> postingMap = new HashMap<>();
        for (var p : postingRepository.findAllById(postingIds)) postingMap.put(p.getId(), p);

        // posting_id 별로 그룹 + 그룹 최근 updatedAt 추적
        Map<Long, List<CoverLetterVariant>> grouped = new LinkedHashMap<>();
        Map<Long, java.time.Instant> latestPerGroup = new HashMap<>();
        for (var v : variants) {
            grouped.computeIfAbsent(v.getPostingId(), k -> new ArrayList<>()).add(v);
            java.time.Instant prev = latestPerGroup.get(v.getPostingId());
            if (prev == null || v.getUpdatedAt().isAfter(prev)) {
                latestPerGroup.put(v.getPostingId(), v.getUpdatedAt());
            }
        }

        // 그룹을 최근 수정 우선으로 정렬 (latestPerGroup desc)
        List<Long> orderedKeys = new ArrayList<>(grouped.keySet());
        orderedKeys.sort((a, b) -> latestPerGroup.get(b).compareTo(latestPerGroup.get(a)));

        List<VariantListGroupedResponse> result = new ArrayList<>();
        for (Long pid : orderedKeys) {
            JobPosting p = pid == null ? null : postingMap.get(pid);
            VariantListGroupedResponse.PostingRef ref = new VariantListGroupedResponse.PostingRef(
                pid,
                p == null ? "(공고 없음)" : p.getCompany(),
                p == null ? "" : p.getTitle()
            );
            List<VariantSummaryResponse> summaries = grouped.get(pid).stream()
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

    String buildValidationJson(String text, Integer charLimit, String[] keywords) {
        ValidationResponse vr = buildValidation(text, charLimit, keywords);
        try {
            return objectMapper.writeValueAsString(vr);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("validation_json 직렬화 실패", e);
        }
    }
}
