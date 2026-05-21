package com.twochi.posting.parser;

import com.twochi.posting.dto.ParsedPosting;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SaraminParser implements PostingParser {

    private static final String UA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36";

    // 마감일 포맷: "2026.07.20 23:59" 또는 "2026-07-20"
    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{4})[.\\-](\\d{2})[.\\-](\\d{2})");

    @Override
    public boolean supports(URI url) {
        String host = url.getHost();
        return host != null && host.contains("saramin.co.kr");
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
            throw new ParsingException("사람인 페이지를 가져오지 못했어요", e);
        }
    }

    /** package-private — 테스트에서 fixture 로 직접 호출. */
    ParsedPosting parseDocument(Document doc, String sourceUrl) {
        String company = text(doc, ".title_inner .company");
        String title = text(doc, "h1.tit_job");
        // 상세요강(주요업무/자격요건/우대사항)은 iframe 내부에 있어 정적 파싱 불가 — null
        String jobRole = null;
        String mainTasks = null;
        String requirements = null;
        String preferred = null;
        LocalDate deadline = parseDeadline(doc);
        return new ParsedPosting(company, title, jobRole, requirements, preferred, mainTasks, deadline, sourceUrl);
    }

    private LocalDate parseDeadline(Document doc) {
        // dl.info_period 안에 "마감일" dt 다음 dd: "2026.07.20 23:59"
        Element deadlineEl = doc.selectFirst("dl.info_period dt.end + dd");
        if (deadlineEl == null) {
            // 대안: meta description 에서 추출
            Element meta = doc.selectFirst("meta[name=description]");
            if (meta != null) {
                String content = meta.attr("content");
                Matcher m = Pattern.compile("마감일:(\\d{4}-\\d{2}-\\d{2})").matcher(content);
                if (m.find()) {
                    try { return LocalDate.parse(m.group(1)); } catch (DateTimeParseException e) { return null; }
                }
            }
            return null;
        }
        String raw = deadlineEl.text().trim();
        Matcher m = DATE_PATTERN.matcher(raw);
        if (m.find()) {
            try {
                return LocalDate.of(
                    Integer.parseInt(m.group(1)),
                    Integer.parseInt(m.group(2)),
                    Integer.parseInt(m.group(3))
                );
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private static String text(Document doc, String selector) {
        Element el = doc.selectFirst(selector);
        return el != null ? el.text().trim() : null;
    }
}
