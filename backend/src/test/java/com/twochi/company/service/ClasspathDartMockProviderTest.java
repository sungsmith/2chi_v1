package com.twochi.company.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClasspathDartMockProviderTest {

    private ClasspathDartMockProvider provider;

    @BeforeEach
    void setUp() {
        provider = new ClasspathDartMockProvider(new ObjectMapper());
        provider.init();
    }

    @Test
    void lookup_known_company_returns_facts() {
        DartFacts facts = provider.lookup("(주)테크컴퍼니");
        assertThat(facts.businessArea()).isEqualTo("결제·정산 SaaS");
        assertThat(facts.mainProducts()).contains("TC-Pay");
        assertThat(facts.employees()).isEqualTo(120);
    }

    @Test
    void lookup_unknown_company_returns_unknown() {
        DartFacts facts = provider.lookup("미등록회사");
        assertThat(facts.businessArea()).isEqualTo("(DART 공시 매칭 없음)");
        assertThat(facts.mainProducts()).isEmpty();
        assertThat(facts.employees()).isNull();
    }

    @Test
    void lookup_null_returns_unknown() {
        DartFacts facts = provider.lookup(null);
        assertThat(facts.businessArea()).isEqualTo("(DART 공시 매칭 없음)");
    }
}
