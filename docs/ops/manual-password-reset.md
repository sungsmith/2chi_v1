# 관리자 수동 비밀번호 리셋 (베타)

자가서비스 비밀번호 재설정은 이메일 인프라 도입(v2) 전까지 제공하지 않는다.
클로즈드 베타(5~10명)에서 비밀번호를 잊은 사용자는 관리자가 아래 절차로 임시 비밀번호를 설정해준다.

## 전제
- 비밀번호는 bcrypt 해시로 저장된다(평문 직접 주입 불가).
- 운영 DB(`app_user` 테이블)에 직접 접근 가능해야 한다.

## 절차
1. **임시 비밀번호의 bcrypt 해시 생성** — 애플리케이션과 동일한 cost 로.
   예) Spring Security 인코더:
   ```java
   new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("임시비번123!");
   ```
   또는 CLI: `htpasswd -bnBC 12 "" "임시비번123!"` 의 `$2y$...` 해시 부분(cost 12 bcrypt).

2. **DB 업데이트**
   ```sql
   UPDATE app_user
      SET password_hash = '<생성된 bcrypt 해시>',
          password_changed_at = NOW()
    WHERE email = '<사용자 이메일>'
      AND deleted_at IS NULL;
   ```

3. **사용자에게 임시 비밀번호를 안전한 채널로 전달**(DM 등).

4. **사용자 안내:** 로그인 후 즉시 *내 계정 > 비밀번호 변경*
   (`PATCH /api/v1/users/me/password`, 현재=임시비번 / 신규=본인 비번)으로 교체하도록 한다.

## 주의
- 임시 비밀번호는 1회용으로 취급하고 전달 채널에서 사후 삭제.
- v2(이메일 인프라) 도입 시 본 절차는 자가서비스 재설정으로 대체된다.
