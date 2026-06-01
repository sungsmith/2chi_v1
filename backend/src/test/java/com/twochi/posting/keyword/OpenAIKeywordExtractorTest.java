package com.twochi.posting.keyword;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    // --- 단위 테스트: OPENAI_API_KEY 미설정 시 앱 기동 보호 ---

    private OpenAIKeywordExtractor unitClientWithKey(String key) {
        OpenAIKeywordExtractor c = new OpenAIKeywordExtractor(new ObjectMapper());
        ReflectionTestUtils.setField(c, "apiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(c, "apiKey", key);
        ReflectionTestUtils.setField(c, "model", "gpt-4o-mini");
        return c;
    }

    @Test
    void 키_없으면_init_은_예외없이_통과_앱기동_가능() {
        OpenAIKeywordExtractor c = unitClientWithKey("");
        assertThatCode(() -> ReflectionTestUtils.invokeMethod(c, "init"))
            .doesNotThrowAnyException();
    }

    @Test
    void 키_없이_extract_호출시_IllegalState() {
        OpenAIKeywordExtractor c = unitClientWithKey("");
        ReflectionTestUtils.invokeMethod(c, "init");
        assertThatThrownBy(() -> c.extract("a", "b", "c"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("OPENAI_API_KEY");
    }
}
