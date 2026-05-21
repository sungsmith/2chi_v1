package com.twochi.company.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 회사 홈페이지 URL 스크랩. v1 에서는 사용자가 입력한 URL 1~5개를 jsoup 으로 fetch.
 * 5초 timeout, user-agent 명시. 실패 시 빈 문자열 fallback (분석은 계속 진행).
 *
 * 한 페이지 본문 cap 1500자. 전체 합산 cap 5000자.
 */
@Slf4j
@Component
public class HomepageScraperService {

    private static final int PER_PAGE_CAP = 1500;
    private static final int TOTAL_CAP = 5000;
    private static final int TIMEOUT_MS = 5000;
    private static final String USER_AGENT =
        "Mozilla/5.0 (compatible; 2chi-analysis/1.0; +https://2chi.app)";

    /** URL 목록을 fetch + body text 추출. 결과 순서는 입력 순서 유지. 실패 URL 은 빈 문자열. */
    public List<String> scrape(List<String> urls) {
        List<String> out = new ArrayList<>();
        int totalUsed = 0;
        for (String url : urls) {
            if (url == null || url.isBlank()) { out.add(""); continue; }
            if (totalUsed >= TOTAL_CAP) { out.add(""); continue; }
            try {
                Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout(TIMEOUT_MS)
                    .ignoreContentType(false)
                    .followRedirects(true)
                    .get();
                String text = doc.body().text();
                int remaining = TOTAL_CAP - totalUsed;
                int allowed = Math.min(PER_PAGE_CAP, remaining);
                String capped = text.length() > allowed ? text.substring(0, allowed) : text;
                out.add(capped);
                totalUsed += capped.length();
            } catch (IOException e) {
                log.warn("스크랩 실패 url={} err={}", url, e.getMessage());
                out.add("");
            }
        }
        return out;
    }
}
