# 내 정보 포트폴리오 링크 CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 내 정보 > 포트폴리오 탭을 mock 에서 실 데이터(외부 링크 CRUD)로 전환한다. 파일 업로드는 fast-follow.

**Architecture:** 백엔드는 기존 `com.twochi.profile.education` 모듈을 그대로 미러링한 신규 `com.twochi.profile.portfolio` 모듈(엔티티·리포지토리·DTO·서비스·컨트롤러 + Flyway V10). 프런트는 컴포넌트 자체 fetch 패턴(ProfileView/CareerContent)을 따라 PortfolioView 가 직접 API 호출.

**Tech Stack:** Spring Boot(JPA, Flyway, Bean Validation), PostgreSQL, JUnit5 + MockMvc / Next.js(modified), React, Vitest + RTL, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-09-portfolio-links-design.md`

---

## File Structure

**Backend — 신규 `backend/src/main/java/com/twochi/profile/portfolio/`:**
- `domain/PortfolioLink.java` — 엔티티
- `domain/PortfolioLinkKind.java` — enum (GITHUB/BLOG/NOTION/OTHER)
- `repository/PortfolioLinkRepository.java`
- `dto/PortfolioLinkRequest.java` / `dto/PortfolioLinkResponse.java`
- `service/PortfolioLinkService.java`
- `controller/PortfolioLinkController.java`
- `backend/src/main/resources/db/migration/V10__portfolio_link.sql` (+ `V10_R__rollback.sql`)
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` (PORTFOLIO_LINK_NOT_FOUND)
- Test: `backend/src/test/java/com/twochi/profile/portfolio/PortfolioLinkIntegrationTest.java`

**Frontend:**
- `frontend/src/lib/types/me-portfolio.ts`
- `frontend/src/lib/api/portfolio.ts` (+ test `__tests__/portfolio.test.ts`)
- Modify: `frontend/src/components/me/portfolio-modal.tsx`
- Modify: `frontend/src/components/me/portfolio-view.tsx`
- Modify: `frontend/src/app/(app)/me/portfolio/page.tsx`
- Modify: `frontend/src/lib/mock/me.ts` (PORTFOLIO_* 제거)
- Test: `frontend/src/components/me/__tests__/portfolio-view.test.tsx` (재작성), `__tests__/portfolio-modal.test.tsx` (신규)

---

## Task 1: BE 엔티티 + enum + Flyway V10 + ErrorCode

**Files:**
- Create: `backend/src/main/java/com/twochi/profile/portfolio/domain/PortfolioLinkKind.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/domain/PortfolioLink.java`
- Create: `backend/src/main/resources/db/migration/V10__portfolio_link.sql`
- Create: `backend/src/main/resources/db/migration/V10_R__rollback.sql`
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`

- [ ] **Step 1: kind enum**
```java
package com.twochi.profile.portfolio.domain;

public enum PortfolioLinkKind {
    GITHUB, BLOG, NOTION, OTHER
}
```

- [ ] **Step 2: 엔티티** (Education.java 컨벤션: @Getter, @NoArgsConstructor(PROTECTED), private all-args + static create + update)
```java
package com.twochi.profile.portfolio.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "portfolio_link")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PortfolioLinkKind kind;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private PortfolioLink(Long userId, PortfolioLinkKind kind, String title, String url,
                         int orderIndex, Instant now) {
        this.userId = userId;
        this.kind = kind;
        this.title = title;
        this.url = url;
        this.orderIndex = orderIndex;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public static PortfolioLink create(Long userId, PortfolioLinkKind kind, String title,
                                       String url, int orderIndex, Instant now) {
        return new PortfolioLink(userId, kind, title, url, orderIndex, now);
    }

    public void update(PortfolioLinkKind kind, String title, String url, Instant now) {
        this.kind = kind;
        this.title = title;
        this.url = url;
        this.updatedAt = now;
    }
}
```

- [ ] **Step 3: Flyway V10** (먼저 `ls backend/src/main/resources/db/migration/ | grep -E '^V[0-9]' | sort -V | tail` 로 V9 가 최신인지 확인. V10 이 이미 있으면 STOP & report)
```sql
-- V10__portfolio_link.sql — 내 정보 포트폴리오 외부 링크
CREATE TABLE portfolio_link (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    kind        VARCHAR(20)  NOT NULL,
    title       VARCHAR(100) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    order_index INT          NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_portfolio_kind CHECK (kind IN ('GITHUB','BLOG','NOTION','OTHER'))
);
CREATE INDEX idx_portfolio_user ON portfolio_link (user_id, order_index);
```

- [ ] **Step 4: V10 rollback** (V9_R__rollback.sql 스타일)
```sql
-- V10_R__rollback.sql
DROP INDEX IF EXISTS idx_portfolio_user;
DROP TABLE IF EXISTS portfolio_link;
```

- [ ] **Step 5: ErrorCode 추가** — `ErrorCode.java` 의 다른 *_NOT_FOUND 들(EDUCATION_NOT_FOUND 등) 근처에 한 줄 추가:
```java
    PORTFOLIO_LINK_NOT_FOUND(HttpStatus.NOT_FOUND, "포트폴리오 링크를 찾을 수 없어요."),
