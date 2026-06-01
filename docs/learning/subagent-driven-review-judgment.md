# Subagent-driven 개발에서 리뷰 판단 — 검증·반영·기각의 3단 패턴

- 학습일: 2026-06-01
- 계기: PR #30(notification cron B2) 10-task subagent-driven 풀사이클 — 매 task 마다 implementer + code-reviewer subagent. 리뷰어가 종종 Important/Critical 을 제기하지만 그중 일부는 부정확하거나 trade-off 가 있었음.
- 관련 역량: AI-OPS-003, ENG-PROCESS-002 (코드 리뷰 워크플로)
- 트랙: BACKEND / 메타-엔지니어링

## 핵심 개념

LLM 기반 리뷰어(code-reviewer subagent)는 강력하지만 두 종류의 오류를 낸다:

1. **사실 오류**: 프레임워크/런타임 동작을 잘못 알고 있다 (예: "Hibernate JPQL `JOIN Entity ON` 은 invalid" → Hibernate 6 는 ad-hoc entity join 지원).
2. **맥락 무지**: 코드베이스의 결정 사항을 모르고 일반론을 적용한다 (예: "method reference 로 바꿔야 일관" → 그러면 import 가 추가돼 오히려 산만).

리뷰어를 **무비판 수용**하면 의미 없는 변경이 쌓이고, **무비판 거부**하면 진짜 결함을 놓친다. 정답은 **3단 패턴**:

```
리뷰어 지적 → (1) 검증 → (2) 판단 → (3) 처리
                ↓             ↓          ↓
            기술 사실      타당성 평가   반영 / 기각 / 인지+주석
```

## 본 프로젝트 적용 — 4가지 케이스

### 케이스 A. 검증으로 **기각** (Task 5 ad-hoc JOIN)

- 리뷰어 주장: `JOIN Application a ON e.applicationId = a.id` 는 `@ManyToOne` 매핑 없으면 invalid, 런타임에 fail.
- 검증 방법: 이미 통과한 `@SpringBootTest` 가 모든 `@Query` 를 startup 시 파싱하는지 확인 → `BUILD SUCCESSFUL` = 쿼리 valid.
- 판단: Hibernate 6 는 ad-hoc entity JOIN 지원 (Spring Boot 3.5 = Hibernate 6.x). 리뷰어가 옛 Hibernate 5 모델로 판단.
- 처리: **기각**. 변경 없음. 리뷰어의 부분적 우려(unit test 가 쿼리 유효성 못 잡음)는 Task 10 통합 테스트가 자연히 해소.

### 케이스 B. 인지 + 주석으로 **push back** (Task 7 Between boundary)

- 리뷰어 주장: Spring Data `Between` 은 closed `[from, to]` 인데 spec 은 half-open `[from, to)` → 자정 동시 데이터 중복 카운트.
- 검증 결과: 기술적으로 정확. Spring Data `Between` → SQL `BETWEEN A AND B` → inclusive.
- 판단: v1 영향 0 (자정 정확 동시 데이터 + dedup_key 가 알림 중복은 차단). 4 파일 메서드명 변경 vs 인지 주석. 트레이드오프.
- 처리: **주석으로 push back**. v1 단계엔 비용 대비 가치 낮음, 향후 트래픽 증가 시 `@Query` 의 `< :to` 로 정확화하라고 코드에 명시.

### 케이스 C. 타당, **즉시 반영** (Task 3 RETENTION 상수)

- 리뷰어 주장: `cleanup` 이 `Duration.ofDays(30)` 하드코딩, `NotificationService` 에 이미 `RETENTION` 상수가 있고 `list()` 가 그걸 씀 → DRY 위반, 향후 변경 시 silently 불일치.
- 검증: 코드 확인 — `RETENTION = Duration.ofDays(30)` 실재. 같은 값이지만 진짜 트랩.
- 판단: 1줄 변경, 동작 불변, 유지보수 명확화. 즉시 반영.
- 처리: **반영**. fixup commit.

### 케이스 D. 부분적 타당, **선별 반영** (Task 6 import 정리 vs Minor)

- Important: `java.time.*` FQN inline → import 정리. (코드 일관성)
- Minor 1: `ZoneId.of("Asia/Seoul")` 매직 스트링 → 상수. (Task 7 에서 재사용 예정)
- Minor 2: method reference vs lambda 일관성. (import 추가 트레이드오프)
- 판단: Important 와 Minor 1 은 가치 큼(다음 task 도움). Minor 2 는 cosmetic + 트레이드오프.
- 처리: Important + Minor 1 **반영**, Minor 2 **skip**.

## 함정 / 주의사항

- **"Ready to merge: Yes, with one fix" 의 무게**: 리뷰어가 "yes" 라 해도 fix 가 실제 의미 있는지 검증 필요. Task 1 의 `@Transactional` 제거 권고는 검증 결과 잘못된 조언(`@Modifying` 은 트랜잭션 필수)이었음 — 제거하면 오히려 깨짐.
- **리뷰어 컨텍스트는 격리됨**: subagent 는 controller의 전체 흐름을 모름. "이 method 를 X 로 바꾸자" 제안이 다른 task 의 결정과 충돌할 수 있음. controller(나) 가 cross-task 일관성을 봐야.
- **검증의 빠른 경로**: 사실 주장은 **즉시 실행으로 확인**(테스트, 빌드, context load). 추측·이론 논쟁보다 30초 명령이 빠르다. (`./gradlew test --tests "*XXX*"`, `./gradlew compileJava`)
- **인지 주석의 가치**: 영향 없는 spec mismatch 라도 "왜 안 고쳤는지" 코드에 남기지 않으면 미래의 누군가가 동일 의심을 반복한다. 1줄 주석으로 의사결정 보존.
- **반영 vs 기각을 commit message 에 명시**: "리뷰 반영" / "리뷰 인지(push back)" / "기각" 등 라벨링이 PR history 를 자기 회고 자산으로 만든다.

## 일반화 가능한 체크리스트 (다른 프로젝트에도 적용)

리뷰어 지적을 받을 때 순서:

1. **사실 검증**: 30초 안에 확인 가능한가? (테스트 실행, 코드 grep, 공식 문서) → 그렇다면 즉시.
2. **타당성**: 사실 맞다면, 영향과 비용 평가. trade-off 가 있는가?
3. **처리 분류**:
   - **반영**: 영향 ≥ 비용. fixup commit.
   - **인지 push back**: 영향 < 비용 + 미래 위험 존재. 1줄 주석으로 의사결정 문서화.
   - **기각**: 사실 오류 또는 영향 0. commit message 에 근거 명시.
4. **cross-task 일관성**: 이 fix 가 다른 task 의 결정과 충돌하지 않는가?

## 참고

- 본 프로젝트 PR #30 — [docs/portfolio/achievements.md P-0003](../portfolio/achievements.md)
- superpowers:receiving-code-review skill — "기술 검증 후 반영" 정신
- superpowers:subagent-driven-development — 워크플로 정의
