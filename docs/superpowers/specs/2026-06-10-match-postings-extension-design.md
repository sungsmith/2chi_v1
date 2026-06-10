# 매칭률 확장 — 공고별 매칭률 (자소서 목록 + 기업분석 공고 목록) 설계

**작성일:** 2026-06-10
**브랜치:** `feat/match-postings-extension`

## 배경
대시보드 매칭패널(평균)은 완료. 자소서 카드(`ClCard`)는 match 바 UI가 있으나 `match:0` 하드코딩, 기업분석 공고 목록은 "매칭률" 컬럼만 있고 값 미표시. 방금 만든 `MatchService`(이력 코퍼스 ↔ 공고 keywords) 재사용해 **공고별 매칭률**을 두 화면에 채운다.

## 결정 (brainstorming 승인)
- 공고별 **percent만** (부족 키워드는 대시보드 전용).
- 적용: **자소서 목록 + 기업분석 공고 목록**. 공고 상세는 v1 제외.

## 백엔드
- `MatchService.computePostingMatches(userId)` 추가: 코퍼스 1회 빌드 → 내 공고(`findAllByUserIdOrderByCreatedAtDesc`) 중 keywords 있는 것마다 `matchOne(corpus, keywords).percent` → `List<PostingMatch>`. keywords 없는 공고 제외.
- DTO `PostingMatchResponse(List<PostingMatch> matches)` + `PostingMatch(Long postingId, int percent)`.
- 컨트롤러: `GET /api/v1/me/match/postings` → `{ matches: [{postingId, percent}] }` (MatchController 에 메서드 추가, 인증 동일).

## 프론트엔드
- `lib/types/match.ts`: `PostingMatch { postingId:number; percent:number }`.
- `lib/api/match.ts`: `fetchPostingMatches(): Promise<PostingMatch[]>` (`{matches}` 언래핑).
- 자소서 목록(`cover-letters/list-content.tsx`): 마운트 시 `fetchPostingMatches` → `Map<postingId, percent>` → `ClCard` 의 `match` 에 `map.get(g.posting.id)` 주입(없으면 `undefined` → ClCard 가 바 생략). 현재 `match:0` 제거.
- 기업분석 공고 목록(`postings-content.tsx` + `posting-card.tsx`): 같은 맵 fetch → `PostingCard` 에 `match?: number` prop 추가 → 매칭률 컬럼에 `{match}%` (없으면 `—`).

## 테스트
- BE 단위: `computePostingMatches` — 공고별 percent, keywords 없는 공고 제외. (기존 MatchServiceTest 에 추가 가능하나, computePostingMatches 는 repo 의존 → 통합테스트로 검증)
- BE 통합(`MatchIntegrationTest` 확장): 공고 생성(keywords stub) + 코퍼스 시드 → `GET /api/v1/me/match/postings` 가 해당 postingId·percent 반환, keywords 없는 공고 제외.
- FE: `fetchPostingMatches` 클라이언트(언래핑), 자소서 목록이 match 주입(카드 % 표시), PostingCard 가 match prop 렌더.

## 범위 밖
공고 상세 매칭률, 부족 키워드 카드별 표시, 매칭 정렬(자소서 "매칭률" 정렬 버튼 동작).

## 검증
BE `./gradlew test` 그린 · FE lint 0 + vitest 그린.
