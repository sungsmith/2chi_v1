package com.twochi.match.service;

import com.twochi.career.domain.Career;
import com.twochi.career.domain.Project;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.dto.DashboardMatchResponse.Gap;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final JobPostingRepository postingRepository;
    private final CareerRepository careerRepository;
    private final ProjectRepository projectRepository;
    private final ProfileRepository profileRepository;

    public record MatchOutcome(int total, int matched, List<String> missing) {}

    public static String buildCorpus(List<Career> careers, List<Project> projects, String introduction) {
        StringBuilder sb = new StringBuilder();
        if (introduction != null) sb.append(introduction).append(' ');
        for (Career c : careers) {
            if (c.getSummary() != null) sb.append(c.getSummary()).append(' ');
        }
        for (Project p : projects) {
            if (p.getTitle() != null) sb.append(p.getTitle()).append(' ');
            if (p.getRole() != null) sb.append(p.getRole()).append(' ');
            if (p.getTechStack() != null) {
                for (String t : p.getTechStack()) sb.append(t).append(' ');
            }
            if (p.getStructureData() != null) {
                for (String v : p.getStructureData().values()) {
                    if (v != null) sb.append(v).append(' ');
                }
            }
        }
        return sb.toString().toLowerCase();
    }

    public static MatchOutcome matchOne(String corpus, String[] keywords) {
        List<String> missing = new ArrayList<>();
        int matched = 0;
        for (String kw : keywords) {
            if (kw == null || kw.isBlank()) continue;
            if (corpus.contains(kw.toLowerCase())) matched++;
            else missing.add(kw);
        }
        return new MatchOutcome(matched + missing.size(), matched, missing);
    }

    public static DashboardMatchResponse aggregate(List<MatchOutcome> outcomes) {
        if (outcomes.isEmpty()) return new DashboardMatchResponse(0, 0, List.of());
        int sumPercent = 0;
        Map<String, Integer> gapCount = new HashMap<>();
        for (MatchOutcome o : outcomes) {
            sumPercent += Math.round(o.matched() * 100f / o.total());
            for (String miss : o.missing()) gapCount.merge(miss, 1, Integer::sum);
        }
        int percent = Math.round((float) sumPercent / outcomes.size());
        List<Gap> gaps = gapCount.entrySet().stream()
            .sorted(Comparator.<Map.Entry<String, Integer>>comparingInt(Map.Entry::getValue).reversed()
                .thenComparing(Map.Entry::getKey))
            .limit(3)
            .map(e -> new Gap(e.getKey(), e.getValue()))
            .toList();
        return new DashboardMatchResponse(percent, outcomes.size(), gaps);
    }

    @Transactional(readOnly = true)
    public DashboardMatchResponse computeDashboardMatch(Long userId) {
        List<Career> careers = careerRepository.findAllByUserIdOrderByOrderIndexDesc(userId);
        List<Project> projects = projectRepository.findAllByUserId(userId);
        String introduction = profileRepository.findById(userId).map(Profile::getIntroduction).orElse(null);
        String corpus = buildCorpus(careers, projects, introduction);

        List<MatchOutcome> outcomes = new ArrayList<>();
        for (JobPosting p : postingRepository.findAllByUserIdOrderByCreatedAtDesc(userId)) {
            String[] kws = p.getKeywords();
            if (kws == null || kws.length == 0) continue;
            MatchOutcome o = matchOne(corpus, kws);
            if (o.total() == 0) continue;
            outcomes.add(o);
        }
        return aggregate(outcomes);
    }
}
