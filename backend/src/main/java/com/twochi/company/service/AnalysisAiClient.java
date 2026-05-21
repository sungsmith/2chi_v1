package com.twochi.company.service;

/** OpenAI 호출 추상화. 테스트에서 @MockBean 으로 교체. */
public interface AnalysisAiClient {

    /** 프롬프트를 받아 텍스트 응답을 반환. 모델과 사용 토큰도 함께. */
    Result generate(String prompt);

    record Result(String text, String model, Integer tokensUsed) {}
}
