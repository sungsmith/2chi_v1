# 포트폴리오 파일 업로드 (MinIO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 내 정보 포트폴리오 탭에 파일 업로드/목록/다운로드(presigned)/삭제를 붙인다 (PDF·PNG·JPG, 10MB, 유저당 10개).

**Architecture:** 업로드는 multipart 로 BE 경유(검증+메타 저장), 저장은 MinIO. 다운로드는 BE 가 presigned GET URL 을 발급하고 브라우저가 navigation 으로 MinIO 에서 직접 받음. `FileStorage` 인터페이스로 추상화 → 테스트에선 `@MockBean`(MinIO 는 CI 에 없음, OpenAI 와 동일 패턴).

**Tech Stack:** Spring Boot(multipart, JPA, Flyway), MinIO Java SDK, JUnit5 + MockMvc / Next.js(modified), React, Vitest + RTL, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-10-portfolio-file-upload-design.md`

**확정 사항:**
- 허용: `application/pdf`, `image/png`, `image/jpeg`. 서비스 크기 한도 10MB, 멀티파트 한도 12MB(요청 15MB) — 서비스 검증이 결정적으로 테스트되도록 멀티파트를 약간 크게.
- 유저당 10개. objectKey = `{userId}/{uuid}.{ext}`. 버킷 `portfolio`.
- 인증: `@AuthenticationPrincipal com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser`, null→`BusinessException(ErrorCode.UNAUTHENTICATED)`.
- GlobalExceptionHandler(`com.twochi.common.exception`)는 BusinessException→code.status(), 그 외 Exception→500. **MaxUploadSizeExceededException 핸들러 신규 추가** 필요.

---

## File Structure
- Modify: `backend/build.gradle.kts` (minio dep)
- Modify: `backend/src/main/resources/application.yml` (multipart + minio props)
- Create: `backend/src/main/java/com/twochi/profile/portfolio/storage/FileStorage.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/storage/MinioFileStorage.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/config/MinioConfig.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/domain/PortfolioFile.java`
- Create: `backend/src/main/resources/db/migration/V11__portfolio_file.sql` (+ `V11_R__rollback.sql`)
- Create: `backend/src/main/java/com/twochi/profile/portfolio/repository/PortfolioFileRepository.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/dto/PortfolioFileResponse.java`, `dto/DownloadUrlResponse.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/service/PortfolioFileService.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/controller/PortfolioFileController.java`
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`, `GlobalExceptionHandler.java`
- Test: `backend/src/test/java/com/twochi/profile/portfolio/PortfolioFileIntegrationTest.java`
- Create: `frontend/src/lib/types/me-portfolio-file.ts`, `frontend/src/lib/api/portfolio-file.ts` (+ test)
- Modify: `frontend/src/components/me/portfolio-view.tsx` (+ test)

---

## Task 1: BE 의존성 + MinIO 설정 + 스토리지 추상화

**Files:**
- Modify: `backend/build.gradle.kts`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/storage/FileStorage.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/storage/MinioFileStorage.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/config/MinioConfig.java`

- [ ] **Step 1: gradle 의존성 추가**
`backend/build.gradle.kts` 의 dependencies 블록에 추가(다른 implementation 라인 옆):
```kotlin
	implementation("io.minio:minio:8.5.17")
```
> 만약 8.5.17 해석 실패 시 8.5.x 최신으로. minio 는 okhttp 의존을 끌어옴(Spring Boot 와 충돌 없음).

- [ ] **Step 2: application.yml — multipart + minio**
`spring:` 하위에 `servlet.multipart` 추가, 최상위에 `minio:` 블록 추가. 기존 `spring.datasource`/`jpa`/`flyway`/`data.redis` 는 그대로 두고 병합:
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 12MB
      max-request-size: 15MB
```
그리고 파일 맨 아래 `master-answer:` 블록 아래에 추가:
```yaml
minio:
  endpoint: ${MINIO_ENDPOINT:http://localhost:9000}
  access-key: ${MINIO_ROOT_USER:}
  secret-key: ${MINIO_ROOT_PASSWORD:}
  bucket: ${MINIO_BUCKET:portfolio}
```

- [ ] **Step 3: FileStorage 인터페이스**
```java
package com.twochi.profile.portfolio.storage;

import java.io.InputStream;

public interface FileStorage {
    void put(String objectKey, InputStream data, long size, String contentType);
    /** 만료 짧은 presigned GET URL. 다운로드 시 원본 파일명으로 저장되도록 content-disposition 포함. */
    String presignedGetUrl(String objectKey, String downloadFilename);
    void remove(String objectKey);
}
```

