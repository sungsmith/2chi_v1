# 2단계 PR 6번 (`feat/error-pages`) Spec

**브랜치 베이스**: `develop` (#21 머지됨, commit `af0dfc8`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 error-pages 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/not-found` (404) + `/error` (500) 화면을 `design_system/project/ui_kits/web/screen-error.jsx` (41줄) mock 과 정렬. 4 곳 (`(app)/{not-found,error}`, `(public)/{not-found,error}`) 신규.

---

## 2. 현 상태 진단

### 2.1 frontend 현재
- `not-found.tsx` · `error.tsx` 모두 미존재 (Next.js default 화면 사용 중)

### 2.2 mock screen-error.jsx (41줄)
- `ErrorScreen({ code, onHome })` — 404 / 500 conditional
- 공통 구조: `.err-shell` > `.err-card` (mascot-cloud `lg` + `.code` + h2 + p + `.actions` 2 button)
- **404**: mascot sleep · "이 페이지는 더 이상 찾을 수 없어요" · 뒤로 + 대시보드로
- **500**: mascot think · "잠시 후 다시 시도해주세요" · 상태 페이지 + 다시 시도

### 2.3 핵심 결정
| # | 결정 | 사유 |
|---|---|---|
| 1 | `<ErrorContent code={404|500} reset?>` 단일 컴포넌트 | mock 의 conditional 패턴 그대로 |
| 2 | (app) + (public) 둘 다 not-found + error 4 곳 | 1단계 spec §5 표 명시. (app) 가 인증 영역, (public) 가 비인증 영역 |
| 3 | error.tsx 는 'use client' + reset prop | Next.js App Router error boundary 패턴 |
| 4 | `.err-shell` / `.err-card` CSS port from mock kit-account.css | mock 에 정의됨 |

---

## 3. 변경 파일 (~8)

### 신규
| 파일 | 책임 |
|---|---|
| `frontend/src/components/error/error-content.tsx` | mock ErrorScreen conditional 컴포넌트 |
| `frontend/src/app/(app)/not-found.tsx` | 404 (인증 영역) |
| `frontend/src/app/(app)/error.tsx` | 500 (인증 영역, 'use client') |
| `frontend/src/app/(public)/not-found.tsx` | 404 (비인증) |
| `frontend/src/app/(public)/error.tsx` | 500 (비인증, 'use client') |
| `frontend/src/components/error/__tests__/error-content.test.tsx` | smoke test (404 + 500 + reset 호출) |

### Modify
| 파일 | 변경 |
|---|---|
| `frontend/src/styles/kit.css` | `.err-shell` / `.err-card` / `.code` / `.code.err` port |

---

## 4. Commit 분할 (2 commit)

1. **`feat(err): ErrorContent 컴포넌트 + kit.css port + smoke test`**
   - error-content.tsx (404 / 500 conditional)
   - kit.css 의 .err-* selector port
   - smoke test 3 (404 render · 500 render · reset 호출)

2. **`feat(err): not-found + error 라우트 4개 (app·public)`**
   - 4 페이지 신규
   - Next.js App Router not-found / error boundary 패턴
   - error.tsx 는 'use client' + reset

---

## 5. 검증
- `npm run lint` / `npm run test` (166 + 3 신규) / `npm run build`
- dev 서버: `/존재하지않는경로` → 404 표시 / runtime error 시 500 표시

---

## 6. Out of scope
- Sentry 등 error logging 통합
- error 정보 (stack trace) 표시 — 프로덕션은 generic 메시지만

---

## 7. Next step
spec 통과 → plan + dispatch.
