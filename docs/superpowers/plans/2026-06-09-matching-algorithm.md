# 매칭 알고리즘 (대시보드 매칭패널) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드 매칭패널을 "v2 준비 중" 플레이스홀더에서 키워드 룰 기반 실데이터(평균 매칭률 + 부족 역량 TOP3)로 전환한다.

**Architecture:** 신규 읽기 전용 `com.twochi.match` 모듈. `MatchService`가 내 이력 코퍼스(techStack+경력summary+프로젝트PRAR+소개)를 만들고 공고 keywords 와 case-insensitive contains 매칭 → 공고별 매칭률 평균 + 미스 keyword 빈도 집계. `GET /api/v1/me/match/dashboard` 노출. FE MatchPanel 이 fetch 해서 ring+gaps 렌더.

**Tech Stack:** Spring Boot(JPA, 읽기 전용 집계), JUnit5 + MockMvc / Next.js(modified), React, Vitest + RTL, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-09-matching-algorithm-design.md`

**확인된 기존 자산:**
- `JobPostingRepository.findAllByUserIdOrderByCreatedAtDesc(Long)` → 내 공고; `JobPosting.getKeywords()` → `String[]`.
- `CareerRepository.findAllByUserIdOrderByOrderIndexDesc(Long)`; `Career.getSummary()`.
- `ProjectRepository` (project 에 userId 필드 있음, `@Getter`): 신규 `findAllByUserId` 추가 필요. `Project.getTitle()/getRole()/getTechStack():String[]/getStructureData():Map<String,String>`.
- `ProfileRepository extends JpaRepository<Profile,Long>` — Profile @Id = userId 이므로 `findById(userId)`; `Profile.getIntroduction()`.
- 인증: `@AuthenticationPrincipal com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser`, null→`BusinessException(ErrorCode.UNAUTHENTICATED)`.
- 매칭 contains 선례: `CoverLetterVariantService.buildValidation`.

---

## File Structure
- Create: `backend/src/main/java/com/twochi/match/dto/DashboardMatchResponse.java`
- Create: `backend/src/main/java/com/twochi/match/service/MatchService.java`
- Create: `backend/src/main/java/com/twochi/match/controller/MatchController.java`
- Modify: `backend/src/main/java/com/twochi/career/repository/ProjectRepository.java` (add `findAllByUserId`)
- Test: `backend/src/test/java/com/twochi/match/MatchServiceTest.java` (pure unit)
- Test: `backend/src/test/java/com/twochi/match/MatchIntegrationTest.java`
- Create: `frontend/src/lib/types/match.ts`
- Create: `frontend/src/lib/api/match.ts` (+ test `__tests__/match.test.ts`)
- Modify: `frontend/src/components/dashboard/match-panel.tsx`
- Test: `frontend/src/components/dashboard/__tests__/match-panel.test.tsx` (재작성)

---

## Task 1: BE MatchService (순수 로직) + DTO + repo 메서드 + 단위테스트

**Files:**
- Create: `backend/src/main/java/com/twochi/match/dto/DashboardMatchResponse.java`
- Modify: `backend/src/main/java/com/twochi/career/repository/ProjectRepository.java`
- Create: `backend/src/main/java/com/twochi/match/service/MatchService.java`
- Test: `backend/src/test/java/com/twochi/match/MatchServiceTest.java`

- [ ] **Step 1: DTO**
```java
package com.twochi.match.dto;

import java.util.List;

public record DashboardMatchResponse(int percent, int postingCount, List<Gap> gaps) {
    public record Gap(String keyword, int hitCount) {}
}
```

- [ ] **Step 2: ProjectRepository 에 findAllByUserId 추가**
기존 인터페이스에 메서드 한 줄 추가(다른 메서드는 그대로):
```java
    java.util.List<Project> findAllByUserId(Long userId);
```
(import 가 이미 있으면 `List<Project> findAllByUserId(Long userId);` 로. 파일 상단 import 스타일에 맞출 것.)

- [ ] **Step 3: 실패 단위테스트 작성** (순수 static 메서드 + 집계)
```java
package com.twochi.match;