- [ ] **Step 4: MinioConfig (client bean + 버킷 보장)**
버킷 보장은 `@Profile("!test")` 로 — 테스트 컨텍스트에서 MinIO 접속 안 하도록. MinioClient 빌드 자체는 연결하지 않으므로 무조건 빈으로 둬도 무방하나, 테스트에선 MinioFileStorage 가 @MockBean 으로 대체됨.
```java
package com.twochi.profile.portfolio.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class MinioConfig {

    @Bean
    public MinioClient minioClient(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey) {
        return MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .build();
    }

    @Bean
    @Profile("!test")
    @Slf4j
    public ApplicationRunner ensurePortfolioBucket(MinioClient client, @Value("${minio.bucket}") String bucket) {
        return args -> {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        };
    }
}
```
> `@Slf4j` on a method isn't valid — remove it; if logging is wanted use a local logger. Keep the runner minimal (no logging) to avoid that. Final: drop `@Slf4j` and the import.

- [ ] **Step 5: MinioFileStorage 구현**
```java
package com.twochi.profile.portfolio.storage;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class MinioFileStorage implements FileStorage {

    private final MinioClient client;
    private final String bucket;

    public MinioFileStorage(MinioClient client, @Value("${minio.bucket}") String bucket) {
        this.client = client;
        this.bucket = bucket;
    }

    @Override
    public void put(String objectKey, InputStream data, long size, String contentType) {
        try {
            client.putObject(PutObjectArgs.builder()
                .bucket(bucket).object(objectKey)
                .stream(data, size, -1)
                .contentType(contentType)
                .build());
        } catch (Exception e) {
            throw new RuntimeException("파일 저장에 실패했어요.", e);
        }
    }

    @Override
    public String presignedGetUrl(String objectKey, String downloadFilename) {
        String encoded = URLEncoder.encode(downloadFilename, StandardCharsets.UTF_8).replace("+", "%20");
        String disposition = "attachment; filename*=UTF-8''" + encoded;
        try {
            return client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucket).object(objectKey)
                .expiry(5, TimeUnit.MINUTES)
                .extraQueryParams(Map.of("response-content-disposition", disposition))
                .build());
        } catch (Exception e) {
            throw new RuntimeException("다운로드 URL 생성에 실패했어요.", e);
        }
    }

    @Override
    public void remove(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception e) {
            throw new RuntimeException("파일 삭제에 실패했어요.", e);
        }
    }
}
```

- [ ] **Step 6: 컴파일**
Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL (minio 의존성 해석 + 컴파일). 실패 시 minio 버전 조정.

- [ ] **Step 7: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/build.gradle.kts backend/src/main/resources/application.yml backend/src/main/java/com/twochi/profile/portfolio/storage/ backend/src/main/java/com/twochi/profile/portfolio/config/
git commit -m "feat(portfolio): MinIO 의존성·설정 + FileStorage 추상화

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: BE 엔티티 + V11 마이그레이션 + ErrorCode + Repository

