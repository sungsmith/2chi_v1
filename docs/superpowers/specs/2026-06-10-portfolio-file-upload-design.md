# 포트폴리오 파일 업로드 (MinIO) 설계

**작성일:** 2026-06-10
**브랜치:** `feat/portfolio-file-upload`

## 배경
포트폴리오 탭은 외부 링크 CRUD는 완료, 파일 업로드 버튼은 "준비 중" 비활성. MinIO 컨테이너(`twochi-minio`, :9000)는 떠 있으나 BE 연동 전무. 파일 업로드/목록/다운로드/삭제를 붙인다.

## 결정 사항 (brainstorming)
- **허용**: PDF · PNG · JPG, 파일당 최대 **10MB**, 유저당 최대 **10개**.
- **업로드**: multipart로 **BE 경유** (타입·크기 서버 검증 + 메타 원자적 저장).
- **다운로드**: **presigned URL** (업계 표준, BE 바이트 미전송). BE가 presigned GET URL 발급 → FE가 navigation으로 받음.
- **공개 엔드포인트**: env `MINIO_ENDPOINT`(기본 `http://localhost:9000`) 하나로 환경별 대응. LAN 도그푸딩 시 `http://192.168.0.104:9000`. presigned host = 이 값(브라우저 닿는 주소). MinIO가 0.0.0.0:9000 이라 LAN IP 도 닿음.
- **CORS**: 다운로드를 fetch 아닌 navigation(`<a>`/location)으로 → cross-origin fetch 아님 → MinIO CORS 불필요.
- **테스트**: MinIO는 CI에 없음(OpenAI와 동일) → `FileStorage`를 `@MockBean`. 실 put/get은 도그푸딩으로 확인.

## 데이터 모델
```
PortfolioFile {
  id: Long
  userId: Long
  filename: String      // 원본 파일명 (다운로드 시 사용)
  contentType: String   // application/pdf | image/png | image/jpeg
  sizeBytes: long
  objectKey: String     // MinIO 오브젝트 키 = "{userId}/{uuid}.{ext}"
  createdAt: Instant
}
```
Flyway **V11** `portfolio_file` (user_id FK ON DELETE CASCADE). 기존 portfolio_link 와 별개 테이블.

## 백엔드 (`com.twochi.profile.portfolio` 확장)

### 스토리지 추상화
- `storage/FileStorage` (interface):
  - `void put(String objectKey, InputStream data, long size, String contentType)`
  - `String presignedGetUrl(String objectKey, String downloadFilename)` — 만료 짧게(예: 5분), `response-content-disposition=attachment; filename` 포함
  - `void remove(String objectKey)`
- `storage/MinioFileStorage` (impl, `@Profile("!test")` 불필요 — 빈은 만들되 mock 으로 대체됨). MinioClient 주입.
- `config/MinioConfig`:
  - `@Bean MinioClient` (endpoint=`${minio.endpoint}`, creds=`${minio.access-key}/${minio.secret-key}`) — 빌드만으로는 연결 안 함.
  - 버킷 보장 초기화(`makeBucket if !exists`)는 **`@Profile("!test")`** 컴포넌트/Runner 로 (테스트 컨텍스트에선 MinIO 접속 안 하도록).

