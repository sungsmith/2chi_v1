package com.twochi.posting.keyword;

import java.util.List;

public interface KeywordExtractor {
    /**
     * @return 추출된 키워드 목록. API 실패·파싱 실패 시 빈 리스트 (graceful).
     */
    List<String> extract(String mainTasks, String requirements, String preferred);
}