import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.service.MatchService;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class MatchServiceTest {

    @Test
    void matchOne_퍼센트와_미스_계산() {
        String corpus = "spring redis 결제 정산 경험".toLowerCase();
        MatchService.MatchOutcome o = MatchService.matchOne(corpus,
            new String[]{"Spring", "Redis", "Kafka", "MSA"});
        assertThat(o.matched()).isEqualTo(2);
        assertThat(o.total()).isEqualTo(4);
        assertThat(o.missing()).containsExactly("Kafka", "MSA");
    }

    @Test
    void matchOne_빈키워드_무시() {
        MatchService.MatchOutcome o = MatchService.matchOne("spring",
            new String[]{"Spring", "", null});
        assertThat(o.total()).isEqualTo(1);
        assertThat(o.matched()).isEqualTo(1);
    }

    @Test
    void aggregateDashboard_평균퍼센트와_gaps_랭킹() {
        // 공고2개: P1 keywords[Spring,Kafka] (내겐 Spring 만) → 50%, miss Kafka
        //          P2 keywords[Kafka,MSA]   (내겐 둘다 없음)  → 0%,  miss Kafka,MSA
        // 평균 = (50+0)/2 = 25, gaps: Kafka(2), MSA(1) → TOP: Kafka, MSA
        String corpus = "spring 경험";
        var p1 = MatchService.matchOne(corpus, new String[]{"Spring", "Kafka"});
        var p2 = MatchService.matchOne(corpus, new String[]{"Kafka", "MSA"});
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of(p1, p2));
        assertThat(r.percent()).isEqualTo(25);
        assertThat(r.postingCount()).isEqualTo(2);
        assertThat(r.gaps()).hasSize(2);
        assertThat(r.gaps().get(0).keyword()).isEqualTo("Kafka");
        assertThat(r.gaps().get(0).hitCount()).isEqualTo(2);
        assertThat(r.gaps().get(1).keyword()).isEqualTo("MSA");
    }

    @Test
    void aggregateDashboard_빈입력_0() {
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of());
        assertThat(r.percent()).isEqualTo(0);
        assertThat(r.postingCount()).isEqualTo(0);
        assertThat(r.gaps()).isEmpty();
    }

    @Test
    void gaps_동률은_사전순() {
        String corpus = "";
        var p1 = MatchService.matchOne(corpus, new String[]{"Beta", "Alpha"}); // 둘다 miss
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of(p1));
        assertThat(r.gaps().get(0).keyword()).isEqualTo("Alpha"); // 동률(1) → 사전순
        assertThat(r.gaps().get(1).keyword()).isEqualTo("Beta");
    }
}
```

- [ ] **Step 4: 실패 확인**
Run: `cd backend && ./gradlew test --tests "com.twochi.match.MatchServiceTest"`
Expected: FAIL (MatchService / MatchOutcome / matchOne / aggregate 없음)

- [ ] **Step 5: MatchService 구현**
`matchOne` 과 `aggregate` 는 순수 static(테스트 용이), `computeDashboardMatch` 는 리포지토리 조회 후 둘을 사용.
```java
package com.twochi.match.service;

