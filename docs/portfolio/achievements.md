# 성과 카탈로그

## P-0001 자소서 작성 페이지 LCP 75% 단축

- 기간: 2026-05-20 ~ 2026-05-25
- 카테고리: 프론트엔드 / 성능
- 역량: FE-PERF-001 (코어 웹 바이탈)
- 자소서 항목 후보: ACHIEVEMENT, PROBLEM_SOLVING

### P · 문제
지인 베타 5명 테스트 시 자소서 작성 페이지 LCP 4.8초 측정. "느려서 다른 탭으로 이동"한다는 피드백 3건.

### R · 원인
- AI 응답 대기 중 메인 스레드 블로킹
- 자소서 항목 마스터 답변 전체를 SSR로 한 번에 가져와 첫 페인트 지연
- 폰트 webfont 비차단 로딩 미적용

### A · 접근
- 마스터 답변을 paginated client fetch로 전환 (TanStack Query)
- 폰트에 font-display: swap
- AI 응답은 streaming + skeleton UI

### R · 결과
- LCP 4.8s → 1.2s (75% 단축)
- 베타 사용자 페이지 체류 시간 평균 1분 12초 → 3분 8초
- "느려서 이동" 피드백 0건 (4주 관찰)

### 키워드
LCP, TanStack Query, font-display, streaming, Next.js

### 사용한 도구
Lighthouse, Chrome DevTools Performance, Sentry Web Vitals