# §9 company-analysis v1 gap-closure 설계

> §9 기업분석은 #13(BE+FE 구현)·#20(디자인 mock realign)으로 **이미 ~90% 완성**돼 있다. 베타 출시를 막는 **구체적 gap 2개**만 닫는다. 새 기능 추가가 아니라 미완 배선·운영 안정화.

## 1. 목표 / 범위

**목표:** 기업분석을 베타에서 실제로 쓸 수 있게 한다 — (1) 사용자 URL 입력이 실제로 분석에 전달되게 하고, (2) OpenAI 키 부재가 앱 전체를 내리지 않게 한다.

**범위 안:**
- **Gap 1** — FE 생성 폼에 사용자 URL 입력(최대 5개) 인라인 섹션 배선
- **Gap 2** — OpenAI 키 부재 시 요청 시점 실패(앱 기동은 정상)

**범위 밖 (수용 한계 — 수정 X, 문서화만):**
- DART 검색은 static 후보(카카오 3종) — live DART API는 v2
- 뉴스 API 미연결 — v2
- posting ↔ analysis 연동 — v2
- 통합테스트 AI 클라이언트 mock(happy-path) — 실 OpenAI 실패 경로 테스트는 v2

## 2. 현황 (ground truth)

| 영역 | 상태 |
|---|---|
| BE 생성 파이프라인 (DART mock → URL 스크랩 → OpenAI → 저장) | ✅ 작동 |
| BE 엔드포인트 5종 + 통합테스트(`@MockBean(AnalysisAiClient)`) | ✅ |
| FE list / detail / API 레이어 / 타입 | ✅ 실 API 호출 |
| FE 생성 폼 URL 입력 | ⚠️ `urls: []` 하드코딩, `UrlInputList` 미사용(dead) |
| OpenAI 키 부재 시 | ⚠️ `@PostConstruct` throw → 앱 전체 기동 실패 |

## 3. Gap 1 — FE 인라인 URL 섹션

**현황:** `frontend/src/components/company/analysis-create-form.tsx`의 `handleSubmit`이 `createOrReplaceAnalysis({ company, urls: [] })`로 URL을 항상 빈 배열 전송. `frontend/src/components/company/url-input-list.tsx`는 완성된 controlled 컴포넌트(`{ urls, onChange, max=5 }`)지만 어디서도 import되지 않음.

**설계:**
- 생성 폼에 `const [urls, setUrls] = useState<string[]>([])` 추가.
- 회사 검색 row 아래, step 블록(candidates/empty)과 무관하게 **항상 보이는** URL 섹션을 카드 내에 1개 추가:
  - 라벨: `회사 관련 링크 (선택 · 최대 5개)`
  - 헬퍼: `회사 소개·채용 페이지 링크를 넣으면 인재상·활용 포인트를 더 정확히 분석해드려요.` (톤: 정확·맞춤)
  - `<UrlInputList urls={urls} onChange={setUrls} max={5} />`
- `handleSubmit`의 `urls: []` → `urls`로 교체 (3개 진입 경로 search/candidates/empty 공통).
- **regenerate 정합:** `frontend/src/components/company/analysis-detail-content.tsx`의 재분석이 `createOrReplaceAnalysis`에 넘기는 urls가 fetch된 `analysis.sourceUrls`인지 확인. `[]` 고정이면 `analysis.sourceUrls ?? []`로 수정(생성이 URL을 저장하므로 재분석도 동일 URL 사용).
- **디자인 정합:** mock(screen-company.jsx)의 생성 화면엔 URL 섹션이 없음 → 사용자 승인된 **의도된 신규 섹션 1개**. 기존 토큰·클래스(`.input`, `.btn ghost`, `.head/.lbl/.sub`)만 사용, 하드코딩 hex 금지.

## 4. Gap 2 — OpenAI 키 lazy 처리

