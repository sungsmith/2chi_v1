# 비밀번호 재설정 베타 최소 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 죽은 비밀번호 재설정 데모로 사용자가 유인되지 않게 정리하고, 관리자 수동 리셋 절차를 문서화한다.

**Architecture:** 로그인 화면의 `/reset-password` 링크(가 든 row)를 제거하고, BE 없는 데모 라우트/컴포넌트/테스트를 삭제한다. 자가서비스 재설정은 이메일 인프라(v2)로 미룬다. 운영 노트로 관리자 수동 리셋 절차를 남긴다.

**Tech Stack:** Next.js(App Router) + React + Vitest (FE), Markdown(docs).

**Spec:** `docs/superpowers/specs/2026-06-01-feat-auth-reset-cleanup-design.md`

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `frontend/src/components/login/login-form.tsx` | 수정 | 비번재설정 링크 row 제거 |
| `frontend/src/app/(public)/reset-password/page.tsx` | 삭제 | 데모 라우트 |
| `frontend/src/components/auth/reset-password-form.tsx` | 삭제 | 데모 컴포넌트 |
| `frontend/src/components/auth/__tests__/reset-password-form.test.tsx` | 삭제 | 데모 테스트 |
| `docs/ops/manual-password-reset.md` | 신규 | 관리자 수동 리셋 절차 |

---

## Task 1: 죽은 reset 링크·데모 자산 제거

**Files:**
- Modify: `frontend/src/components/login/login-form.tsx`
- Delete: `frontend/src/app/(public)/reset-password/page.tsx`, `frontend/src/components/auth/reset-password-form.tsx`, `frontend/src/components/auth/__tests__/reset-password-form.test.tsx`

- [ ] **Step 1: 로그인 폼에서 reset 링크 row 제거**

`login-form.tsx`의 아래 블록(현재 약 162-165행)을 통째로 삭제한다 (링크만 빼면 빈 `check` span 만 남는 무의미한 row 이므로 row 전체 제거):

```tsx
        <div className="row">
          <span className="check" aria-hidden="true" />
          <Link className="link" href="/reset-password">비밀번호 재설정</Link>
        </div>
```

삭제 후 `<Link>` 가 이 파일에서 더 안 쓰이면 `import Link from "next/link"` 도 제거(다른 곳에서 쓰면 유지). 파일에서 `Link` 사용처를 grep으로 확인 후 결정.

- [ ] **Step 2: 데모 라우트/컴포넌트/테스트 삭제**

```bash
git rm frontend/src/app/\(public\)/reset-password/page.tsx \
       frontend/src/components/auth/reset-password-form.tsx \
       frontend/src/components/auth/__tests__/reset-password-form.test.tsx
```
(`(public)` 디렉터리에 reset-password 외 다른 라우트가 있으면 디렉터리 자체는 두고 page.tsx만 삭제 — 위 명령은 파일만 지움.)

- [ ] **Step 3: 무참조 확인**

Run: `cd frontend && grep -rn "reset-password\|ResetPasswordForm" src/`
Expected: **출력 없음** (어떤 참조도 남지 않음).

- [ ] **Step 4: 타입체크/빌드 + 기존 login 테스트 통과 확인**

Run: `cd frontend && npx tsc --noEmit && npm test -- login-form`
Expected: 타입 에러 없음(삭제 라우트 import 잔존 없음), login-form 관련 테스트 PASS. (login-form 테스트가 reset 링크를 검사하지 않으므로 영향 없음 — 만약 링크 존재를 단언하는 테스트가 있으면 그 단언을 제거.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/login/login-form.tsx
git commit -m "fix(auth): 죽은 비번재설정 데모 링크·라우트 제거 (베타 #1)"
```
(삭제는 `git rm` 으로 이미 스테이징됨 — 위 add 와 함께 커밋.)

---

## Task 2: 관리자 수동 리셋 운영 문서

**Files:**
- Create: `docs/ops/manual-password-reset.md`

- [ ] **Step 1: 운영 노트 작성**

`docs/ops/manual-password-reset.md`:

```markdown
# 관리자 수동 비밀번호 리셋 (베타)

자가서비스 비밀번호 재설정은 이메일 인프라 도입(v2) 전까지 제공하지 않는다.
클로즈드 베타(5~10명)에서 비밀번호를 잊은 사용자는 관리자가 아래 절차로 임시 비밀번호를 설정해준다.

## 전제
- 비밀번호는 bcrypt 해시로 저장된다(평문 직접 주입 불가).
- 운영 DB(`app_user` 테이블)에 직접 접근 가능해야 한다.

## 절차
1. **임시 비밀번호의 bcrypt 해시 생성** — 애플리케이션과 동일한 cost 로.
   예) Spring Boot 콘솔/테스트 또는 한 줄 유틸:
   ```java
   new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("임시비번123!");
   ```
   또는 CLI(htpasswd -bnBC 12 "" "임시비번123!" 의 해시 부분) 등 cost 12 bcrypt.

2. **DB 업데이트**
   ```sql
   UPDATE app_user
      SET password_hash = '<생성된 bcrypt 해시>',
          password_changed_at = NOW()
    WHERE email = '<사용자 이메일>'
      AND deleted_at IS NULL;
   ```

3. **사용자에게 임시 비밀번호를 안전한 채널로 전달**(DM 등).

4. **사용자 안내:** 로그인 후 즉시 내 계정 > 비밀번호 변경
   (`PATCH /api/v1/users/me/password`, 현재=임시비번 / 신규=본인 비번)으로 교체하도록 한다.

## 주의
- 임시 비밀번호는 1회용으로 취급하고 전달 채널에서 사후 삭제.
- v2(이메일 인프라) 도입 시 본 절차는 자가서비스 재설정으로 대체된다.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ops/manual-password-reset.md
git commit -m "docs(ops): 관리자 수동 비밀번호 리셋 절차 (베타 #1)"
```

---

## Self-Review 결과
- **Spec coverage:** §3 링크 제거+데모 삭제=Task 1 · 수동 리셋 문서=Task 2 · §4 무참조/빌드 검증=Task 1 Step 3-4. 전 항목 커버.
- **Placeholder scan:** 없음. 삭제 명령·검증 명령·문서 본문 모두 구체.
- **Type consistency:** 신규 타입/함수 없음(삭제 위주). `PATCH /api/v1/users/me/password` 는 기존 엔드포인트(spec 명시) 참조.