import com.twochi.career.domain.Career;
import com.twochi.career.domain.Project;
import com.twochi.career.repository.CareerRepository;
import com.twochi.career.repository.ProjectRepository;
import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.dto.DashboardMatchResponse.Gap;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final JobPostingRepository postingRepository;
    private final CareerRepository careerRepository;
    private final ProjectRepository projectRepository;
    private final ProfileRepository profileRepository;

    public record MatchOutcome(int total, int matched, List<String> missing) {}

    /** 내 이력을 소문자 코퍼스 문자열로 합본 (techStack + 경력 summary + 프로젝트 PRAR + 소개) */
    public static String buildCorpus(List<Career> careers, List<Project> projects, String introduction) {
        StringBuilder sb = new StringBuilder();
        if (introduction != null) sb.append(introduction).append(' ');
        for (Career c : careers) {
            if (c.getSummary() != null) sb.append(c.getSummary()).append(' ');
        }
        for (Project p : projects) {
            if (p.getTitle() != null) sb.append(p.getTitle()).append(' ');
            if (p.getRole() != null) sb.append(p.getRole()).append(' ');
            if (p.getTechStack() != null) {
                for (String t : p.getTechStack()) sb.append(t).append(' ');
            }
            if (p.getStructureData() != null) {
                for (String v : p.getStructureData().values()) {
                    if (v != null) sb.append(v).append(' ');
                }
            }
        }
        return sb.toString().toLowerCase();
    }

    /** 단일 공고: keyword 가 코퍼스에 substring 으로 있으면 hit (case-insensitive) */
    public static MatchOutcome matchOne(String corpus, String[] keywords) {
        List<String> missing = new ArrayList<>();
        int matched = 0;
        for (String kw : keywords) {
            if (kw == null || kw.isBlank()) continue;
            if (corpus.contains(kw.toLowerCase())) matched++;
            else missing.add(kw);
        }
        return new MatchOutcome(matched + missing.size(), matched, missing);
    }

    /** 공고별 MatchOutcome 들을 평균 퍼센트 + gaps TOP3 로 집계. total==0 인 항목은 호출 전 제외돼 있어야 함. */
    public static DashboardMatchResponse aggregate(List<MatchOutcome> outcomes) {
        if (outcomes.isEmpty()) return new DashboardMatchResponse(0, 0, List.of());
        int sumPercent = 0;
        Map<String, Integer> gapCount = new HashMap<>();
        for (MatchOutcome o : outcomes) {
            sumPercent += Math.round(o.matched() * 100f / o.total());
            for (String miss : o.missing()) gapCount.merge(miss, 1, Integer::sum);
        }
        int percent = Math.round((float) sumPercent / outcomes.size());
        List<Gap> gaps = gapCount.entrySet().stream()
            .sorted(Comparator.<Map.Entry<String, Integer>>comparingInt(Map.Entry::getValue).reversed()
                .thenComparing(Map.Entry::getKey))
            .limit(3)
            .map(e -> new Gap(e.getKey(), e.getValue()))
            .toList();
        return new DashboardMatchResponse(percent, outcomes.size(), gaps);
    }

    @Transactional(readOnly = true)
    public DashboardMatchResponse computeDashboardMatch(Long userId) {
        List<Career> careers = careerRepository.findAllByUserIdOrderByOrderIndexDesc(userId);
        List<Project> projects = projectRepository.findAllByUserId(userId);
        String introduction = profileRepository.findById(userId).map(Profile::getIntroduction).orElse(null);
        String corpus = buildCorpus(careers, projects, introduction);

        List<MatchOutcome> outcomes = new ArrayList<>();
        for (JobPosting p : postingRepository.findAllByUserIdOrderByCreatedAtDesc(userId)) {
            String[] kws = p.getKeywords();
            if (kws == null || kws.length == 0) continue;
            MatchOutcome o = matchOne(corpus, kws);
            if (o.total() == 0) continue; // 모든 keyword 가 blank 였던 경우
            outcomes.add(o);
        }
        return aggregate(outcomes);
    }
}
```

- [ ] **Step 6: 통과 확인**
Run: `cd backend && ./gradlew test --tests "com.twochi.match.MatchServiceTest"`
Expected: PASS (5 tests)

- [ ] **Step 7: 컴파일(컨트롤러 전이지만 서비스/DTO/repo)**
Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 8: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/match/dto/ backend/src/main/java/com/twochi/match/service/ backend/src/main/java/com/twochi/career/repository/ProjectRepository.java backend/src/test/java/com/twochi/match/MatchServiceTest.java
git commit -m "feat(match): MatchService 키워드 매칭 로직 + DTO + 단위테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: BE MatchController + 통합테스트

**Files:**
- Create: `backend/src/main/java/com/twochi/match/controller/MatchController.java`
- Test: `backend/src/test/java/com/twochi/match/MatchIntegrationTest.java`

- [ ] **Step 1: Controller**
```java
package com.twochi.match.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/dashboard")
    public DashboardMatchResponse dashboard(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return matchService.computeDashboardMatch(principal.userId());
    }
}
```
(AuthenticatedUser import 경로는 다른 me 컨트롤러와 동일한지 확인.)

- [ ] **Step 2: 통합테스트**
`ApplicationIntegrationTest` 의 setup + deleteAllInBatch 격리 패턴. KeywordExtractor 를 @MockBean 으로 특정 키워드 반환하도록 stub 해서, 공고가 keywords 를 갖게 만든다. 경력+프로젝트(techStack) 도 API 로 생성해 코퍼스를 채운다.

먼저 확인할 것:
- 공고 생성 엔드포인트/본문: `grep -rn "postings\|@PostMapping" backend/src/main/java/com/twochi/posting/controller` (ApplicationIntegrationTest 는 `POST /api/v1/postings` 에 `{source:MANUAL, company, title, jobRole, deadline?}` 사용).
- 경력 생성: `POST /api/v1/me/careers` 본문(`grep -rn "careers\|@PostMapping" backend/src/main/java/com/twochi/career/controller`).
- 프로젝트 생성(techStack 포함): career 하위 `POST /api/v1/me/careers/{id}/projects` 본문 + techStack 필드명.
- KeywordExtractor stub: `when(keywordExtractor.extract(any(),any(),any())).thenReturn(List.of("Spring","Kafka"))`.

```java
package com.twochi.match;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.posting.keyword.KeywordExtractor;
import com.twochi.posting.repository.JobPostingRepository;
import com.twochi.career.repository.CareerRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class MatchIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private JobPostingRepository postingRepository;
    @Autowired private CareerRepository careerRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;
    @MockBean private KeywordExtractor keywordExtractor;

    private String token;

    private void clean() {
        postingRepository.deleteAllInBatch();
        careerRepository.deleteAllInBatch();
        profileRepository.deleteAllInBatch();
        consentLogRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        redis.getConnection().serverCommands().flushDb();
    }

    @AfterEach
    void tearDown() { clean(); }

    @BeforeEach
    void setUp() throws Exception {
        clean();
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "mt@example.com", "password", "Pass1234!", "nickname", "mt",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "mt@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void 공고없으면_percent0_postingCount0() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/me/match/dashboard")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode b = om.readTree(r.getResponse().getContentAsString());
        assertThat(b.get("percent").asInt()).isEqualTo(0);
        assertThat(b.get("postingCount").asInt()).isEqualTo(0);
        assertThat(b.get("gaps")).isEmpty();
    }

    @Test
    void 경력에_기술있고_공고키워드_일부매칭() throws Exception {
        // KeywordExtractor stub → 공고 keywords = [Spring, Kafka]
        when(keywordExtractor.extract(any(), any(), any())).thenReturn(List.of("Spring", "Kafka"));
        // 경력 생성 (summary 에 Spring 포함 → 코퍼스에 spring)
        mockMvc.perform(post("/api/v1/me/careers")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "company", "테크", "position", "백엔드",
                "startDate", "2023-01-01", "isCurrent", true,
                "summary", "Spring 기반 결제 정산 시스템 개발"))))
            .andExpect(status().is2xxSuccessful());
        // 공고 생성 → KeywordExtractor stub 으로 keywords=[Spring,Kafka]
        mockMvc.perform(post("/api/v1/postings")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "source", "MANUAL", "company", "네이버", "title", "백엔드", "jobRole", "백엔드"))))
            .andExpect(status().is2xxSuccessful());

        MvcResult r = mockMvc.perform(get("/api/v1/me/match/dashboard")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode b = om.readTree(r.getResponse().getContentAsString());
        // 공고1: keywords[Spring,Kafka], 코퍼스에 spring 만 → 50%
        assertThat(b.get("postingCount").asInt()).isEqualTo(1);
        assertThat(b.get("percent").asInt()).isEqualTo(50);
        assertThat(b.get("gaps").get(0).get("keyword").asText()).isEqualTo("Kafka");
        assertThat(b.get("gaps").get(0).get("hitCount").asInt()).isEqualTo(1);
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/match/dashboard")).andExpect(status().isUnauthorized());
    }
}
```
> 경력 생성 본문 필드(`company/position/startDate/isCurrent/summary`)와 응답 status(200 vs 201)는 실제 CareerController 에 맞춰 확인·조정할 것. summary 필드명이 다르면 맞출 것. 공고 생성 status 도 실제(ApplicationIntegrationTest 는 201) 확인. 핵심 단언(percent 50, gap Kafka)은 유지하되 입력 형식만 실제 API 에 맞춘다. KeywordExtractor stub 이 실제로 공고 생성 시 호출돼 keywords 에 저장되는지 확인(ApplicationIntegrationTest 가 KeywordExtractor 를 mock 하는 방식과 동일 빈).

- [ ] **Step 3: 테스트 실행**
Run: `cd backend && ./gradlew test --tests "com.twochi.match.*"`
Expected: PASS (단위 5 + 통합 3)

- [ ] **Step 4: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/match/controller/ backend/src/test/java/com/twochi/match/MatchIntegrationTest.java
git commit -m "feat(match): GET /api/v1/me/match/dashboard 컨트롤러 + 통합테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: FE 타입 + API 클라이언트

**Files:**
- Create: `frontend/src/lib/types/match.ts`
- Create: `frontend/src/lib/api/match.ts`
- Test: `frontend/src/lib/api/__tests__/match.test.ts`

- [ ] **Step 1: 타입**
```typescript
export type MatchGap = { keyword: string; hitCount: number };

