package com.twochi.posting.keyword;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class OpenAIKeywordExtractorTest {

    static WireMockServer wm = new WireMockServer(0);

    static {
        wm.start();
    }

    @AfterAll
    static void stop() { wm.stop(); }
    @BeforeEach
    void reset() { wm.resetAll(); }

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry reg) {
        reg.add("openai.api-url", () -> wm.baseUrl() + "/v1/chat/completions");
        reg.add("openai.api-key", () -> "test-key");
    }

    @Autowired OpenAIKeywordExtractor extractor;

    @Test
    void extracts_keywords_from_valid_response() {
        wm.stubFor(post(urlEqualTo("/v1/chat/completions")).willReturn(
            okJson("{\"choices\":[{\"message\":{\"content\":\"[\\\"Spring Boot\\\", \\\"MSA\\\"]\"}}]}")
        ));
        List<String> result = extractor.extract("주요업무", "자격요건", "우대사항");
        assertThat(result).containsExactly("Spring Boot", "MSA");
    }

    @Test
    void returns_empty_on_invalid_response() {
        wm.stubFor(post(urlEqualTo("/v1/chat/completions")).willReturn(
            okJson("{\"choices\":[{\"message\":{\"content\":\"this is not json array\"}}]}")
        ));
        List<String> result = extractor.extract("x", "y", "z");
        assertThat(result).isEmpty();
    }

    @Test
    void returns_empty_on_network_error() {
        wm.stubFor(post(urlEqualTo("/v1/chat/completions")).willReturn(serverError()));
        List<String> result = extractor.extract("x", "y", "z");
        assertThat(result).isEmpty();
    }
}
