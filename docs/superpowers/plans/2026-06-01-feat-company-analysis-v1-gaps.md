# §9 company-analysis v1 gap-closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기업분석 베타 출시를 막는 gap 2개 — FE 생성 폼 URL 입력 미배선, OpenAI 키 부재 시 앱 전체 기동 실패 — 를 닫는다.

**Architecture:** (1) 이미 완성된 `UrlInputList` controlled 컴포넌트를 `AnalysisCreateForm`에 인라인 배선해 사용자 URL이 실제로 POST 본문에 실리게 한다. (2) `OpenAiAnalysisClient`의 키 검증을 `@PostConstruct`(기동 시 throw)에서 `generate()`(요청 시 throw)로 옮겨, 키 없이도 앱은 기동하고 분석 요청만 503으로 실패하게 한다.

**Tech Stack:** Next.js(App Router) + React + Vitest/RTL (FE), Spring Boot + JUnit5 + ReflectionTestUtils (BE).

**Spec:** `docs/superpowers/specs/2026-06-01-feat-company-analysis-v1-gaps-design.md`

**참고 (FE 주의):** `frontend/AGENTS.md` — 이 Next.js는 breaking change가 있을 수 있으니 새 Next API를 쓸 경우 `node_modules/next/dist/docs/` 확인. 본 작업은 React state/컴포넌트 합성 위주라 Next 특이 API는 없음.

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `frontend/src/components/company/analysis-create-form.tsx` | 수정 | URL state + UrlInputList 섹션 + handleSubmit에 urls 전달 |
| `frontend/src/components/company/__tests__/analysis-create-form.test.tsx` | 수정 | urls 전달 assert 갱신 + URL 입력 케이스 |
| `frontend/src/components/company/__tests__/url-input-list.test.tsx` | 신규 | UrlInputList 단위 테스트 |
| `backend/src/main/java/com/twochi/company/service/OpenAiAnalysisClient.java` | 수정 | @PostConstruct throw 제거 → warn+lazy, generate() null 가드 |
| `backend/src/test/java/com/twochi/company/OpenAiAnalysisClientTest.java` | 신규 | 키 부재 시 init 통과 / generate throw |

**Note:** `analysis-detail-content.tsx`의 재분석은 이미 `urls: analysis.sourceUrls`를 사용(line 53-55) — 생성이 URL을 저장하면 자동 동작. **수정 불필요**(건드리지 않음).

---

## Task 1: FE — UrlInputList 단위 테스트 (먼저 컴포넌트 동작 고정)

배선 전에 `UrlInputList`의 controlled 동작을 테스트로 고정한다.

**Files:**
- Test: `frontend/src/components/company/__tests__/url-input-list.test.tsx` (신규)

대상 컴포넌트(`frontend/src/components/company/url-input-list.tsx`) 인터페이스: `{ urls: string[]; onChange: (next: string[]) => void; max?: number }`. `urls.length===0`이면 빈 행 1개 표시. 입력 시 `onChange`는 빈 문자열을 제외한 배열을 전달. 추가 버튼 라벨은 `+ URL 추가 (n/max)`, `max` 도달 시 비활성.

- [ ] **Step 1: Write the failing test**

`frontend/src/components/company/__tests__/url-input-list.test.tsx`:

```tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlInputList } from "../url-input-list";

describe("UrlInputList", () => {
  test("빈 배열이면 빈 입력 행 1개 표시", () => {
    render(<UrlInputList urls={[]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("https://example.com/about")).toBeInTheDocument();
  });

  test("입력 시 onChange 가 비어있지 않은 값 배열로 호출", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UrlInputList urls={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("https://example.com/about"), "h");
    expect(onChange).toHaveBeenLastCalledWith(["h"]);
  });

  test("max 도달 시 추가 버튼 비활성", () => {
    const five = ["a", "b", "c", "d", "e"];
    render(<UrlInputList urls={five} onChange={vi.fn()} max={5} />);
    expect(screen.getByRole("button", { name: /URL 추가/ })).toBeDisabled();
  });

  test("추가 버튼 클릭 시 onChange 에 빈 행 추가", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UrlInputList urls={["https://a.com"]} onChange={onChange} max={5} />);
    await user.click(screen.getByRole("button", { name: /URL 추가/ }));
    expect(onChange).toHaveBeenCalledWith(["https://a.com", ""]);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (component already exists)**

Run: `cd frontend && npm test -- url-input-list`
Expected: PASS (4 tests). 이 컴포넌트는 이미 구현돼 있으므로 테스트는 바로 통과해야 한다. 만약 실패하면 컴포넌트 동작과 테스트 기대가 어긋난 것이니 테스트를 실제 동작에 맞춰 수정(컴포넌트는 수정하지 말 것 — 본 task 범위 밖).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/company/__tests__/url-input-list.test.tsx
git commit -m "test(co): UrlInputList 단위 테스트 (B 시리즈 §9 v1)"
```

---

## Task 2: FE — AnalysisCreateForm 에 URL 입력 배선

생성 폼이 사용자 URL을 수집해 POST 본문에 싣게 한다.

**Files:**
- Modify: `frontend/src/components/company/analysis-create-form.tsx`
- Test: `frontend/src/components/company/__tests__/analysis-create-form.test.tsx`

- [ ] **Step 1: Update the test to assert urls (failing)**

`analysis-create-form.test.tsx`에서 기존 "후보 선택 후 분석 시작" 테스트의 assert를 urls 포함으로 바꾸고, URL 입력 케이스를 추가한다.

기존(line 41-43):
```tsx
    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "주식회사 카카오",
    })));
```
변경:
```tsx
    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "주식회사 카카오",
      urls: [],
    })));
```

그리고 파일 맨 끝 `});` (describe 닫기) 직전에 신규 테스트 추가:
```tsx
  test("URL 입력 후 직접 분석 시작 → urls 가 API 에 전달됨", async () => {
    createMock.mockResolvedValue({ id: 7, company: "(주)테크", summaryJson: "{}", sourceUrls: ["https://tech.com/about"], generatedAt: "x", generatedBy: "y", expiresInDays: 30 });
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    await user.type(screen.getByRole("textbox", { name: /회사명/ }), "(주)테크");
    await user.type(screen.getByPlaceholderText("https://example.com/about"), "https://tech.com/about");
    await user.click(screen.getByRole("button", { name: /분석 시작/ }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "(주)테크",
      urls: ["https://tech.com/about"],
    })));
    expect(pushMock).toHaveBeenCalledWith("/company/analysis/7");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- analysis-create-form`
Expected: FAIL — 신규 케이스에서 `urls`가 `[]`로 전달되어 `["https://tech.com/about"]` 기대와 불일치. (URL 입력 필드도 아직 없어 `getByPlaceholderText`가 실패할 수 있음 — 둘 다 미배선 신호.)

- [ ] **Step 3: Wire UrlInputList into the form**

`analysis-create-form.tsx` 수정:

(a) import 추가 (line 5 `createOrReplaceAnalysis` import 아래):
```tsx
import { UrlInputList } from "./url-input-list";
```

(b) urls state 추가 (line 44 `const [company, ...]` 아래):
```tsx
  const [urls, setUrls] = useState<string[]>([]);
```

(c) `handleSubmit`의 `urls: []` → `urls` (line 59-62):
```tsx
      const result = await createOrReplaceAnalysis({
        company: companyName,
        urls,
      });
```

(d) URL 섹션 추가 — `ca-search-row` 닫는 `</div>`(line 107) 바로 다음, `{step === "candidates" && (` 블록 시작 전에 삽입:
```tsx
        <div className="head" style={{ paddingTop: 4 }}>
          <span className="lbl">회사 관련 링크</span>
          <span className="sub">회사 소개·채용 페이지 링크를 넣으면 인재상·활용 포인트를 더 정확히 분석해드려요. (선택 · 최대 5개)</span>
        </div>
        <UrlInputList urls={urls} onChange={setUrls} max={5} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- analysis-create-form`
