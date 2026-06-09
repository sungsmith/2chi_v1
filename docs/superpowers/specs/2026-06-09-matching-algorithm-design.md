# 매칭 알고리즘 (대시보드 매칭패널) 설계

**작성일:** 2026-06-09
**브랜치:** `feat/5.5-matching`

## 배경 / 문제

대시보드 매칭패널은 5.3에서 "v2 준비 중" 플레이스홀더로 둔 상태. "내 이력이 채용공고에 얼마나 맞나"를 키워드 룰 기반으로 계산해 실데이터로 채운다.

## 결정 사항 (brainstorming)

- **방식**: 키워드(룰 기반). 임베딩/LLM 아님.
- **범위(v1)**: 대시보드 매칭패널 1면만. 동일 `MatchService`를 자소서 카드·기업분석에 추후 재사용.
- **내 키워드 소스(종합)**: 프로젝트 `techStack[]` + 경력 `summary` + 프로젝트 PRAR 텍스트(`structureData` 값) + 프로필 `introduction`.
- **공고 소스**: 사용자가 등록한 JobPosting의 `keywords[]` (KeywordExtractor가 추출, 기존).

## 매칭 계산

**단일 공고 매칭률** = `(공고 keywords 중 내 코퍼스에 포함된 개수) / (공고 keywords 총개수) × 100`, 정수 반올림.
- **내 코퍼스**: 위 소스를 모두 이어붙인 소문자 문자열.
- **포함 판정**: case-insensitive `contains` (기존 `CoverLetterVariantService.buildValidation`과 동일 방식 — 일관성). keyword를 소문자로 바꿔 코퍼스에 substring 존재하면 hit.
- keywords가 빈 공고는 집계에서 제외.

**대시보드 집계** (`computeDashboardMatch(userId)`):
- 내 공고들 중 keywords가 1개 이상인 것만 대상.
- `percent` = 대상 공고들의 매칭률 평균(정수 반올림). 대상 0건이면 percent 0, postingCount 0.
- `gaps`: 각 대상 공고의 미스 keyword(공고엔 있으나 코퍼스에 없음)를 모아, **등장 공고 수(hitCount)** 로 집계 → 내림차순 정렬, 동률은 keyword 사전순 → **TOP 3**.
- `postingCount` = 대상 공고 수.

> 알려진 한계(감수): 짧은 키워드 substring 오매칭(예: "Go"가 "Google"에 포함). v1 보정 안 함(기존 buildValidation도 동일).

## 백엔드

**위치**: 신규 `com.twochi.match` 모듈.
- `service/MatchService.java` — 순수 로직 위주:
  - `String buildCorpus(List<Career> careers, List<Project> projects, String introduction)` (소문자 합본)
  - `MatchOutcome matchOne(String corpus, String[] keywords)` → `{percent, missing:List<String>}`
  - `DashboardMatchResponse computeDashboardMatch(Long userId)` — 리포지토리에서 공고/경력/프로젝트/프로필 조회 → 집계
- `dto/DashboardMatchResponse.java` (record): `percent(int)`, `postingCount(int)`, `gaps(List<Gap>)`; nested `Gap(String keyword, int hitCount)`.
- `controller/MatchController.java` — `GET /api/v1/me/match/dashboard`, `@AuthenticationPrincipal` (null→UNAUTHENTICATED).
- 조회는 기존 리포지토리 재사용: JobPosting(userId), Career(+Project, techStack/structureData), Profile(introduction). 정확한 메서드는 plan에서 확정.
- 마이그레이션/엔티티 신규 없음(읽기 전용 집계).

순수 함수(buildCorpus/matchOne/gaps 집계)는 리포지토리 의존 없이 단위테스트 가능하도록 분리.

## 프론트엔드

- `lib/types/match.ts`: `DashboardMatch { percent:number; postingCount:number; gaps:{keyword:string;hitCount:number}[] }`.
- `lib/api/match.ts`: `fetchDashboardMatch(): Promise<DashboardMatch>` (`GET /api/v1/me/match/dashboard`, 객체 그대로 반환).
- `components/dashboard/match-panel.tsx`: placeholder → 자체 fetch.
  - 로딩: 간단한 안내.
  - `postingCount === 0` 또는 에러: `.panel-soon` 스타일 재사용해 "채용공고를 등록하면 이력과 매칭을 분석해드려요" 안내(공고 등록 유도). (v2 문구 대체)
  - 데이터: 링 `{percent}%` + "부족 역량 TOP 3" `gap-item` 목록(`+{hitCount}건`). 5.3 이전의 ring/gap 마크업 복원 — 관련 CSS(`.match-ring`/`.gap-list`/`.gap-item`/`.match-top`)는 kit.css에 그대로 존재.
- `dashboard-content.tsx`: 이미 `<MatchPanel />` 렌더 → 변경 없음.

## 톤 / 디자인

해요체. 디자인 토큰. "부족 역량"은 부정적 낙인 대신 "보완하면 좋아요" 톤. AI 어휘 무관.

## 테스트

- **BE 단위** (`MatchServiceTest`): buildCorpus(대소문자·techStack·PRAR 합본), matchOne(percent 계산·missing), gaps 집계(hitCount·랭킹·TOP3·동률 정렬), 빈 공고 제외, 코퍼스 빈 경우(전부 miss).
- **BE 통합** (`MatchIntegrationTest`, deleteAllInBatch 격리): KeywordExtractor를 특정 키워드 반환하도록 stub + 경력/프로젝트(techStack) 생성 → `GET /api/v1/me/match/dashboard` 의 percent·gaps·postingCount 검증. 공고 0건이면 percent0/postingCount0. 인증 없으면 401.
- **FE**: match api client(엔드포인트·반환), MatchPanel(공고0 빈상태 / 링+gaps 렌더 / 로딩).

## 검증 게이트

BE `./gradlew test` 그린 · FE `npm run lint` 0 errors + `npx vitest run` 그린.