export type DashboardMatch = {
  percent: number;
  postingCount: number;
  gaps: MatchGap[];
};
```

- [ ] **Step 2: 실패 테스트**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchDashboardMatch } from "../match";

beforeEach(() => httpMock.mockReset());

describe("fetchDashboardMatch", () => {
  it("엔드포인트 호출 + 응답 객체 반환", async () => {
    const payload = { percent: 50, postingCount: 1, gaps: [{ keyword: "Kafka", hitCount: 1 }] };
    httpMock.mockResolvedValue({ json: async () => payload });
    const res = await fetchDashboardMatch();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/match/dashboard");
    expect(res).toEqual(payload);
  });
});
```

- [ ] **Step 3: 실패 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/match.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: 클라이언트**
```typescript
import { http } from "@/lib/api/http";
import type { DashboardMatch } from "@/lib/types/match";

export async function fetchDashboardMatch(): Promise<DashboardMatch> {
  const res = await http("/api/v1/me/match/dashboard");
  return res.json();
}
```

- [ ] **Step 5: 통과 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/match.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/types/match.ts frontend/src/lib/api/match.ts frontend/src/lib/api/__tests__/match.test.ts
git commit -m "feat(match): FE 타입 + API 클라이언트 + 테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: FE MatchPanel 실데이터 배선