**Files:**
- Create: `backend/src/main/java/com/twochi/profile/portfolio/domain/PortfolioFile.java`
- Create: `backend/src/main/resources/db/migration/V11__portfolio_file.sql` (+ `V11_R__rollback.sql`)
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/repository/PortfolioFileRepository.java`

- [ ] **Step 1: 엔티티** (PortfolioLink 컨벤션과 동일: @Getter, @NoArgsConstructor(PROTECTED), private 생성자 + static create)
```java
package com.twochi.profile.portfolio.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "portfolio_file")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    private PortfolioFile(Long userId, String filename, String contentType, long sizeBytes,
                         String objectKey, Instant now) {
        this.userId = userId;
        this.filename = filename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.objectKey = objectKey;
        this.createdAt = now;
    }

    public static PortfolioFile create(Long userId, String filename, String contentType,
                                       long sizeBytes, String objectKey, Instant now) {
        return new PortfolioFile(userId, filename, contentType, sizeBytes, objectKey, now);
    }
}
```

- [ ] **Step 2: V11 마이그레이션** (V10 이 최신인지 `ls .../db/migration | grep V1 | sort -V | tail` 확인 후)
```sql
-- V11__portfolio_file.sql — 포트폴리오 업로드 파일 메타
CREATE TABLE portfolio_file (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    filename     VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes   BIGINT       NOT NULL,
    object_key   VARCHAR(300) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_portfolio_file_user ON portfolio_file (user_id, created_at DESC);
```

- [ ] **Step 3: V11 rollback** (V10_R 스타일)
```sql
-- V11_R__rollback.sql
DROP INDEX IF EXISTS idx_portfolio_file_user;
DROP TABLE IF EXISTS portfolio_file;
```

- [ ] **Step 4: ErrorCode 추가**
`ErrorCode.java` 의 마지막 상수(`PROFILE_NOT_FOUND(...)`) 의 세미콜론을 콤마로 바꾸고 아래 4개 추가(마지막 줄에 세미콜론):
```java
    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "프로필 정보를 찾을 수 없어요."),
    PORTFOLIO_FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "포트폴리오 파일을 찾을 수 없어요."),
    UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식이에요. (PDF·PNG·JPG)"),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "파일이 너무 커요. 10MB 이하만 올릴 수 있어요."),
    FILE_LIMIT_EXCEEDED(HttpStatus.CONFLICT, "포트폴리오 파일은 최대 10개까지 올릴 수 있어요.");
```
(기존 마지막 줄 PROFILE_NOT_FOUND 의 `;` → `,` 로 변경, 정확한 형식 유지.)

- [ ] **Step 5: Repository**
```java
package com.twochi.profile.portfolio.repository;

