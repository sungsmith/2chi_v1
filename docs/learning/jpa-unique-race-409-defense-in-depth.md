# JPA UNIQUE 제약 race condition — existsBy + DataIntegrityViolationException → 409

- 학습일: 2026-05-22
- 계기: 5.8 ApplicationService.create() 코드 리뷰에서 race window 지적
- 관련 역량: BE-DB-001 (관계형 DB·SQL 기본), BE-API-003 (에러 처리·예외 표준), BE-PERF-003 (동시성 제어)
- 트랙: BACKEND

## 핵심 개념

- 애플리케이션 코드의 "선검증 후 INSERT" 패턴은 race 에 노출됨. 두 요청이 동시에 `existsBy` 통과 → 둘 다 `save` → 한쪽은 `DataIntegrityViolationException`.
- DB 의 UNIQUE 제약이 last line of defense. 애플리케이션 검증은 UX 향상 (early 409 응답) + 통상 경로 최적화. 둘 다 필요한 defense in depth.
- Spring Data JPA 의 `save()` 는 transaction commit 시점에 INSERT 가 flush 될 수 있어 예외가 호출자 메서드 밖에서 발생. `saveAndFlush()` 로 강제 즉시 flush 하면 try/catch 가능.
- 5.8 의 처리:
  ```java
  try {
      applicationRepository.saveAndFlush(app);
  } catch (DataIntegrityViolationException e) {
      throw new BusinessException(ErrorCode.APPLICATION_ALREADY_EXISTS);  // 409
  }
  ```
- 또는 global `@ExceptionHandler(DataIntegrityViolationException.class)` 로 일괄 변환 가능 — 제약 위반의 도메인 의미 (어떤 UNIQUE 가 깨졌는지) 를 알 수 없어 일반화 어렵.

## 본 프로젝트 적용

- `backend/src/main/java/com/twochi/application/service/ApplicationService.java:create()` — 위 패턴.
- DB 측: `V3__applications_events.sql` 의 `CREATE UNIQUE INDEX uq_application_user_posting ON applications (user_id, posting_id)`.
- v2 후보: 동일 패턴을 5.9 의 `CompanyAnalysisService.createOrReplace()` 에도 적용 — 현재는 in-place update 라 race 가 다르지만 신규 경로에는 동일 위험.

## 함정 / 주의사항

- `save()` 만 쓰면 `DataIntegrityViolationException` 이 service 메서드 밖 (transaction commit) 에서 발생하여 catch 불가. **반드시 `saveAndFlush()`** 또는 transaction 경계 외 try/catch.
- 단 `saveAndFlush` 는 매 호출마다 즉시 SQL 실행 → 동일 트랜잭션 내 여러 save 가 있을 때 성능 영향. UNIQUE 검증이 필요한 첫 INSERT 에만 한정.
- `DataIntegrityViolationException` 은 UNIQUE 외에도 FK / NOT NULL / CHECK 위반에도 발생. 메시지로 어떤 제약인지 파싱하는 것은 fragile. 가능하면 UNIQUE 위반만 발생 가능한 좁은 단계에 try/catch 한정.
- Spring 의 transaction rollback: 위 try/catch 내에서 BusinessException 으로 변환해 throw 시, `@Transactional` 의 default rollback rule (RuntimeException 발생 시 rollback) 적용됨. 즉 commit 시도 자체가 실패하므로 추가 처리 불필요.

## 참고

- [Spring Data JPA: SimpleJpaRepository#saveAndFlush](https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaRepository.html#saveAndFlush-S-)
- [Hibernate User Guide: Transactions and concurrency control](https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#transactions)