**Files:**
- Modify: `frontend/src/components/dashboard/match-panel.tsx`
- Test: `frontend/src/components/dashboard/__tests__/match-panel.test.tsx` (재작성)

현재 match-panel.tsx 는 props 없는 placeholder(.panel-soon). 자체 fetch 로 전환. ring/gap 마크업은 5.3 이전 버전 복원 + 실데이터. 관련 CSS(`.match-top`/`.match-ring`/`.gap-list`/`.gap-item`/`.badge`)는 kit.css 에 존재. `MascotCloud`/`Target` import 는 현재 파일에서 재사용.

- [ ] **Step 1: MatchPanel 재작성**
```tsx
"use client";

import { useEffect, useState } from "react";
import { Target } from "@/components/ui/icons";
import { MascotCloud } from "@/components/ui/mascot-cloud";
import { fetchDashboardMatch } from "@/lib/api/match";
import type { DashboardMatch } from "@/lib/types/match";

export function MatchPanel() {
  const [data, setData] = useState<DashboardMatch | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardMatch()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const head = (
    <div className="panel-head">
      <h2 className="title lav">
        <span className="ico"><Target size={16} /></span>
        매칭 분석
      </h2>
    </div>
  );

  // 로딩
  if (!data && !error) {
    return (
      <section className="panel">
        {head}
        <div className="panel-soon"><p className="soon-sub">매칭을 계산하고 있어요…</p></div>
      </section>
    );
  }

  // 에러 또는 공고 0건 → 등록 유도 안내
  if (error || !data || data.postingCount === 0) {
    return (
      <section className="panel">
        {head}
        <div className="panel-soon">
          <MascotCloud size="md" expression="think" />
          <p className="soon-title">아직 비교할 채용공고가 없어요</p>
          <p className="soon-sub">채용공고를 등록하면 내 이력과 키워드를 비교해 매칭률과 보완하면 좋을 역량을 알려드려요.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      {head}
      <div className="match-top">
        <div className="match-ring" style={{ ["--p" as string]: data.percent } as React.CSSProperties}>
          <span>
            <span className="v">{data.percent}%</span>
            <span className="lbl">매칭률</span>
          </span>
        </div>
        <div className="meta">
          <span className="t">JD 평균 매칭률</span>
          <span className="sub">최근 등록한 채용공고 {data.postingCount}건을 기준으로, 내 이력과 키워드를 비교했어요.</span>
        </div>
      </div>
      {data.gaps.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge lav dot">보완하면 좋은 역량 TOP {data.gaps.length}</span>
          </div>
          <div className="gap-list">
            {data.gaps.map((g, i) => (
              <div key={g.keyword} className="gap-item">
                <span className="rank">{i + 1}</span>
                <div>
                  <span className="nm">{g.keyword}</span>
                  <span className="sub">채용공고 {g.hitCount}곳에서 요구돼요</span>
                </div>
                <span className="hit">{g.hitCount}건</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
```
> `.meta` 의 `.k`(position) 는 데이터가 없어 생략. `.match-ring` 의 `--p` 는 기존 패턴 그대로(원형 진행 표시 CSS 가 `--p` 사용). 기존 CSS 클래스명을 정확히 따랐는지 kit.css 와 대조할 것.

