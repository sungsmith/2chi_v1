package com.twochi.company;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.company.service.OpenAiAnalysisClient;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenAiAnalysisClientTest {

    private OpenAiAnalysisClient clientWithKey(String key) {
        OpenAiAnalysisClient c = new OpenAiAnalysisClient(new ObjectMapper());
        ReflectionTestUtils.setField(c, "apiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(c, "apiKey", key);
        ReflectionTestUtils.setField(c, "model", "gpt-4o-mini");
        return c;
    }

    @Test
    void 키_없으면_init_은_예외없이_통과_앱기동_가능() {
        OpenAiAnalysisClient c = clientWithKey("");
        assertThatCode(() -> ReflectionTestUtils.invokeMethod(c, "init"))
            .doesNotThrowAnyException();
    }

    @Test
    void 키_없이_generate_호출시_IllegalState() {
        OpenAiAnalysisClient c = clientWithKey("");
        ReflectionTestUtils.invokeMethod(c, "init");
        assertThatThrownBy(() -> c.generate("프롬프트"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("OPENAI_API_KEY");
    }
}