```
(기존 enum 상수 나열 형식·콤마·세미콜론 위치를 그대로 따를 것. 정확한 삽입 위치는 EDUCATION_NOT_FOUND 라인을 grep 해서 그 아래.)

- [ ] **Step 6: 컴파일**
Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/profile/portfolio/domain/ backend/src/main/resources/db/migration/V10__portfolio_link.sql backend/src/main/resources/db/migration/V10_R__rollback.sql backend/src/main/java/com/twochi/common/exception/ErrorCode.java
git commit -m "feat(portfolio): PortfolioLink 엔티티 + V10 마이그레이션 + ErrorCode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: BE Repository + DTO + Service + Controller + 통합테스트

**Files:**
- Create: `backend/src/main/java/com/twochi/profile/portfolio/repository/PortfolioLinkRepository.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/dto/PortfolioLinkRequest.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/dto/PortfolioLinkResponse.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/service/PortfolioLinkService.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/controller/PortfolioLinkController.java`
- Test: `backend/src/test/java/com/twochi/profile/portfolio/PortfolioLinkIntegrationTest.java`

- [ ] **Step 1: Repository** (EducationRepository 미러)
```java
package com.twochi.profile.portfolio.repository;

import com.twochi.profile.portfolio.domain.PortfolioLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PortfolioLinkRepository extends JpaRepository<PortfolioLink, Long> {

    List<PortfolioLink> findAllByUserIdOrderByOrderIndexAsc(Long userId);

    Optional<PortfolioLink> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(MAX(p.orderIndex), -1) FROM PortfolioLink p WHERE p.userId = :userId")
    int findMaxOrderIndexByUserId(Long userId);
}
```

- [ ] **Step 2: Request DTO** (URL 은 http/https 형식 검증)
```java
package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioLinkKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PortfolioLinkRequest(
    @NotNull PortfolioLinkKind kind,
    @NotBlank @Size(max = 100) String title,
    @NotBlank @Size(max = 500)
    @Pattern(regexp = "^https?://.+", message = "http(s):// 로 시작하는 URL 이어야 해요.") String url
) {}
```

- [ ] **Step 3: Response DTO**
```java
package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.domain.PortfolioLinkKind;

public record PortfolioLinkResponse(
    Long id,
    PortfolioLinkKind kind,
    String title,
    String url,
    int orderIndex
) {
    public static PortfolioLinkResponse from(PortfolioLink p) {
        return new PortfolioLinkResponse(p.getId(), p.getKind(), p.getTitle(), p.getUrl(), p.getOrderIndex());
    }
}
```

- [ ] **Step 4: Service** (EducationService 미러)
```java
package com.twochi.profile.portfolio.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.dto.PortfolioLinkRequest;
import com.twochi.profile.portfolio.repository.PortfolioLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PortfolioLinkService {

    private final PortfolioLinkRepository repository;

    @Transactional(readOnly = true)
    public List<PortfolioLink> findAllByUserId(Long userId) {
        return repository.findAllByUserIdOrderByOrderIndexAsc(userId);
    }

    public PortfolioLink create(Long userId, PortfolioLinkRequest req) {
        int order = repository.findMaxOrderIndexByUserId(userId) + 1;
        PortfolioLink p = PortfolioLink.create(userId, req.kind(), req.title(), req.url(), order, Instant.now());
        return repository.save(p);
    }

    public PortfolioLink update(Long userId, Long id, PortfolioLinkRequest req) {
        PortfolioLink p = findOwned(userId, id);
        p.update(req.kind(), req.title(), req.url(), Instant.now());
        return p;
    }

    public void delete(Long userId, Long id) {
        PortfolioLink p = findOwned(userId, id);
        repository.delete(p);
    }

    private PortfolioLink findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PORTFOLIO_LINK_NOT_FOUND));
    }
}
```

- [ ] **Step 5: Controller** (EducationController 미러, 목록은 `{links:[...]}` 래핑)
```java
package com.twochi.profile.portfolio.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.dto.PortfolioLinkRequest;
import com.twochi.profile.portfolio.dto.PortfolioLinkResponse;
import com.twochi.profile.portfolio.service.PortfolioLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/portfolio-links")
@RequiredArgsConstructor
public class PortfolioLinkController {

