# 비밀번호 재설정 — 베타 최소 정리 설계

> 베타 차단 #1. 자가서비스 비밀번호 재설정은 실 이메일 인프라가 필요해 v2로 미룬다(사용자 결정). v1 베타에서는 **사용자를 죽은 데모로 유인하지 않게** 하고, 잠긴 사용자는 **관리자 수동 리셋**으로 복구한다.

## 1. 배경 / 문제

- `frontend/src/components/login/login-form.tsx:164`가 `/reset-password`로 링크.
- `/reset-password`(`frontend/src/app/(public)/reset-password/page.tsx` → `frontend/src/components/auth/reset-password-form.tsx`)는 **BE 없는 순수 데모** — "메일 링크 클릭한 척하기 (데모)" 버튼만 있고 실제로 아무것도 안 함.
- `AuthController`에 reset 엔드포인트 없음, 이메일 발송 인프라(JavaMailSender) 없음.
- 결과: 비번 잊은 베타 사용자가 링크를 눌러도 가짜 흐름에 빠져 복구 불가.

## 2. 범위

**범위 안 (v1 최소):**
- 로그인 화면의 `/reset-password` 링크 제거.
- 고아 데모 자산 삭제: `/reset-password` 라우트 + `reset-password-form.tsx` + 그 테스트.
- 관리자 수동 비밀번호 리셋 절차 문서화(운영 노트).

**범위 밖 (v2 — 이메일 인프라 PR과 함께):**
- 자가서비스 재설정 플로우, 토큰 테이블, 실 이메일 발송, EMAIL_VERIFY.

## 3. 변경 내용

| 파일 | 작업 |
|---|---|
| `frontend/src/components/login/login-form.tsx` | `<Link href="/reset-password">비밀번호 재설정</Link>`(line 164) 제거. 주변 마크업/레이아웃 깨지지 않게 최소 수정 |
| `frontend/src/app/(public)/reset-password/page.tsx` | 삭제 |
| `frontend/src/components/auth/reset-password-form.tsx` | 삭제 |
| `frontend/src/components/auth/__tests__/reset-password-form.test.tsx` | 삭제 |
| `docs/ops/manual-password-reset.md` (신규) | 관리자 수동 리셋 절차 |

**수동 리셋 절차(문서 내용 요지):** 비밀번호는 bcrypt 해시라 평문 직접 주입 불가. ① 임시 비번의 bcrypt 해시 생성(예: 한 줄 스크립트 또는 BCrypt 도구, cost 일치) → ② `UPDATE app_user SET password_hash='<hash>', password_changed_at=NOW() WHERE email='<user>' AND deleted_at IS NULL;` → ③ 사용자에게 임시 비번 안전 전달 → ④ 사용자가 로그인 후 기존 `PATCH /api/v1/users/me/password`로 본인 비번 변경. 베타 5~10명 규모에 적합.

## 4. 검증

- **무참조 확인:** `/reset-password`, `reset-password-form`, `ResetPasswordForm` 문자열이 코드베이스 어디에도 안 남음(grep).
- **빌드/타입:** `npm run build` 또는 타입체크 통과(삭제된 라우트/컴포넌트 import 잔존 없음).
- **기존 테스트:** `login-form` 관련 기존 테스트 통과(링크 제거가 다른 동작 안 깸). 삭제한 reset 테스트만큼 테스트 수 감소.
- 신규 자동화 테스트 거의 없음(삭제·문서 위주). 수동 리셋 절차는 문서 검토로 갈음.

## 5. 리스크
- 낮음. 순수 제거 + 문서. 유일한 주의점: login-form에서 링크 제거 시 인접 요소(예: 같은 줄의 다른 링크/구분자) 레이아웃 정합 확인.

---

spec 통과 → `superpowers:writing-plans`.