Expected: PASS (5 tests — 갱신된 후보 케이스 + 신규 URL 케이스 포함).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/company/analysis-create-form.tsx \
        frontend/src/components/company/__tests__/analysis-create-form.test.tsx
git commit -m "feat(co): 분석 생성 폼에 사용자 URL 입력 배선 (§9 v1)"
```

---

## Task 3: BE — OpenAiAnalysisClient 키 lazy 처리

키 부재 시 앱 기동은 정상, 분석 생성 요청만 실패하게 한다.

**Files:**
- Modify: `backend/src/main/java/com/twochi/company/service/OpenAiAnalysisClient.java`
- Test: `backend/src/test/java/com/twochi/company/OpenAiAnalysisClientTest.java` (신규)

현재 `OpenAiAnalysisClient`: `@Value`로 `apiUrl`/`apiKey`/`model` 주입, `@RequiredArgsConstructor`로 `ObjectMapper objectMapper` 주입, `private RestClient client`. `@PostConstruct init()`이 키 blank면 `IllegalStateException` throw.

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/twochi/company/OpenAiAnalysisClientTest.java`:

```java
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
            .isInstanceOf(IllegalStateException.class);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./gradlew test --tests "com.twochi.company.OpenAiAnalysisClientTest"`
Expected: FAIL — `키_없으면_init_은...` 에서 현재 `init()`이 `IllegalStateException`을 throw하므로 `doesNotThrowAnyException` 위반.

- [ ] **Step 3: Make init lazy + add generate guard**

`OpenAiAnalysisClient.java` 의 `init()` (line 34-47) 을 다음으로 교체:
```java
    @PostConstruct
    void init() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY 미설정 — 기업분석 생성 요청은 503 으로 실패합니다. (앱 기동은 정상)");
            return;
        }
        this.client = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }
```

`generate(String prompt)` (line 49-50) 의 메서드 본문 첫 줄에 가드 추가:
```java
    @Override
    public Result generate(String prompt) {
        if (client == null) {
            throw new IllegalStateException("OPENAI_API_KEY 미설정 — 기업분석 생성 불가");
        }
        Map<String, Object> requestBody = Map.of(
```
(이하 기존 본문 그대로 유지.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./gradlew test --tests "com.twochi.company.OpenAiAnalysisClientTest"`
Expected: PASS (2 tests).

- [ ] **Step 5: Run company suite (회귀 확인)**

Run: `cd backend && ./gradlew test --tests "com.twochi.company.*"`
Expected: PASS — 기존 `CompanyAnalysisIntegrationTest`(`@MockBean(AnalysisAiClient)`)·`AnalysisAiServiceTest`·`HomepageScraperServiceTest` 회귀 없음.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/company/service/OpenAiAnalysisClient.java \
        backend/src/test/java/com/twochi/company/OpenAiAnalysisClientTest.java
git commit -m "fix(co): OpenAI 키 부재 시 요청시점 실패 — 앱 기동 보호 (§9 v1)"
```

---

## Self-Review 결과

- **Spec coverage:** §3 Gap1(FE URL 배선)=Task 1+2 · §4 Gap2(키 lazy)=Task 3 · §5 테스트(FE create-form/url-input + BE OpenAiAnalysisClient)=각 task · §3 regenerate 정합=이미 동작(detail 수정 불필요, File Structure note에 명시). 새 ErrorCode 없음(기존 ANALYSIS_GENERATION_FAILED 흡수)=Task 3 가드가 `AnalysisAiService` catch로 전파됨. e2e(§6)는 수동 검증 — 코드 task 아님.
- **Placeholder scan:** 없음. 모든 step에 실제 코드/명령/기대출력.
- **Type consistency:** `createOrReplaceAnalysis({ company, urls })` (AnalysisCreateRequest), `UrlInputList { urls, onChange, max }`, `OpenAiAnalysisClient.generate(String)` null 가드 + `init()` — spec·기존 코드와 일치. FE 테스트의 `getByPlaceholderText("https://example.com/about")`는 UrlInputList 실제 placeholder와 일치.