import com.twochi.profile.portfolio.domain.PortfolioFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioFileRepository extends JpaRepository<PortfolioFile, Long> {
    List<PortfolioFile> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<PortfolioFile> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
```

- [ ] **Step 6: 컴파일**
Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/profile/portfolio/domain/PortfolioFile.java backend/src/main/resources/db/migration/V11__portfolio_file.sql backend/src/main/resources/db/migration/V11_R__rollback.sql backend/src/main/java/com/twochi/common/exception/ErrorCode.java backend/src/main/java/com/twochi/profile/portfolio/repository/PortfolioFileRepository.java
git commit -m "feat(portfolio): PortfolioFile 엔티티 + V11 + ErrorCode + repository

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: BE DTO + 서비스 + 컨트롤러 + 업로드 예외 핸들러 + 통합테스트

**Files:**
- Create: `backend/src/main/java/com/twochi/profile/portfolio/dto/PortfolioFileResponse.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/dto/DownloadUrlResponse.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/service/PortfolioFileService.java`
- Create: `backend/src/main/java/com/twochi/profile/portfolio/controller/PortfolioFileController.java`
- Modify: `backend/src/main/java/com/twochi/common/exception/GlobalExceptionHandler.java`
- Test: `backend/src/test/java/com/twochi/profile/portfolio/PortfolioFileIntegrationTest.java`

- [ ] **Step 1: Response DTOs**
```java
package com.twochi.profile.portfolio.dto;

import com.twochi.profile.portfolio.domain.PortfolioFile;
import java.time.Instant;

public record PortfolioFileResponse(Long id, String filename, String contentType, long sizeBytes, Instant createdAt) {
    public static PortfolioFileResponse from(PortfolioFile f) {
        return new PortfolioFileResponse(f.getId(), f.getFilename(), f.getContentType(), f.getSizeBytes(), f.getCreatedAt());
    }
}
```
```java
package com.twochi.profile.portfolio.dto;

public record DownloadUrlResponse(String url) {}
```

- [ ] **Step 2: Service**
```java
package com.twochi.profile.portfolio.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.domain.PortfolioFile;
import com.twochi.profile.portfolio.repository.PortfolioFileRepository;
import com.twochi.profile.portfolio.storage.FileStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PortfolioFileService {

    private static final long MAX_SIZE = 10L * 1024 * 1024; // 10MB
    private static final int MAX_COUNT = 10;
    private static final Map<String, String> EXT = Map.of(
        "application/pdf", "pdf", "image/png", "png", "image/jpeg", "jpg");

    private final PortfolioFileRepository repository;
    private final FileStorage storage;

    public PortfolioFile upload(Long userId, MultipartFile file) {
        String contentType = file.getContentType();
        String ext = contentType == null ? null : EXT.get(contentType);
        if (ext == null) throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        if (file.getSize() > MAX_SIZE) throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        if (repository.countByUserId(userId) >= MAX_COUNT) throw new BusinessException(ErrorCode.FILE_LIMIT_EXCEEDED);

        String objectKey = userId + "/" + UUID.randomUUID() + "." + ext;
        try {
            storage.put(objectKey, file.getInputStream(), file.getSize(), contentType);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
        String filename = file.getOriginalFilename() == null ? ("portfolio." + ext) : file.getOriginalFilename();
        return repository.save(PortfolioFile.create(userId, filename, contentType, file.getSize(), objectKey, Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<PortfolioFile> list(Long userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public String downloadUrl(Long userId, Long id) {
        PortfolioFile f = findOwned(userId, id);
        return storage.presignedGetUrl(f.getObjectKey(), f.getFilename());
    }

    public void delete(Long userId, Long id) {
        PortfolioFile f = findOwned(userId, id);
        storage.remove(f.getObjectKey());
        repository.delete(f);
    }

    private PortfolioFile findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PORTFOLIO_FILE_NOT_FOUND));
    }
}
```

- [ ] **Step 3: Controller**
```java
package com.twochi.profile.portfolio.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.dto.DownloadUrlResponse;
import com.twochi.profile.portfolio.dto.PortfolioFileResponse;
import com.twochi.profile.portfolio.service.PortfolioFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/portfolio-files")
@RequiredArgsConstructor
public class PortfolioFileController {

    private final PortfolioFileService service;

    @PostMapping
    public ResponseEntity<PortfolioFileResponse> upload(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam("file") MultipartFile file) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PortfolioFileResponse.from(service.upload(principal.userId(), file)));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<PortfolioFileResponse>>> list(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        List<PortfolioFileResponse> files = service.list(principal.userId())
            .stream().map(PortfolioFileResponse::from).toList();
        return ResponseEntity.ok(Map.of("files", files));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<DownloadUrlResponse> download(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.ok(new DownloadUrlResponse(service.downloadUrl(principal.userId(), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: GlobalExceptionHandler 에 업로드 초과 핸들러 추가**
import `org.springframework.web.multipart.MaxUploadSizeExceededException;` 추가하고, `handleUnknown` 위에 추가:
```java
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUpload(MaxUploadSizeExceededException ex) {
        String traceId = UUID.randomUUID().toString();
        return ResponseEntity
            .status(ErrorCode.FILE_TOO_LARGE.status())
            .body(ErrorResponse.of(ErrorCode.FILE_TOO_LARGE, ErrorCode.FILE_TOO_LARGE.defaultMessage(), traceId));
    }
```
> `ErrorResponse.of(code, message, traceId)` 시그니처가 기존 사용처(`handleUnreadable`)와 동일한지 확인하고 그 형태로 맞출 것.

- [ ] **Step 5: 통합테스트** (`@MockBean FileStorage`, deleteAllInBatch 격리, MockMultipartFile)
```java
package com.twochi.profile.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.profile.portfolio.repository.PortfolioFileRepository;
import com.twochi.profile.portfolio.storage.FileStorage;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PortfolioFileIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private RedisConnectionFactory redis;
    @Autowired private PortfolioFileRepository fileRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private UserRepository userRepository;
    @MockBean private FileStorage fileStorage;

    private String token;

    private void clean() {
        fileRepository.deleteAllInBatch();
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

    private MockMultipartFile pdf(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/pdf", bytes);
    }

    @Test
    void 업로드_후_목록() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("이력서.pdf", "hello".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated()).andReturn();
        JsonNode body = om.readTree(r.getResponse().getContentAsString());
        assertThat(body.get("filename").asText()).isEqualTo("이력서.pdf");
        assertThat(body.get("contentType").asText()).isEqualTo("application/pdf");
        verify(fileStorage).put(anyString(), any(), anyLong(), eq("application/pdf"));

        MvcResult list = mockMvc.perform(get("/api/v1/me/portfolio-files")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(list.getResponse().getContentAsString()).get("files")).hasSize(1);
    }

    @Test
    void 타입_불가_400() throws Exception {
        mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(new MockMultipartFile("file", "a.txt", "text/plain", "x".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 개수_초과_409() throws Exception {
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                    .file(pdf("f" + i + ".pdf", "x".getBytes()))
                    .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
        }
        mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("over.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isConflict());
    }

    @Test
    void 다운로드_presigned_url() throws Exception {
        when(fileStorage.presignedGetUrl(anyString(), anyString())).thenReturn("http://localhost:9000/portfolio/x?sig=abc");
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        MvcResult d = mockMvc.perform(get("/api/v1/me/portfolio-files/" + id + "/download")
            .header("Authorization", "Bearer " + token)).andExpect(status().isOk()).andReturn();
        assertThat(om.readTree(d.getResponse().getContentAsString()).get("url").asText()).contains("sig=abc");
    }

    @Test
    void 삭제_204_및_storage_remove() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(delete("/api/v1/me/portfolio-files/" + id)
            .header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        verify(fileStorage).remove(anyString());
    }

    @Test
    void cross_user_다운로드_404() throws Exception {
        MvcResult r = mockMvc.perform(multipart("/api/v1/me/portfolio-files")
                .file(pdf("a.pdf", "x".getBytes()))
                .header("Authorization", "Bearer " + token)).andReturn();
        Long id = om.readTree(r.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of(
                "email", "bob@example.com", "password", "Pass1234!", "nickname", "bob",
                "ageConfirmed", true,
                "consents", Map.of("terms", true, "privacy", true, "marketing", false)))));
        MvcResult bl = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(om.writeValueAsString(Map.of("email", "bob@example.com", "password", "Pass1234!")))).andReturn();
        String bob = om.readTree(bl.getResponse().getContentAsString()).get("accessToken").asText();
        mockMvc.perform(get("/api/v1/me/portfolio-files/" + id + "/download")
            .header("Authorization", "Bearer " + bob)).andExpect(status().isNotFound());
    }

    @Test
    void 인증_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me/portfolio-files")).andExpect(status().isUnauthorized());
    }
}
```
> 검증 status(타입 400, 개수 409, 인증 401)가 실제 GlobalExceptionHandler 매핑과 일치하는지 확인(BusinessException→code.status()). MockMvc 멀티파트는 `multipart(...)` + `.file(...)` 사용. `@MockBean FileStorage` 라 실제 MinIO 접속 없음.

- [ ] **Step 6: 테스트 실행**
Run: `cd backend && ./gradlew test --tests "com.twochi.profile.portfolio.*"`
Expected: 기존 PortfolioLinkIntegrationTest + 새 PortfolioFileIntegrationTest 모두 PASS

- [ ] **Step 7: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/profile/portfolio/dto/ backend/src/main/java/com/twochi/profile/portfolio/service/PortfolioFileService.java backend/src/main/java/com/twochi/profile/portfolio/controller/PortfolioFileController.java backend/src/main/java/com/twochi/common/exception/GlobalExceptionHandler.java backend/src/test/java/com/twochi/profile/portfolio/PortfolioFileIntegrationTest.java
git commit -m "feat(portfolio): 파일 업로드/목록/다운로드(presigned)/삭제 API + 통합테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: FE 타입 + API 클라이언트

**Files:**
- Create: `frontend/src/lib/types/me-portfolio-file.ts`
- Create: `frontend/src/lib/api/portfolio-file.ts`
- Test: `frontend/src/lib/api/__tests__/portfolio-file.test.ts`

먼저 `frontend/src/lib/api/http.ts` 를 읽어 `http(input, init)` 가 FormData 를 그대로 보내는지(Content-Type 강제 안 함) + 토큰을 어떻게 붙이는지 확인. http() 가 Authorization 만 set 하고 Content-Type 은 안 건드리면, 업로드는 `http(BASE, { method:"POST", body: formData })` 로 OK(브라우저가 multipart boundary 설정).

- [ ] **Step 1: 타입**
```typescript
export type PortfolioFile = {
  id: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};
```

- [ ] **Step 2: 실패 테스트**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchPortfolioFiles, uploadPortfolioFile, getPortfolioFileDownloadUrl, deletePortfolioFile } from "../portfolio-file";

beforeEach(() => httpMock.mockReset());

describe("portfolio-file api", () => {
  it("목록은 {files} 언래핑", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ files: [{ id: 1, filename: "a.pdf", contentType: "application/pdf", sizeBytes: 10, createdAt: "2026-06-10T00:00:00Z" }] }) });
    const res = await fetchPortfolioFiles();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files");
    expect(res[0].filename).toBe("a.pdf");
  });

  it("업로드는 POST + FormData(body 에 file)", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ id: 2 }) });
    const file = new File(["x"], "r.pdf", { type: "application/pdf" });
    await uploadPortfolioFile(file);
    const call = httpMock.mock.calls[0];
    expect(call[0]).toBe("/api/v1/me/portfolio-files");
    expect(call[1].method).toBe("POST");
    expect(call[1].body).toBeInstanceOf(FormData);
    expect((call[1].body as FormData).get("file")).toBe(file);
  });

  it("다운로드 URL 조회", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ url: "http://minio/x?sig=1" }) });
    const url = await getPortfolioFileDownloadUrl(5);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files/5/download");
    expect(url).toBe("http://minio/x?sig=1");
  });

  it("삭제는 DELETE", async () => {
    httpMock.mockResolvedValue({ json: async () => ({}) });
    await deletePortfolioFile(7);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files/7", expect.objectContaining({ method: "DELETE" }));
  });
});
```

- [ ] **Step 3: 실패 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/portfolio-file.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: 클라이언트**
```typescript
import { http } from "@/lib/api/http";
import type { PortfolioFile } from "@/lib/types/me-portfolio-file";

