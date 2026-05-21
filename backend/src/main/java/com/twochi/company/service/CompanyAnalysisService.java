package com.twochi.company.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.company.domain.CompanyAnalysis;
import com.twochi.company.dto.*;
import com.twochi.company.repository.CompanyAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyAnalysisService {

    private static final long CACHE_DAYS = 30L;

    private final CompanyAnalysisRepository repository;
    private final DartMockProvider dartProvider;
    private final HomepageScraperService scraper;
    private final AnalysisAiService aiService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<AnalysisSummaryResponse> list(Long userId) {
        return repository.findAllByUserIdOrderByGeneratedAtDesc(userId).stream()
            .map(a -> new AnalysisSummaryResponse(
                a.getId(), a.getCompany(), a.getGeneratedAt(), computeExpiresInDays(a.getGeneratedAt())
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse get(Long userId, Long id) {
        CompanyAnalysis a = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANALYSIS_NOT_FOUND));
        return toResponse(a);
    }

    @Transactional(readOnly = true)
    public ByCompanyResponse findByCompany(Long userId, String company) {
        return repository.findByUserIdAndCompany(userId, company)
            .map(a -> new ByCompanyResponse(a.getId(), a.getCompany()))
            .orElse(new ByCompanyResponse(null, company));
    }

    public CreateOrReplaceResult createOrReplace(Long userId, AnalysisCreateRequest req) {
        DartFacts dart = dartProvider.lookup(req.company());
        List<String> urls = req.urls() == null ? List.of() : req.urls();
        List<String> scraped = scraper.scrape(urls);
        var aiResult = aiService.generate(userId, req.company(), dart, scraped);

        String summaryJson = buildSummaryJson(dart, aiResult);
        String[] urlsArray = urls.toArray(new String[0]);
        Instant now = Instant.now();

        Optional<CompanyAnalysis> existing = repository.findByUserIdAndCompany(userId, req.company());
        if (existing.isPresent()) {
            CompanyAnalysis a = existing.get();
            a.regenerate(summaryJson, urlsArray, aiResult.model(), now);
            return new CreateOrReplaceResult(toResponse(a), false);
        } else {
            CompanyAnalysis a = CompanyAnalysis.create(
                userId, req.company(), summaryJson, urlsArray, aiResult.model(), now
            );
            CompanyAnalysis saved = repository.save(a);
            return new CreateOrReplaceResult(toResponse(saved), true);
        }
    }

    public void delete(Long userId, Long id) {
        CompanyAnalysis a = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANALYSIS_NOT_FOUND));
        repository.delete(a);
    }

    private AnalysisResponse toResponse(CompanyAnalysis a) {
        return new AnalysisResponse(
            a.getId(), a.getCompany(), a.getSummaryJson(),
            a.getSourceUrls(), a.getGeneratedAt(), a.getGeneratedBy(),
            computeExpiresInDays(a.getGeneratedAt())
        );
    }

    private Long computeExpiresInDays(Instant generatedAt) {
        long days = Duration.between(generatedAt, Instant.now()).toDays();
        return CACHE_DAYS - days;
    }

    private String buildSummaryJson(DartFacts dart, AnalysisAiService.Result ai) {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("businessArea", dart.businessArea());
        overview.put("mainProducts", dart.mainProducts());
        overview.put("revenue", dart.revenue());
        overview.put("employees", dart.employees());
        overview.put("location", dart.location());
        overview.put("sourceUrl", dart.sourceUrl());

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("overview", overview);
        root.put("talent_profile", ai.talentProfile());
        root.put("action_points", ai.actionPoints());

        try {
            return objectMapper.writeValueAsString(root);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.ANALYSIS_GENERATION_FAILED);
        }
    }

    public record CreateOrReplaceResult(AnalysisResponse response, boolean created) {}
}