### 설정 (application.yml)
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 12MB
minio:
  endpoint: ${MINIO_ENDPOINT:http://localhost:9000}
  access-key: ${MINIO_ROOT_USER:}
  secret-key: ${MINIO_ROOT_PASSWORD:}
  bucket: ${MINIO_BUCKET:portfolio}
```
gradle: `implementation("io.minio:minio:8.5.17")` (안정 버전; 빌드 시 실제 해석되는 최신 8.5.x 로).

### 서비스 `PortfolioFileService`
- `upload(userId, MultipartFile)`:
  - 검증: contentType ∈ {application/pdf, image/png, image/jpeg} 아니면 `UNSUPPORTED_FILE_TYPE`; size>10MB `FILE_TOO_LARGE`(멀티파트 한도와 별개로 서비스에서도 체크); `countByUserId>=10` 이면 `FILE_LIMIT_EXCEEDED`.
  - objectKey = `{userId}/{uuid}.{ext}` (ext = contentType 매핑: pdf/png/jpg).
  - `storage.put(...)` → `PortfolioFile` 저장 → 반환.
- `list(userId)` → `findAllByUserIdOrderByCreatedAtDesc`.
- `downloadUrl(userId, id)` → `findOwned` → `storage.presignedGetUrl(objectKey, filename)`.
- `delete(userId, id)` → `findOwned` → `storage.remove(objectKey)` + repo 삭제.
- `findOwned` → `findByIdAndUserId` 없으면 `PORTFOLIO_FILE_NOT_FOUND`.

### Repository
`findAllByUserIdOrderByCreatedAtDesc(Long)`, `findByIdAndUserId(Long,Long)`, `long countByUserId(Long)`.

### DTO
- `PortfolioFileResponse(Long id, String filename, String contentType, long sizeBytes, Instant createdAt)` + `from`.
- `DownloadUrlResponse(String url)`.

### Controller (`/api/v1/me/portfolio-files`, 인증)
| 메서드 | 경로 | 설명 | 응답 |
|---|---|---|---|
| POST | `` | multipart `file` 업로드 | `PortfolioFileResponse` 201 |
| GET | `` | 목록 | `{ "files": [...] }` |
| GET | `/{id}/download` | presigned URL 발급 | `{ "url": "..." }` |
| DELETE | `/{id}` | 삭제 | 204 |

ErrorCode 추가: `UNSUPPORTED_FILE_TYPE`(400), `FILE_TOO_LARGE`(413 또는 400), `FILE_LIMIT_EXCEEDED`(409), `PORTFOLIO_FILE_NOT_FOUND`(404).
multipart 한도 초과 시 Spring 의 `MaxUploadSizeExceededException` → GlobalExceptionHandler 에서 413/400 매핑(기존 핸들러 확인 후 추가).

## 프론트엔드
- `lib/types/me-portfolio-file.ts`: `PortfolioFile { id, filename, contentType, sizeBytes, createdAt }`.
- `lib/api/portfolio-file.ts`: `uploadPortfolioFile(file: File)`(FormData, `http` 에 Content-Type 수동 지정 금지 — 브라우저가 boundary 설정), `fetchPortfolioFiles()`(`{files}` 언래핑), `getPortfolioFileDownloadUrl(id)`(→ `{url}`), `deletePortfolioFile(id)`.
- `components/me/portfolio-view.tsx`: "파일 업로드" 버튼 활성화 → 숨은 `<input type="file" accept=".pdf,image/png,image/jpeg">` 트리거 → 선택 시 업로드 → 목록 갱신. 파일 행: 파일명·크기(예: 2.4MB)·다운로드(아이콘)·삭제(휴지통). 다운로드 → `getPortfolioFileDownloadUrl` 호출 후 `window.location.href = url`(navigation). 링크와 파일을 한 섹션에 같이 표시(링크 먼저, 파일 다음) 또는 파일 하위 목록.
- 업로드 에러(타입/크기/개수) → alert 문구 노출(해요체).
- `http` 헬퍼가 FormData 를 그대로 보내는지 확인(Content-Type 헤더 자동). 필요 시 `uploadPortfolioFile` 은 `http` 대신 직접 fetch + Authorization 헤더 재사용(http.ts 의 getAccessToken).

## 톤/디자인
해요체. 기존 `.list-row`/`.kind-pill` 재사용(파일은 file 톤). 파일 크기 표기 `N.NMB`/`NKB`.

## 테스트
- **BE 통합** (`PortfolioFileIntegrationTest`, deleteAllInBatch 격리, `@MockBean FileStorage`):
  - 업로드(`MockMultipartFile` pdf) → 201 + 목록 1건; storage.put 호출 검증.
  - 타입 불가(text/plain) → 400; 개수 초과(10개 후 11번째) → 409.
  - 다운로드 → storage.presignedGetUrl stub 반환값이 `{url}` 로 옴.
  - 삭제 → 204 + storage.remove 호출 + 목록 0.
  - cross-user 다운로드/삭제 → 404. 인증 없음 → 401.
- **FE vitest**: api client(업로드 FormData/목록 언래핑/다운로드 URL/삭제), portfolio-view 파일 행 렌더·업로드 호출·삭제 호출.

## 범위 밖
파일 미리보기(썸네일), presigned PUT 직접 업로드, 바이러스 스캔, 이미지 리사이즈, MinIO CORS 설정(navigation 다운로드라 불필요).

## 검증 게이트
BE `./gradlew test` 그린 · FE `npm run lint` 0 + `npx vitest run` 그린. 실 업로드/다운로드는 도그푸딩(로컬·LAN)으로 확인.
