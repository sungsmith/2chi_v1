package com.twochi.posting.parser;

import com.twochi.posting.dto.ParsedPosting;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JobkoreaParser implements PostingParser {

    private static final String UA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36";

    // JSON-LD 필드 추출용 패턴
    private static final Pattern TITLE_PATTERN = Pattern.compile("\"title\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ORG_NAME_PATTERN = Pattern.compile("\"hiringOrganization\"\\s*:\\s*\\{[^}]*\"name\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern VALID_THROUGH_PATTERN = Pattern.compile("\"validThrough\"\\s*:\\s*\"(\\d{4}-\\d{2}-\\d{2})");

    @Override
    public boolean supports(URI url) {
        String host = url.getHost();
        return host != null && host.contains("jobkorea.co.kr");
    }

    @Override
    public ParsedPosting parse(URI url) {
        try {
            Document doc = Jsoup.connect(url.toString())
                .userAgent(UA)
                .timeout((int) Duration.ofSeconds(8).toMillis())
                .get();
            return parseDocument(doc, url.toString());
        } catch (IOException e) {
            throw new ParsingException("잡코리아 페이지를 가져오지 못했어요", e);
        }
    }

    /** package-private — 테스트에서 fixture 로 직접 호출. */
    ParsedPosting parseDocument(Document doc, String sourceUrl) {
        // JSON-LD (application/ld+json) 에서 구조화 데이터 추출
        String ldJson = extractJobPostingLdJson(doc);

        String company = null;
        String title = null;
        LocalDate deadline = null;

        if (ldJson != null) {
            company = extractPattern(ldJson, ORG_NAME_PATTERN);
            title = extractPattern(ldJson, TITLE_PATTERN);
            deadline = parseValidThrough(ldJson);
        }

        // fallback: og:title / meta description
        if (company == null) {
            company = ogOrMetaCompany(doc);
        }
        if (title == null) {
            Element ogTitle = doc.selectFirst("meta[property=og:title]");
            if (ogTitle != null) title = ogTitle.attr("content").replaceAll("\\s*\\|\\s*잡코리아.*$", "").trim();
        }

        // 상세 내용(주요업무/자격요건/우대사항)은 CSR 렌더 영역 — 정적 HTML 에서 추출 불가, null
        return new ParsedPosting(company, title, null, null, null, null, deadline, sourceUrl);
    }

    private String extractJobPostingLdJson(Document doc) {
        Elements scripts = doc.select("script[type=application/ld+json]");
        for (Element script : scripts) {
            String data = script.html();
            if (data.contains("\"@type\":\"JobPosting\"") || data.contains("\"@type\": \"JobPosting\"")) {
                return data;
            }
        }
        return null;
    }

    private String extractPattern(String text, Pattern pattern) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group(1) : null;
    }

    private LocalDate parseValidThrough(String ldJson) {
        Matcher m = VALID_THROUGH_PATTERN.matcher(ldJson);
        if (!m.find()) return null;
        try {
            return LocalDate.parse(m.group(1));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private String ogOrMetaCompany(Document doc) {
        // 잡코리아 og:title 형식: "㈜인동에프엔 채용 - ㈜인동에프엔 전산 | 잡코리아"
        // meta writer 는 회사명만 포함
        Element writer = doc.selectFirst("meta[name=writer]");
        if (writer != null) return writer.attr("content").trim();
        return null;
    }
}