const BASE = "/api/v1/me/portfolio-files";

export async function fetchPortfolioFiles(): Promise<PortfolioFile[]> {
  const res = await http(BASE);
  const data = await res.json();
  return data.files;
}

export async function uploadPortfolioFile(file: File): Promise<PortfolioFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await http(BASE, { method: "POST", body: form });
  return res.json();
}

export async function getPortfolioFileDownloadUrl(id: number): Promise<string> {
  const res = await http(`${BASE}/${id}/download`);
  const data = await res.json();
  return data.url;
}

export async function deletePortfolioFile(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
```
> 만약 http() 가 항상 `Content-Type: application/json` 을 강제한다면 업로드가 깨짐 — 그 경우 uploadPortfolioFile 만 http 대신 직접 fetch(apiUrl(BASE), { method, body: form, headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials:"include" }) 로 구현(http.ts 의 apiUrl/getAccessToken export 사용). Step 으로 진행 전 http.ts 확인 필수.

- [ ] **Step 5: 통과 확인**
Run: `cd frontend && npx vitest run src/lib/api/__tests__/portfolio-file.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/types/me-portfolio-file.ts frontend/src/lib/api/portfolio-file.ts frontend/src/lib/api/__tests__/portfolio-file.test.ts
git commit -m "feat(portfolio): FE 파일 API 클라이언트 + 타입 + 테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: FE 포트폴리오 뷰 — 파일 업로드/목록/다운로드/삭제

**Files:**
- Modify: `frontend/src/components/me/portfolio-view.tsx`
- Test: `frontend/src/components/me/__tests__/portfolio-view.test.tsx`

현재 portfolio-view 는 링크만 fetch/렌더하고 "파일 업로드" 버튼은 `disabled`. 파일 섹션을 추가한다. READ 현재 파일 먼저.

- [ ] **Step 1: 파일 크기 포맷 헬퍼 + 상태/핸들러 추가**
portfolio-view 에 파일 상태와 핸들러를 추가. 파일 input 은 숨김 `<input ref>` 로 트리거.
핵심 변경(현재 컴포넌트에 통합):
```tsx
import { fetchPortfolioFiles, uploadPortfolioFile, getPortfolioFileDownloadUrl, deletePortfolioFile } from "@/lib/api/portfolio-file";
import type { PortfolioFile } from "@/lib/types/me-portfolio-file";
import { useRef } from "react";

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
```
컴포넌트 내부 상태:
```tsx
const [files, setFiles] = useState<PortfolioFile[] | null>(null);
const [fileError, setFileError] = useState<string | undefined>();
const fileInputRef = useRef<HTMLInputElement>(null);

function loadFiles() {
  fetchPortfolioFiles().then(setFiles).catch((e) => setFileError(e instanceof Error ? e.message : "파일을 불러오지 못했어요."));
}
useEffect(() => { loadFiles(); }, []);

async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = ""; // 같은 파일 재선택 허용
  if (!file) return;
  setFileError(undefined);
  try {
    await uploadPortfolioFile(file);
    loadFiles();
  } catch (err) {
    setFileError(err instanceof Error ? err.message : "업로드에 실패했어요.");
  }
}

async function handleFileDownload(id: number) {
  try {
    const url = await getPortfolioFileDownloadUrl(id);
    window.location.href = url;
  } catch (err) {
    setFileError(err instanceof Error ? err.message : "다운로드에 실패했어요.");
  }
}

async function handleFileDelete(id: number) {
  try {
    await deletePortfolioFile(id);
    loadFiles();
  } catch (err) {
    setFileError(err instanceof Error ? err.message : "삭제에 실패했어요.");
  }
}
```

- [ ] **Step 2: "파일 업로드" 버튼 활성화 + 숨은 input + 파일 행 렌더**
기존 disabled 버튼을 활성화하고 클릭 시 input 트리거:
```tsx
<button className="btn secondary sm" type="button" onClick={() => fileInputRef.current?.click()}>
  <UploadSvg /> 파일 업로드
</button>
<input
  ref={fileInputRef}
  type="file"
  accept="application/pdf,image/png,image/jpeg"
  style={{ display: "none" }}
  onChange={handleUpload}
/>
```
파일 행(목록 영역, 링크 아래에 파일 섹션). 각 행:
```tsx
{files && files.length > 0 && (
  <div className="list" style={{ marginTop: 8 }}>
    {files.map((f) => (
      <div key={f.id} className="list-row">
        <span className="badge-ico"><FileIcon size={16} /></span>
        <div className="body">
          <div className="nm">{f.filename}</div>
          <div className="meta">{formatSize(f.sizeBytes)}</div>
        </div>
        <span className="kind-pill">파일</span>
        <div className="actions">
          <button className="iconbtn" aria-label="다운로드" onClick={() => handleFileDownload(f.id)}><Download size={14} /></button>
          <button className="iconbtn" aria-label="삭제" onClick={() => handleFileDelete(f.id)}><Trash size={14} /></button>
        </div>
      </div>
    ))}
  </div>
)}
{fileError && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13 }}>{fileError}</div>}
```
> 아이콘: 현재 파일에 이미 import 된 것 확인. `Download`, `Trash` 는 `@/components/ui/icons` 에 존재(앞선 작업에서 확인). 파일 아이콘은 기존 `FileEdit` 등 존재하는 것 사용(import 목록 확인). `UploadSvg` 는 현재 파일에 인라인 정의돼 있으면 재사용.

- [ ] **Step 3: 뷰 테스트 갱신** (파일 mock 추가)
`portfolio-view.test.tsx` 의 `vi.mock("@/lib/api/portfolio", ...)` 는 유지하고, 파일 API mock 추가:
```tsx
const filesMock = vi.fn();
const uploadMock = vi.fn();
const fileDeleteMock = vi.fn();
vi.mock("@/lib/api/portfolio-file", () => ({
  fetchPortfolioFiles: (...a: unknown[]) => filesMock(...a),
  uploadPortfolioFile: (...a: unknown[]) => uploadMock(...a),
  getPortfolioFileDownloadUrl: vi.fn().mockResolvedValue("http://x/y"),
  deletePortfolioFile: (...a: unknown[]) => fileDeleteMock(...a),
}));
```
기존 테스트들의 `beforeEach` 에 `filesMock.mockResolvedValue([])` 추가(파일 fetch 가 항상 호출되므로). 신규 테스트:
```tsx
it("파일 업로드 버튼 활성화 + 파일 행 렌더", async () => {
  fetchMock.mockResolvedValue([]); // links empty (기존 링크 mock 이름에 맞춤)
  filesMock.mockResolvedValue([{ id: 1, filename: "이력서.pdf", contentType: "application/pdf", sizeBytes: 2516582, createdAt: "2026-06-10T00:00:00Z" }]);
  render(<PortfolioView />);
  expect(await screen.findByText("이력서.pdf")).toBeInTheDocument();
  expect(screen.getByText("2.4MB")).toBeInTheDocument();
  expect(screen.getByText(/파일 업로드/)).not.toBeDisabled();
});

it("파일 삭제 → deletePortfolioFile 호출", async () => {
  fetchMock.mockResolvedValue([]);
  filesMock.mockResolvedValue([{ id: 9, filename: "a.pdf", contentType: "application/pdf", sizeBytes: 1024, createdAt: "2026-06-10T00:00:00Z" }]);
  fileDeleteMock.mockResolvedValue(undefined);
  render(<PortfolioView />);
  await screen.findByText("a.pdf");
  fireEvent.click(screen.getByLabelText("삭제"));
  await waitFor(() => expect(fileDeleteMock).toHaveBeenCalledWith(9));
});
```
> 링크 fetch mock 의 정확한 변수명은 기존 테스트 파일 확인 후 맞출 것(이전 작업에서 `fetchMock` 사용). "삭제" aria-label 이 링크와 파일에 동시에 있을 수 있으니, 링크를 빈 배열로 두어 충돌 회피.

- [ ] **Step 4: 테스트 + 린트**
Run: `cd frontend && npx vitest run src/components/me src/lib/api/__tests__/portfolio-file.test.ts && npm run lint`
Expected: PASS, lint 0 errors. 이어서 전체: `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/me/portfolio-view.tsx frontend/src/components/me/__tests__/portfolio-view.test.tsx
git commit -m "feat(portfolio): 뷰 파일 업로드/목록/다운로드/삭제 배선

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 통합 검증 + 도그푸딩 확인 + PR

- [ ] **Step 1: 백엔드 전체**
Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL (실 MinIO 불필요 — FileStorage mock). 만약 컨텍스트 로딩에서 MinioClient 빈 생성 실패하면 MinioConfig 의 client 빈이 endpoint 빈 문자열로도 빌드되는지 확인(빌드만 하므로 OK여야 함).

- [ ] **Step 2: 프론트 전체**
Run: `cd frontend && npm run lint && npx vitest run`
Expected: lint 0, 전체 그린

- [ ] **Step 3: (수동) 도그푸딩 확인** — 선택
서버를 `MINIO_ENDPOINT=http://localhost:9000`(또는 LAN IP)로 띄운 상태에서 내 정보>포트폴리오에서 PDF 업로드 → 목록 표시 → 다운로드(파일 받아짐) → 삭제. MinIO 콘솔(:9001)에서 오브젝트 확인 가능.

- [ ] **Step 4: push + PR**
```bash
git push -u origin feat/portfolio-file-upload
gh pr create --base develop --title "feat(portfolio): 파일 업로드 (MinIO presigned)" --body "<요약: PortfolioFile BE(MinIO 업로드+presigned 다운로드+삭제, V11) + FE 배선. PDF·PNG·JPG 10MB 유저당 10개. FileStorage @MockBean 테스트. 검증: BE ./gradlew test, FE lint+vitest. 실 업로드는 도그푸딩 확인.>"
```

---

## Self-Review

**1. Spec coverage:**
- 업로드(검증·메타·MinIO put) → Task 3 service ✅
- 목록 → Task 3 ✅
- 다운로드 presigned → Task 3 service.downloadUrl + storage ✅
- 삭제(오브젝트+메타) → Task 3 ✅
- PDF/PNG/JPG·10MB·10개 → Task 3 service 상수 + 검증 ✅
- MinIO 추상화/설정/버킷 → Task 1 ✅
- 엔티티/V11/ErrorCode → Task 2 ✅
- 멀티파트 한도 + MaxUploadSize 핸들러 → Task 1(yml) + Task 3(handler) ✅
- FE 타입/클라이언트/뷰 → Task 4·5 ✅
- 테스트(BE @MockBean / FE) → Task 3·4·5 ✅
- 범위 밖(썸네일·presigned PUT·CORS) → 미포함 ✅

**2. Placeholder scan:** 코드 블록 실제 내용. "http.ts 확인", "status 매핑 확인", "아이콘 import 확인" 은 모듈별 차이 대비 검증 지시(placeholder 아님). MinioConfig Step 의 `@Slf4j on method` 는 잘못이라 제거하라고 명시함.

**3. Type consistency:**
- BE `PortfolioFileResponse(id, filename, contentType, sizeBytes, createdAt)` ↔ FE `PortfolioFile` 일치.
- `DownloadUrlResponse(url)` ↔ FE `getPortfolioFileDownloadUrl` 가 `data.url` 반환 일치.
- `FileStorage` 메서드(put/presignedGetUrl/remove) ↔ MinioFileStorage 구현 ↔ Service 호출 ↔ 테스트 mock 일치.
- 엔드포인트 경로 `/api/v1/me/portfolio-files` BE ↔ FE BASE 일치.

**실행 시 확인:** http.ts 의 FormData/Content-Type 처리(업로드), GlobalExceptionHandler 의 ErrorResponse.of 시그니처, MockMvc 멀티파트 size 한도 동작(서비스 10MB vs 멀티파트 12MB), portfolio-view 기존 링크 테스트의 mock 변수명·아이콘 import.
