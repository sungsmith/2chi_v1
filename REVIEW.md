# REVIEW.md — 2chi v1 코드 리뷰 체크리스트

리뷰 에이전트는 **본인이 작성하지 않은 코드만** 검증한다.  
각 항목: ✅ 통과 / ❌ 실패 (실패 시 `파일명:줄번호` + 사유 명시)

---

## 공통

- [ ] CLAUDE.md 2장: 요청받지 않은 기능 없음, 추상화 과잉 없음
- [ ] CLAUDE.md 3장: 관련 없는 코드 수정 없음
- [ ] 하드코딩된 비밀값(API 키, 비밀번호) 없음
- [ ] `.env` 미커밋 확인

---

## 백엔드 (Agent A 코드 검증 시)

- [ ] 패키지 구조: `com.twochi.{domain}` 규칙 준수
- [ ] URI: `/api/v1/{resource}` 복수형 명사
- [ ] DTO 명명: `{Resource}Request` / `{Resource}Response`
- [ ] DB 테이블명: snake_case 단수형 (ERD v0.1 기준)
- [ ] 보안: SQL은 ORM/PreparedStatement만, raw 쿼리 없음
- [ ] 보안: 비밀번호 bcrypt(cost 12+) 해시
- [ ] 예외: BusinessException vs 인프라 예외 분리
- [ ] 전역 예외 핸들러: `{ code, message, traceId }` 형식
- [ ] Bean Validation 적용 (입력값 검증)
- [ ] 민감 컬럼(이름/전화/자소서 본문): `@Convert` 암호화 적용 여부

---

## 프론트엔드 (Agent B 코드 검증 시)

- [ ] 색상: `var(--color-*)` 토큰 사용, 하드코딩 hex 없음
- [ ] 스페이싱: `var(--space-*)` 토큰 사용
- [ ] 컴포넌트명 PascalCase / 파일명 kebab-case
- [ ] 아이콘: 기능=Lucide / 장식=custom SVG 규칙
- [ ] 감성 요소(테이프·메모): 빈 상태·환영·온보딩에만 사용
- [ ] 입력값: 프론트 실시간 검증 존재 (Bean Validation 이중 검증)
- [ ] 에러 페이지: 404, 500 전용 화면 존재 여부 (해당 기능 시)
- [ ] 반응형: PC 우선, 모바일 브라우저 기본 접속 가능