- [ ] **Step 2: 테스트 재작성**
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchPanel } from "../match-panel";

const fetchMock = vi.fn();
vi.mock("@/lib/api/match", () => ({ fetchDashboardMatch: (...a: unknown[]) => fetchMock(...a) }));

beforeEach(() => fetchMock.mockReset());

describe("MatchPanel", () => {
  it("공고 0건 → 등록 유도 안내", async () => {
    fetchMock.mockResolvedValue({ percent: 0, postingCount: 0, gaps: [] });
    render(<MatchPanel />);
    expect(await screen.findByText(/아직 비교할 채용공고가 없어요/)).toBeInTheDocument();
    expect(screen.queryByText("매칭률")).not.toBeInTheDocument();
  });

  it("데이터 → 링 percent + 부족 역량 gaps 렌더", async () => {
    fetchMock.mockResolvedValue({
      percent: 50, postingCount: 2,
      gaps: [{ keyword: "Kafka", hitCount: 2 }, { keyword: "MSA", hitCount: 1 }],
    });
    render(<MatchPanel />);
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Kafka")).toBeInTheDocument();
    expect(screen.getByText("MSA")).toBeInTheDocument();
    expect(screen.getByText(/채용공고 2건을 기준/)).toBeInTheDocument();
  });

  it("에러 → 안내(placeholder)", async () => {
    fetchMock.mockRejectedValue(new Error("x"));
    render(<MatchPanel />);
    expect(await screen.findByText(/아직 비교할 채용공고가 없어요/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 테스트 + 린트**
Run: `cd frontend && npx vitest run src/components/dashboard/__tests__/match-panel.test.tsx && npm run lint`
Expected: PASS, lint 0 errors. 그 다음 전체: `npx vitest run` (dashboard-content 테스트가 MatchPanel 변경에 영향받는지 확인 — dashboard-content.test 는 MatchPanel 의 "v2 준비 중"/"준비 중" 텍스트를 단언했을 수 있음. 깨지면 그 단언을 새 빈상태 문구로 갱신).

- [ ] **Step 4: dashboard-content.test 영향 확인·수정**
`grep -n "v2 준비 중\|매칭 분석을 준비\|MatchPanel\|준비 중" frontend/src/components/dashboard/__tests__/dashboard-content.test.tsx`. 해당 단언이 있으면, MatchPanel 이 이제 fetch 하므로 `@/lib/api/match` 를 mock 해야 한다(미mock 시 실제 http 호출 시도). dashboard-content.test 상단에 `vi.mock("@/lib/api/match", () => ({ fetchDashboardMatch: vi.fn().mockResolvedValue({percent:0,postingCount:0,gaps:[]}) }))` 추가하고, "v2 준비 중" 단언이 있으면 "아직 비교할 채용공고가 없어요" 로 갱신(또는 해당 단언 제거).

- [ ] **Step 5: 전체 FE 확인**
Run: `cd frontend && npm run lint && npx vitest run`
Expected: lint 0 errors, 전체 그린

- [ ] **Step 6: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/dashboard/match-panel.tsx frontend/src/components/dashboard/__tests__/match-panel.test.tsx frontend/src/components/dashboard/__tests__/dashboard-content.test.tsx
git commit -m "feat(match): 대시보드 매칭패널 실데이터 배선(링+부족역량) + 빈상태

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 통합 검증 + PR

- [ ] **Step 1: 백엔드 전체**
Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: 프론트 전체**
Run: `cd frontend && npm run lint && npx vitest run`
Expected: lint 0 errors, 전체 그린

- [ ] **Step 3: push + PR**
```bash
git push -u origin feat/5.5-matching
gh pr create --base develop --title "feat(match): 대시보드 매칭률(키워드 룰 기반)" --body "<요약: MatchService 키워드 매칭(이력 코퍼스↔공고 keywords) + GET /api/v1/me/match/dashboard + 대시보드 매칭패널 실배선(링+부족역량 TOP3, 공고0 빈상태). 검증: BE ./gradlew test, FE lint+vitest.>"
```

---

## Self-Review

**1. Spec coverage:**
- 매칭률 계산(평균, contains) → Task 1 matchOne/aggregate ✅
- 내 코퍼스(techStack+summary+PRAR+소개) → Task 1 buildCorpus ✅
- gaps 집계(hitCount·TOP3·동률 사전순) → Task 1 aggregate + 테스트 ✅
- 엔드포인트 → Task 2 ✅
- FE 타입/클라이언트 → Task 3 ✅
- MatchPanel 실배선 + 빈상태 → Task 4 ✅
- 테스트(BE 단위·통합 / FE client·panel) → 각 Task ✅
- 범위 밖(자소서·기업분석·임베딩) → 미포함 ✅

**2. Placeholder scan:** 모든 스텝 실제 코드/명령. "실제 API 에 맞춰 확인"(경력/공고 생성 본문·status)은 모듈별 차이 대비 검증 지시(placeholder 아님).

**3. Type consistency:**
- BE `DashboardMatchResponse(percent:int, postingCount:int, gaps:List<Gap{keyword,hitCount}>)` ↔ FE `DashboardMatch{percent,postingCount,gaps:{keyword,hitCount}[]}` 일치.
- `MatchService.matchOne/aggregate/buildCorpus` 시그니처 단위테스트 ↔ 구현 ↔ computeDashboardMatch 사용 일치.
- FE `fetchDashboardMatch` ↔ MatchPanel/테스트 import 일치.

**실행 시 확인:** 경력/프로젝트/공고 생성 API 본문·status(모듈별), dashboard-content.test 의 MatchPanel mock 필요 여부, `--p` CSS 변수 렌더.
