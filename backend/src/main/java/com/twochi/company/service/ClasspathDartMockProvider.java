package com.twochi.company.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClasspathDartMockProvider implements DartMockProvider {

    private final ObjectMapper objectMapper;
    private Map<String, DartFacts> fixtures = Map.of();

    @PostConstruct
    void init() {
        try (InputStream is = new ClassPathResource("fixtures/dart-mock.json").getInputStream()) {
            this.fixtures = objectMapper.readValue(is,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, DartFacts.class));
            log.info("DART mock fixtures 로드: {} 개 회사", fixtures.size());
        } catch (IOException e) {
            log.warn("DART mock fixture 로드 실패 — empty map fallback: {}", e.getMessage());
            this.fixtures = Map.of();
        }
    }

    @Override
    public DartFacts lookup(String company) {
        if (company == null) return DartFacts.unknown();
        DartFacts hit = fixtures.get(company);
        return hit != null ? hit : DartFacts.unknown();
    }
}
