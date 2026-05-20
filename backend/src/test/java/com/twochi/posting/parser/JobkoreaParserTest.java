package com.twochi.posting.parser;

import com.twochi.posting.dto.ParsedPosting;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class JobkoreaParserTest {

    private final JobkoreaParser parser = new JobkoreaParser();

    @Test
    void supports_jobkorea_host() {
        assertThat(parser.supports(URI.create("https://www.jobkorea.co.kr/Recruit/GI_Read/123"))).isTrue();
        assertThat(parser.supports(URI.create("https://example.com/x"))).isFalse();
    }

    @Test
    void parses_sample_fixture_extracts_company_and_title() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/fixtures/jobkorea-sample.html")) {
            assertThat(is).isNotNull();
            Document doc = Jsoup.parse(is, StandardCharsets.UTF_8.name(), "https://www.jobkorea.co.kr/");
            ParsedPosting result = parser.parseDocument(doc, "https://www.jobkorea.co.kr/sample");

            assertThat(result.company()).isNotBlank();
            assertThat(result.title()).isNotBlank();
            assertThat(result.sourceUrl()).isEqualTo("https://www.jobkorea.co.kr/sample");

            // fixture 실제 값 검증 (JSON-LD 기준)
            assertThat(result.company()).contains("인동");
            assertThat(result.title()).contains("전산");
            assertThat(result.deadline()).isEqualTo(LocalDate.of(2026, 6, 10));
        }
    }
}
