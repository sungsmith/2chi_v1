package com.twochi.coverletter.service;

/** OpenAI 호출 추상화. 테스트에서 @MockBean 으로 교체. */
public interface CoverLetterAiClient {

    /** 프롬프트를 받아 AI 초안 텍스트 + 사용 토큰을 반환. */
    Result generate(String prompt);

    record Result(String text, String model, Integer tokensUsed) {}
}