**현황:** `backend/src/main/java/com/twochi/company/service/OpenAiAnalysisClient.java`의 `@PostConstruct init()`이 키 blank면 `IllegalStateException` throw → 빈 생성 실패 → **Spring 컨텍스트 기동 실패(앱 전체 down)**. (통합테스트는 `AnalysisAiClient`를 `@MockBean`해 이 빈이 안 떠 통과.)

**설계:**
- `@PostConstruct init()`: 키 blank면 throw 대신 `log.warn("OPENAI_API_KEY 미설정 — 기업분석 생성 요청은 실패합니다")` 후 `client`를 null로 둔다. 키 있으면 기존대로 `RestClient` 빌드.
- `generate(String prompt)`: 진입 시 `if (client == null) throw new IllegalStateException("OPENAI_API_KEY 미설정");`.
- 이 예외는 호출자 `AnalysisAiService.generate()`의 기존 `catch (Exception e)`가 **`BusinessException(ErrorCode.ANALYSIS_GENERATION_FAILED)`(503)** 로 래핑 → 사용자에겐 "기업분석 생성에 실패했어요. 잠시 후 다시 시도해주세요.", auth·알림 등 나머지 앱은 정상 기동·동작.
- **새 ErrorCode 만들지 않음** (기존 503 메시지가 적합, YAGNI). 트레이드오프: "잠시 후 다시 시도" 문구가 config 오류엔 다소 부정확하나, 실제 운영 신호는 기동 시 `log.warn` → 수용.

## 5. 테스트

**FE**
- `analysis-create-form.test.tsx` 갱신:
  - 기존 "제출 시 API 호출" 케이스의 assert를 `createOrReplaceAnalysis`가 `urls` 포함 호출되도록 수정.
  - 신규: URL 입력 후 제출 → mock된 `createOrReplaceAnalysis`가 입력한 urls 배열로 호출됨.
- `url-input-list.test.tsx` 신규(단위): 행 추가 / 행 제거 / max 5 초과 시 추가 버튼 비활성 / `onChange`가 빈 값 제외 전달.

**BE**
- `OpenAiAnalysisClientTest` 신규(단위, Spring 컨텍스트 없이 직접 인스턴스화 + `ReflectionTestUtils`로 필드 주입):
  - 키 blank → `init()` 호출이 예외 없이 끝남(기동 가능).
  - 키 blank → `generate("...")` 호출 시 `IllegalStateException`.
- 기존 `CompanyAnalysisIntegrationTest`는 `@MockBean(AnalysisAiClient)`라 영향 없음 — 전체 스위트로 회귀 확인.

## 6. e2e 수동 검증 (사용자 OpenAI 키)
- 실 `OPENAI_API_KEY`로 기동 → 회사명 + URL 2~3개 입력 → 분석 생성 → `talent_profile`/`action_points`가 채워짐 확인.
- 키 없이 기동 → 앱 정상 기동(로그인 동작) + 분석 생성 요청만 503 확인.

## 7. 변경 파일 요약

| 파일 | 작업 |
|---|---|
| `frontend/src/components/company/analysis-create-form.tsx` | URL state + UrlInputList 인라인 섹션 + handleSubmit urls 전달 |
| `frontend/src/components/company/analysis-detail-content.tsx` | regenerate가 `analysis.sourceUrls` 재사용 확인/수정 |
| `frontend/src/components/company/__tests__/analysis-create-form.test.tsx` | urls 전달 assert 갱신 + 신규 케이스 |
| `frontend/src/components/company/__tests__/url-input-list.test.tsx` | 신규 단위 테스트 |
| `backend/src/main/java/com/twochi/company/service/OpenAiAnalysisClient.java` | @PostConstruct throw 제거 → warn + lazy, generate() null 가드 |
| `backend/src/test/java/com/twochi/company/OpenAiAnalysisClientTest.java` | 신규 단위 테스트 |

---

spec 통과 → `superpowers:writing-plans`로 task-by-task 구현 plan 작성.