    private final PortfolioLinkService service;

    @GetMapping
    public ResponseEntity<Map<String, List<PortfolioLinkResponse>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<PortfolioLinkResponse> links = service.findAllByUserId(principal.userId())
            .stream().map(PortfolioLinkResponse::from).toList();
        return ResponseEntity.ok(Map.of("links", links));
    }

    @PostMapping
    public ResponseEntity<PortfolioLinkResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody PortfolioLinkRequest req) {
        PortfolioLink p = service.create(principal.userId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(PortfolioLinkResponse.from(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioLinkResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id,
            @Valid @RequestBody PortfolioLinkRequest req) {
        PortfolioLink p = service.update(principal.userId(), id, req);
        return ResponseEntity.ok(PortfolioLinkResponse.from(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
```
> NOTE: EducationController 는 principal null 체크를 안 한다(인증 필터가 보장). 동일하게 두되, 인증 없을 때 401 이 나는지는 통합테스트로 검증.

- [ ] **Step 6: 통합테스트 작성** (ApplicationIntegrationTest 의 signup/login setUp + **영속 로컬 DB 격리용 deleteAllInBatch clean()** 패턴. 포트폴리오는 posting 불필요.)
```java
package com.twochi.profile.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.portfolio.repository.PortfolioLinkRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PortfolioLinkIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private PortfolioLinkRepository portfolioLinkRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;

    private String token;

    private void clean() {
        portfolioLinkRepository.deleteAllInBatch();
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
                "email", "pf@example.com", "password", "Pass1234!", "nickname", "pf",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "pf@example.com", "password", "Pass1234!")))).andReturn();
        token = om.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private Long createLink(String kind, String title, String url) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", kind, "title", title, "url", url))))
            .andExpect(status().isCreated()).andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void 생성_후_목록_조회() throws Exception {
        createLink("GITHUB", "내 깃허브", "https://github.com/somi");
        createLink("BLOG", "기술 블로그", "https://somi.dev");
        MvcResult r = mockMvc.perform(get("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("links")).hasSize(2);
        assertThat(body.get("links").get(0).get("kind").asText()).isEqualTo("GITHUB");
        assertThat(body.get("links").get(0).get("orderIndex").asInt()).isEqualTo(0);
        assertThat(body.get("links").get(1).get("orderIndex").asInt()).isEqualTo(1);
    }

    @Test
    void 수정() throws Exception {
        Long id = createLink("GITHUB", "old", "https://github.com/old");
        mockMvc.perform(put("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "NOTION", "title", "new", "url", "https://notion.so/x"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.kind").value("NOTION"))
            .andExpect(jsonPath("$.title").value("new"));
    }

    @Test
    void 삭제() throws Exception {
        Long id = createLink("OTHER", "x", "https://x.com");
        mockMvc.perform(delete("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        MvcResult r = mockMvc.perform(get("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token)).andReturn();
        assertThat(om.readTree(r.getResponse().getContentAsString()).get("links")).isEmpty();
    }

    @Test
    void cross_user_수정_404() throws Exception {
        Long id = createLink("GITHUB", "mine", "https://github.com/mine");
        // 다른 사용자
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "bob@example.com", "password", "Pass1234!", "nickname", "bob",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult bobLogin = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!")))).andReturn();
        String bob = om.readTree(bobLogin.getResponse().getContentAsString()).get("accessToken").asText();
        mockMvc.perform(put("/api/v1/me/portfolio-links/" + id)
            .header("Authorization", "Bearer " + bob).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "hack", "url", "https://github.com/hack"))))
            .andExpect(status().isNotFound());
    }

    @Test
    void 검증_실패_400() throws Exception {
        // 빈 title
        mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "", "url", "https://github.com/x"))))
            .andExpect(status().isBadRequest());
        // http(s) 아닌 url
        mockMvc.perform(post("/api/v1/me/portfolio-links")
            .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("kind", "GITHUB", "title", "x", "url", "ftp://x"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/portfolio-links")).andExpect(status().isUnauthorized());
    }
}
```
> 검증 실패가 400 이 아니라 다른 코드면, 프로젝트의 글로벌 예외 핸들러가 `MethodArgumentNotValidException` 을 어떤 status 로 매핑하는지 확인(`grep -rn "MethodArgumentNotValid\|VALIDATION_FAILED" backend/src/main`) 후 기대값을 실제에 맞출 것. 401 vs 403 도 마찬가지(ActivityIntegrationTest 는 401).

- [ ] **Step 7: 테스트 실행**
Run: `cd backend && ./gradlew test --tests "com.twochi.profile.portfolio.PortfolioLinkIntegrationTest"`
Expected: 6 tests PASS

- [ ] **Step 8: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/profile/portfolio/repository/ backend/src/main/java/com/twochi/profile/portfolio/dto/ backend/src/main/java/com/twochi/profile/portfolio/service/ backend/src/main/java/com/twochi/profile/portfolio/controller/ backend/src/test/java/com/twochi/profile/portfolio/
git commit -m "feat(portfolio): 링크 CRUD API (repo/dto/service/controller) + 통합테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: FE 타입 + API 클라이언트

**Files:**
- Create: `frontend/src/lib/types/me-portfolio.ts`
- Create: `frontend/src/lib/api/portfolio.ts`
- Test: `frontend/src/lib/api/__tests__/portfolio.test.ts`

- [ ] **Step 1: 타입**
```typescript
export type PortfolioLinkKind = "GITHUB" | "BLOG" | "NOTION" | "OTHER";

export type PortfolioLink = {
  id: number;
  kind: PortfolioLinkKind;
  title: string;
  url: string;
  orderIndex: number;
};

export type PortfolioLinkRequest = {
  kind: PortfolioLinkKind;
  title: string;
  url: string;
};
```

- [ ] **Step 2: 실패 테스트** (`fetchPortfolioLinks` 가 `{links}` 언래핑하는지)
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchPortfolioLinks, createPortfolioLink, deletePortfolioLink } from "../portfolio";

beforeEach(() => httpMock.mockReset());

describe("portfolio api", () => {
  it("fetch 는 {links} 를 언래핑해 배열 반환", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ links: [{ id: 1, kind: "GITHUB", title: "g", url: "https://github.com/x", orderIndex: 0 }] }) });
    const res = await fetchPortfolioLinks();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links");
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].kind).toBe("GITHUB");
  });

  it("create 는 POST 로 body 전송", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ id: 2, kind: "BLOG", title: "b", url: "https://b.dev", orderIndex: 1 }) });
    await createPortfolioLink({ kind: "BLOG", title: "b", url: "https://b.dev" });
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links", expect.objectContaining({ method: "POST" }));
  });

  it("delete 는 DELETE 메서드", async () => {
    httpMock.mockResolvedValue({ json: async () => ({}) });
    await deletePortfolioLink(5);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links/5", expect.objectContaining({ method: "DELETE" }));
  });
});
```

- [ ] **Step 3: 실패 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/portfolio.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: 클라이언트 구현** (education.ts 의 `{educations}` 언래핑 패턴 미러)
```typescript
import { http } from "@/lib/api/http";
import type { PortfolioLink, PortfolioLinkRequest } from "@/lib/types/me-portfolio";

const BASE = "/api/v1/me/portfolio-links";

export async function fetchPortfolioLinks(): Promise<PortfolioLink[]> {
  const res = await http(BASE);
  const data = await res.json();
  return data.links; // BE 래핑: { links: [...] }
}

export async function createPortfolioLink(req: PortfolioLinkRequest): Promise<PortfolioLink> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function updatePortfolioLink(id: number, req: PortfolioLinkRequest): Promise<PortfolioLink> {
  const res = await http(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deletePortfolioLink(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 5: 통과 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/portfolio.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/types/me-portfolio.ts frontend/src/lib/api/portfolio.ts frontend/src/lib/api/__tests__/portfolio.test.ts
git commit -m "feat(portfolio): FE 타입 + API 클라이언트 + 테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: FE 포트폴리오 모달 단순화 + 추가/편집 배선

**Files:**
- Modify: `frontend/src/components/me/portfolio-modal.tsx`
- Test: `frontend/src/components/me/__tests__/portfolio-modal.test.tsx`

목표: 종류 4종(GITHUB/BLOG/NOTION/OTHER) + 제목 + URL 만. 리치 필드(사용기술·기여요약) 제거. 추가(POST)/편집(prefill+PUT). 저장 성공 시 `onSaved()` 호출 후 `onClose()`.

- [ ] **Step 1: 모달 재작성**
```tsx
"use client";

import { useState } from "react";
import { createPortfolioLink, updatePortfolioLink } from "@/lib/api/portfolio";
import type { PortfolioLink, PortfolioLinkKind } from "@/lib/types/me-portfolio";

type Props = {
  initial?: PortfolioLink;       // 있으면 편집 모드
  onClose: () => void;
  onSaved: () => void;           // 저장 성공 후 목록 갱신용
};

const KINDS: { id: PortfolioLinkKind; lbl: string; glyph: string }[] = [
  { id: "GITHUB", lbl: "GitHub", glyph: "GH" },
  { id: "BLOG",   lbl: "블로그", glyph: "B"  },
  { id: "NOTION", lbl: "Notion", glyph: "N"  },
  { id: "OTHER",  lbl: "기타 URL", glyph: "URL" },
];

export function PortfolioModal({ initial, onClose, onSaved }: Props) {
  const [kind, setKind] = useState<PortfolioLinkKind>(initial?.kind ?? "GITHUB");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const canSave = title.trim() !== "" && /^https?:\/\/.+/.test(url.trim());

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const req = { kind, title: title.trim(), url: url.trim() };
      if (initial) await updatePortfolioLink(initial.id, req);
      else await createPortfolioLink(req);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
      setSaving(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>{initial ? "링크 편집" : "포트폴리오 링크 추가"}</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl">종류 <span className="req">*</span></label>
            <div className="pf-type-grid">
              {KINDS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pf-type-chip${kind === t.id ? " active" : ""}`}
                  onClick={() => setKind(t.id)}
                >
                  <span className="ico">{t.glyph}</span>
                  <span className="lbl">{t.lbl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fld">
            <label className="lbl">제목 <span className="req">*</span></label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="예: 내 GitHub" />
          </div>

          <div className="fld">
            <label className="lbl">URL <span className="req">*</span></label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>

          {error && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13 }}>{error}</div>}
        </div>

        <footer className="foot">
          <button type="button" className="btn ghost sm" onClick={onClose}>취소</button>
          <button type="button" className="btn primary sm" onClick={handleSave} disabled={!canSave || saving}>
            {initial ? "저장" : "추가"}
          </button>
        </footer>
      </div>
    </div>
  );
}
```
> NOTE: `PortfolioLinkType` export 가 portfolio-view 에서 import 되고 있었다. Task 5 에서 그 import 를 제거하므로, 여기서 더 이상 export 하지 않아도 된다. (혹시 다른 사용처가 있으면 grep 으로 확인: `grep -rn "PortfolioLinkType" frontend/src`.)

- [ ] **Step 2: 모달 테스트**
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioModal } from "../portfolio-modal";

const createMock = vi.fn();
const updateMock = vi.fn();
vi.mock("@/lib/api/portfolio", () => ({
  createPortfolioLink: (...a: unknown[]) => createMock(...a),
  updatePortfolioLink: (...a: unknown[]) => updateMock(...a),
}));

beforeEach(() => { createMock.mockReset(); updateMock.mockReset(); });

describe("PortfolioModal", () => {
  it("추가 모드 — 제목·URL 입력 후 추가 시 createPortfolioLink 호출", async () => {
    createMock.mockResolvedValue({ id: 1 });
    const onSaved = vi.fn(); const onClose = vi.fn();
    render(<PortfolioModal onClose={onClose} onSaved={onSaved} />);
    fireEvent.change(screen.getByPlaceholderText("예: 내 GitHub"), { target: { value: "내 깃" } });
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://github.com/x" } });
    fireEvent.click(screen.getByText("추가"));
    await waitFor(() => expect(createMock).toHaveBeenCalledWith({ kind: "GITHUB", title: "내 깃", url: "https://github.com/x" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("편집 모드 — initial prefill + 저장 시 updatePortfolioLink 호출", async () => {
    updateMock.mockResolvedValue({ id: 7 });
    const onSaved = vi.fn();
    render(<PortfolioModal initial={{ id: 7, kind: "BLOG", title: "옛 제목", url: "https://old.dev", orderIndex: 0 }} onClose={vi.fn()} onSaved={onSaved} />);
    expect((screen.getByPlaceholderText("예: 내 GitHub") as HTMLInputElement).value).toBe("옛 제목");
    fireEvent.click(screen.getByText("저장"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith(7, { kind: "BLOG", title: "옛 제목", url: "https://old.dev" }));
  });

  it("잘못된 URL 이면 추가 버튼 비활성", () => {
    render(<PortfolioModal onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("예: 내 GitHub"), { target: { value: "t" } });
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "ftp://x" } });
    expect(screen.getByText("추가")).toBeDisabled();
  });
});
```

- [ ] **Step 3: 테스트 실행**
Run: `cd frontend && npx vitest run src/components/me/__tests__/portfolio-modal.test.tsx`
Expected: PASS (3 tests). (포트폴리오 모달 CSS 클래스는 기존 그대로라 스타일 영향 없음.)

- [ ] **Step 4: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/portfolio-modal.tsx frontend/src/components/me/__tests__/portfolio-modal.test.tsx
git commit -m "feat(portfolio): 모달 단순화(4종+제목+URL) + 추가/편집 배선

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: FE 포트폴리오 뷰 실배선 + 페이지 + mock 정리

**Files:**
- Modify: `frontend/src/components/me/portfolio-view.tsx`
- Modify: `frontend/src/app/(app)/me/portfolio/page.tsx`
- Modify: `frontend/src/lib/mock/me.ts`
- Test: `frontend/src/components/me/__tests__/portfolio-view.test.tsx` (재작성)

- [ ] **Step 1: 뷰 재작성** (자체 fetch, 편집/삭제, 파일 버튼 비활성, FileRow 제거)
```tsx
"use client";

import { useEffect, useState } from "react";
import { Edit, Trash, Link as LinkIco } from "@/components/ui/icons";
import { fetchPortfolioLinks, deletePortfolioLink } from "@/lib/api/portfolio";
import type { PortfolioLink, PortfolioLinkKind } from "@/lib/types/me-portfolio";
import { PortfolioModal } from "./portfolio-modal";

const GitHubSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
const NotionSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const UploadSvg = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

function toneClass(kind: PortfolioLinkKind): string {
  if (kind === "NOTION") return " lav";
  if (kind === "BLOG") return " mint";
  return "";
}
function KindIcon({ kind }: { kind: PortfolioLinkKind }) {
  if (kind === "GITHUB") return <GitHubSvg />;
  if (kind === "NOTION") return <NotionSvg />;
  return <LinkIco size={18} />;
}
function kindLabel(kind: PortfolioLinkKind): string {
  if (kind === "GITHUB") return "GitHub";
  if (kind === "NOTION") return "Notion";
  if (kind === "BLOG") return "Blog";
  return "링크";
}

export function PortfolioView() {
  const [links, setLinks] = useState<PortfolioLink[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioLink | undefined>();

  function load() {
    fetchPortfolioLinks()
      .then(setLinks)
      .catch((e) => setError(e instanceof Error ? e.message : "포트폴리오를 불러오지 못했어요."));
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    try {
      await deletePortfolioLink(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요.");
    }
  }

  const isEmpty = links !== null && links.length === 0;

  return (
    <section className="me-section">
      <div className="sec-head">
        <div className="sec-title">포트폴리오</div>
        <div className="head-r">
          <button className="btn secondary sm" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
            <LinkIco size={13} /> 링크 추가
          </button>
          <button className="btn secondary sm" disabled title="곧 제공될 기능이에요">
            <UploadSvg /> 파일 업로드 (준비 중)
          </button>
        </div>
      </div>

      {error && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {links === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : isEmpty ? (
        <div className="list-empty">아직 등록된 포트폴리오가 없어요. 첫 링크를 추가해보세요.</div>
      ) : (
        <div className="list">
          {links.map((link) => (
            <div key={link.id} className={`list-row${toneClass(link.kind)}`}>
              <span className="badge-ico"><KindIcon kind={link.kind} /></span>
              <a className="body" href={link.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <div className="nm">{link.title}</div>
                <div className="meta">{link.url}</div>
              </a>
              <span className="kind-pill">{kindLabel(link.kind)}</span>
              <div className="actions">
                <button className="iconbtn" aria-label="편집" onClick={() => { setEditing(link); setModalOpen(true); }}><Edit size={14} /></button>
                <button className="iconbtn" aria-label="삭제" onClick={() => handleDelete(link.id)}><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <PortfolioModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </section>
  );
}
```
> NOTE: 원래 LinkRow 는 전체 행이 `<a>` 였다. 이제 행 안에 편집/삭제 버튼이 있으므로 행 전체를 `<a>` 로 감싸면 버튼 클릭이 링크 이동과 충돌한다. 따라서 본문(`.body`)만 `<a>` 로, 행은 `<div>` 로 변경했다. 기존 `.list-row` CSS 가 `<div>` 에도 동일 적용되는지 확인(클래스 기반이라 적용됨).

- [ ] **Step 2: 페이지에서 mock 제거**
```tsx
import { PageHeader } from "@/components/me/page-header";
import { PortfolioView } from "@/components/me/portfolio-view";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader section="portfolio" />
      <PortfolioView />
    </>
  );
}
```

- [ ] **Step 3: mock/me.ts 에서 PORTFOLIO_* 제거**
먼저 `grep -rn "PORTFOLIO_MOCK\|PortfolioSnapshot\|PortfolioFile\|PortfolioLink" frontend/src | grep "mock/me"` 와 외부 사용처 확인. portfolio-view/page 가 더 이상 mock 을 import 하지 않으면, `frontend/src/lib/mock/me.ts` 에서 `PORTFOLIO_MOCK` 상수와 `PortfolioSnapshot`, `PortfolioLink`(mock), `PortfolioFile` 타입을 제거한다. (다른 곳에서 import 중이면 남기고 보고.)

- [ ] **Step 4: 뷰 테스트 재작성**
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioView } from "../portfolio-view";

const fetchMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("@/lib/api/portfolio", () => ({
  fetchPortfolioLinks: (...a: unknown[]) => fetchMock(...a),
  deletePortfolioLink: (...a: unknown[]) => deleteMock(...a),
  createPortfolioLink: vi.fn(),
  updatePortfolioLink: vi.fn(),
}));

beforeEach(() => { fetchMock.mockReset(); deleteMock.mockReset(); });

describe("PortfolioView", () => {
  it("빈 상태 안내", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PortfolioView />);
    expect(await screen.findByText(/아직 등록된 포트폴리오가 없어요/)).toBeInTheDocument();
  });

  it("링크 목록 렌더 (제목·URL·종류 pill)", async () => {
    fetchMock.mockResolvedValue([
      { id: 1, kind: "GITHUB", title: "내 깃허브", url: "https://github.com/somi", orderIndex: 0 },
      { id: 2, kind: "BLOG", title: "기술 블로그", url: "https://somi.dev", orderIndex: 1 },
    ]);
    render(<PortfolioView />);
    expect(await screen.findByText("내 깃허브")).toBeInTheDocument();
    expect(screen.getByText("기술 블로그")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/somi")).toBeInTheDocument();
  });

  it("삭제 버튼 → deletePortfolioLink 호출", async () => {
    fetchMock.mockResolvedValue([{ id: 9, kind: "OTHER", title: "x", url: "https://x.com", orderIndex: 0 }]);
    deleteMock.mockResolvedValue(undefined);
    render(<PortfolioView />);
    await screen.findByText("x");
    fireEvent.click(screen.getByLabelText("삭제"));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(9));
  });

  it("파일 업로드 버튼은 비활성(준비 중)", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PortfolioView />);
    await screen.findByText(/아직 등록된 포트폴리오가 없어요/);
    expect(screen.getByText(/파일 업로드/)).toBeDisabled();
  });
});
```

- [ ] **Step 5: 테스트 + 린트 + 타입**
Run: `cd frontend && npx vitest run src/components/me src/lib/api/__tests__/portfolio.test.ts && npm run lint`
Expected: 통과, lint 0 errors. 그 다음 전체: `npx vitest run` (기존 테스트 무영향 확인 — 특히 옛 portfolio-view 테스트가 재작성됐는지).

- [ ] **Step 6: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/portfolio-view.tsx "frontend/src/app/(app)/me/portfolio/page.tsx" frontend/src/lib/mock/me.ts frontend/src/components/me/__tests__/portfolio-view.test.tsx
git commit -m "feat(portfolio): 포트폴리오 뷰 실배선(편집·삭제) + 파일 준비중 + mock 정리

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 통합 검증 + PR

- [ ] **Step 1: 백엔드 전체 테스트**
Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: 프론트 린트 + 전체 테스트 + 타입체크**
Run: `cd frontend && npm run lint && npx vitest run`
Expected: lint 0 errors, 전체 그린

- [ ] **Step 3: 브랜치 push + develop PR**
```bash
git push -u origin feat/me-portfolio-links
gh pr create --base develop --title "feat(portfolio): 내 정보 포트폴리오 링크 CRUD" --body "<요약: PortfolioLink BE CRUD(V10) + FE 실배선(추가/편집/삭제). 파일 업로드는 fast-follow(버튼 준비중). 검증: BE ./gradlew test, FE lint+vitest.>"
```

---

## Self-Review

**1. Spec coverage:**
- 데이터 모델(kind 4종/title/url/orderIndex) → Task 1 ✅
- BE CRUD 엔드포인트(GET 래핑/POST/PUT/DELETE) → Task 2 ✅
- cross-user 404, 검증, 401 → Task 2 통합테스트 ✅
- Flyway V10 → Task 1 ✅
- ErrorCode → Task 1 ✅
- FE 타입/클라이언트(`{links}` 언래핑) → Task 3 ✅
- 모달 단순화 + 추가/편집 → Task 4 ✅
- 뷰 실배선 + 편집/삭제 + 파일 준비중 + mock 정리 → Task 5 ✅
- 테스트(BE 통합 / FE client·modal·view) → Task 2/3/4/5 ✅
- 범위 밖(파일/완성도공식/재정렬/자동감지) → 미구현, 파일 버튼 비활성 ✅

**2. Placeholder scan:** 모든 스텝에 실제 코드/명령 포함. "실제에 맞춰 확인" 표기는 프로젝트별 글로벌 예외 status(400 vs 기타), 401 vs 403, mock 사용처 확인용 — placeholder 아님(검증 지시).

**3. Type consistency:**
- BE: `PortfolioLinkRequest(kind,title,url)` ↔ Service/Controller 사용 일치. `PortfolioLinkResponse(id,kind,title,url,orderIndex)` ↔ FE `PortfolioLink` 일치.
- FE: `PortfolioLinkKind` 대문자(GITHUB/BLOG/NOTION/OTHER) ↔ BE enum 일치 ↔ 뷰 helper(toneClass/KindIcon/kindLabel) switch 대문자 일치.
- API 클라이언트 함수명(fetchPortfolioLinks/create/update/deletePortfolioLink) ↔ 모달/뷰 import 일치.
- 모달 props(initial/onClose/onSaved) ↔ 뷰의 사용 일치.

**알려진 실행 시 확인:**
- 글로벌 검증 예외 → HTTP status(400 기대; 다르면 테스트 기대값 조정).
- 401 vs 403(인증 없음) — ActivityIntegrationTest 는 401 통과했으므로 401 기대.
- `.list-row` 를 `<a>` → `<div>` 로 바꾼 것에 대한 CSS 적용(클래스 기반이라 OK 예상, 시각 확인 권장).
