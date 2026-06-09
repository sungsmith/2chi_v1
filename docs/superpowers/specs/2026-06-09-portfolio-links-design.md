# 내 정보 포트폴리오 탭 — 외부 링크 CRUD 설계

**작성일:** 2026-06-09
**브랜치:** `feat/me-portfolio-links`

## 배경 / 문제

내 정보 > **포트폴리오 탭**은 UI(PortfolioView + PortfolioModal)는 완성돼 있으나 **100% mock** 이다. Modal "추가" 버튼은 `onClose()`만 호출(저장 없음), 편집 버튼 무동작, BE 지원 전무. 실 데이터로 마무리한다.

## 결정 사항 (brainstorming)

- **포트폴리오 = 외부 링크/파일 모음** (외부 증빙 포인터). "프로젝트 상세"는 이미 경력기술(PRAR) 탭이 담당하므로, Modal의 리치 필드(사용기술 태그·본인 기여 요약)는 **중복이라 제거**한다.
- **v1 = 링크만.** 파일 업로드(PDF 등)는 MinIO 연동이 필요해 **fast-follow(후속 PR)** 로 분리. v1에서 파일 업로드 버튼은 "준비 중" 비활성.

## 범위

**포함:** 외부 링크 CRUD (BE 신규 모듈 + FE 실배선 + 테스트).
**제외(명시):** 파일 업로드(MinIO), 대시보드 완성도 공식(5.3) 반영, 드래그 재정렬, URL→kind 자동 감지.

## 데이터 모델

```
PortfolioLink {
  id: Long
  userId: Long
  kind: enum GITHUB | BLOG | NOTION | OTHER   // PortfolioView 가 렌더하는 4종에 정합
  title: String      // 표시명
  url: String        // http/https
  orderIndex: int    // 생성 시 말미에 append (기존 education/cert/experience 와 동일 패턴)
  createdAt, updatedAt: Instant
}
```

기존 `com.twochi.profile.education.domain.Education` 엔티티 컨벤션(@Entity, @Table, @Getter, @NoArgsConstructor(PROTECTED), order_index, created_at/updated_at)을 그대로 미러링.

## 백엔드 (신규 모듈 `com.twochi.profile.portfolio`)

`com.twochi.profile.{education,certificate,experience}` 패턴 미러링:

- `domain/PortfolioLink.java` (엔티티) + `domain/PortfolioLinkKind.java` (enum)
- `repository/PortfolioLinkRepository.java` — `findByUserIdOrderByOrderIndexAsc(userId)`, `findByIdAndUserId(id, userId)`
- `dto/PortfolioLinkRequest.java` (record, 검증) / `dto/PortfolioLinkResponse.java` (record + `from`)
- `service/PortfolioLinkService.java`
- `controller/PortfolioLinkController.java`
- Flyway `V10__portfolio_link.sql` (+ `V10_R__rollback.sql`)
- `ErrorCode.PORTFOLIO_LINK_NOT_FOUND` 추가

### 엔드포인트 (base `/api/v1/me/portfolio-links`, 인증 필수)

| 메서드 | 경로 | 설명 | 응답 |
|---|---|---|---|
| GET | `/api/v1/me/portfolio-links` | 목록(orderIndex asc) | `{ "links": [PortfolioLinkResponse...] }` (래핑) |
| POST | `/api/v1/me/portfolio-links` | 생성 (orderIndex = 현재 최대+1) | `PortfolioLinkResponse` (201) |
| PUT | `/api/v1/me/portfolio-links/{id}` | 수정(kind/title/url) | `PortfolioLinkResponse` |
| DELETE | `/api/v1/me/portfolio-links/{id}` | 삭제 | 204 |

- 인증: `@AuthenticationPrincipal AuthenticatedUser`, null → `BusinessException(UNAUTHENTICATED)`.
- cross-user 접근(다른 userId의 link id): **404** (`PORTFOLIO_LINK_NOT_FOUND`).
- 검증: `kind @NotNull`, `title @NotBlank @Size(max=100)`, `url @NotBlank @Size(max=500)` + `@Pattern` 또는 서비스에서 http/https 시작 확인.

### Flyway V10

```sql
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

## 프론트엔드

- `lib/types/me-portfolio.ts` — `PortfolioLinkKind`, `PortfolioLink`, `PortfolioLinkRequest`.
- `lib/api/portfolio.ts` — `fetchPortfolioLinks`(→ `data.links` **언래핑**), `createPortfolioLink`, `updatePortfolioLink`, `deletePortfolioLink`.
- `components/me/portfolio-view.tsx` — `PORTFOLIO_MOCK` prop 제거 → 자체 fetch(또는 page fetch, 기존 me 탭 패턴에 맞춤). LinkRow에 **편집(연필)+삭제(휴지통)** 동작. 파일 업로드 버튼 `disabled` + "준비 중". FileRow/파일 섹션 제거. 빈 상태 문구 유지.
- `components/me/portfolio-modal.tsx` — 종류 4종(GITHUB/BLOG/NOTION/OTHER)+제목+URL만. 리치 필드 제거. 추가→POST, 편집 모드(prefill)→PUT. 저장 성공 시 목록 갱신 + 닫기.
- `app/(app)/me/portfolio/page.tsx` — `PORTFOLIO_MOCK` import 제거.
- `lib/mock/me.ts` — 내 변경으로 미사용이 된 `PORTFOLIO_MOCK`/`PortfolioSnapshot`/`PortfolioLink`(mock)/`PortfolioFile` 정리(다른 사용처 없으면 제거).

## 톤 / 디자인

해요체, 디자인 토큰(`var(--color-*)`, `var(--space-*)`). AI 어휘 무관(이 화면엔 AI 없음). 기존 `.me-section`/`.list-row`/`.pf-modal` 클래스 재사용.

## 테스트

- **BE 통합테스트** (`PortfolioLinkIntegrationTest`, ApplicationIntegrationTest 패턴): 생성→목록, 수정, 삭제, cross-user 404, 검증 실패(빈 title/url, 잘못된 url, 잘못된 kind), 인증 없으면 401.
- **FE vitest**: portfolio-view(빈 상태 / 링크 렌더 / 삭제 호출), portfolio-modal(추가 POST 호출 / 편집 prefill+PUT), api client(`{links}` 언래핑).

## 검증 게이트

BE `./gradlew test` 그린 · FE `npm run lint` 0 errors + `npx vitest run` 그린.
