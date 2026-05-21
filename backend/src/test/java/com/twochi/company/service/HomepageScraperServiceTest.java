package com.twochi.company.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class HomepageScraperServiceTest {

    private final HomepageScraperService scraper = new HomepageScraperService();

    @Test
    void scrape_invalid_url_returns_empty_string_for_that_entry() {
        List<String> result = scraper.scrape(List.of("https://invalid-host-that-does-not-exist-12345.example/"));
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEmpty();
    }

    @Test
    void scrape_blank_or_null_urls_return_empty_strings() {
        List<String> result = scraper.scrape(java.util.Arrays.asList("", null, "  "));
        assertThat(result).hasSize(3);
        assertThat(result).allMatch(String::isEmpty);
    }

    @Test
    void scrape_empty_list_returns_empty_list() {
        List<String> result = scraper.scrape(List.of());
        assertThat(result).isEmpty();
    }
}
