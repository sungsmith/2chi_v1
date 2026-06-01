package com.twochi.coverletter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.coverletter.service.OpenAiCoverLetterClient;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenAiCoverLetterClientTest {

    private OpenAiCoverLetterClient clientWithKey(String key) {
        OpenAiCoverLetterClient c = new OpenAiCoverLetterClient(new ObjectMapper());
        ReflectionTestUtils.setField(c, "apiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(c, "apiKey", key);
        ReflectionTestUtils.setField(c, "model", "gpt-4o-mini");
        return c;
    }

    @Test
    void 키_없으면_init_은_예외없이_통과_앱기동_가능() {
        OpenAiCoverLetterClient c = clientWithKey("");
        assertThatCode(() -> ReflectionTestUtils.invokeMethod(c, "init"))
            .doesNotThrowAnyException();
    }

    @Test
    void 키_없이_generate_호출시_IllegalState() {
        OpenAiCoverLetterClient c = clientWithKey("");
        ReflectionTestUtils.invokeMethod(c, "init");
        assertThatThrownBy(() -> c.generate("프롬프트"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("OPENAI_API_KEY");
    }
}
