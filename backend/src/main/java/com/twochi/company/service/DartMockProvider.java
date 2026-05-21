package com.twochi.company.service;

/** DART 공시 데이터 제공자. v1 은 classpath JSON mock, v2 는 실 API 호출. */
public interface DartMockProvider {

    /** 회사명으로 lookup. 매칭 없으면 DartFacts.unknown() 반환. */
    DartFacts lookup(String company);
}
