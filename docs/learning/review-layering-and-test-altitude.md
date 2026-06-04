# 다층 리뷰와 test altitude — 통합 리뷰가 단위 테스트를 통과한 버그를 잡는 이유

- 학습일: 2026-06-03
- 계기: 베타 차단 해소 세션(P-0004, PR #32~#39). 단위 테스트 전부 통과 + per-task 리뷰 통과 후에도, **최종 통합 리뷰**가 사용자를 직격하는 critical 버그(내정보 리스트가 새로고침 시 항상 빈 채로 표시)를 머지 직전에 잡았다.
- 관련 역량: QA-REVIEW-001 (다층 코드리뷰), AI-OPS-003 (subagent 파이프라인) *(matrix 확정 시 정합)*
- 트랙: BACKEND / FRONTEND / 메타-엔지니어링

## 핵심 개념

리뷰·테스트의 각 "층(layer)"은 **서로 다른 종류의 결함**을 잡는다. 한 층의 통과가 다른 층의 결함 부재를 보장하지 않는다.

| 층 | 잡는 것 | 구조적으로 못 잡는 것 |
|---|---|---|
| 단위 테스트 | 한 유닛의 로직 | 유닛 간 **계약**(특히 mock 경계 너머) |
| per-task spec/quality 리뷰 | 그 task 의 구현 정확성·품질 | task 간 **통합**, end-to-end 계약 |
| 통합/최종 리뷰 | 모듈 간 계약, altitude, 전체 일관성 | (사람이 안 보면 못 잡음) |

**test altitude 문제**: 테스트가 너무 높은(가까운) 곳에서 mock 하면, 그 mock 경계 아래의 실제 동작을 검증하지 못한다. mock 이 "거짓말"을 하면 테스트는 초록불인데 프로덕션은 깨진다.

### 이번 세션의 실제 사례

FE 리스트 클라이언트:
```ts
export async function fetchEducations(): Promise<Education[]> {
  const res = await http(BASE);
  return res.json();          // ← BE 는 실제로 { educations: [...] } 래퍼 반환
}
```
BE 컨트롤러는 `Map.of("educations", responses)` 를 반환(= `{educations:[...]}`). 런타임에 `res.json()` 은 배열이 아니라 래퍼 객체 → `setEducations({educations:[...]})` → `.length===0` 가 falsy 라 **리스트가 항상 빈 채로 렌더**. 새로고침하면 입력한 학력/자격증/경험이 사라진 것처럼 보임.

**왜 단위 테스트가 못 잡았나**: `profile-view.test.tsx` 가 api-client 를 mock 했다.
```ts
vi.mock("@/lib/api/education", () => ({ fetchEducations: () => Promise.resolve([sample]) }));
```
mock 이 **배열을 직접 반환** → 실제 `res.json()` 파싱(래퍼)을 우회 → 타입(`Promise<Education[]>`)도 컴파일타임 거짓말이라 tsc 도 못 잡음. **per-task 리뷰**도 FE 만, BE 만 따로 봐서 계약 불일치를 못 봄. 오직 FE 클라이언트 + BE 컨트롤러를 **함께 본 통합 리뷰**만 포착.

## 본 프로젝트 적용

- **다층 파이프라인 채택**: 각 task = implementer → spec 준수 리뷰 → 코드 품질 리뷰 → fix loop. 기능 완성 후 = **별도 통합(최종) 리뷰**. 이 통합 층을 생략하지 않은 것이 critical 버그를 막은 직접 원인.
- **canonical-then-mirror**: 3개 동일 CRUD(학력/자격증/경험)는 Education 을 먼저 만들고 **리뷰로 정제한 뒤** 복제 → 결함의 3× 전파 차단. (리뷰가 잡은 `assert`→AssertJ, `findOwned` private, GPA `@Digits` 가 미러 전에 고쳐짐.)
- **통합 리뷰가 잡은 다른 결함들**(같은 세션): OpenAI 키 lazy 처리가 1/3 클라이언트만 고쳐 "기동 보호" 목표 미달이던 것, `profile.name/phone` PII 평문 저장, 암호문이 VARCHAR(255) 초과(한글 50자 → ~350자) → TEXT 정정. 전부 단위 테스트 초록불 상태에서 포착.
- **CI lint 게이트**: 로컬 `npm test`(vitest) 통과했으나 CI `npm run lint`(eslint)가 `react/no-unescaped-entities` 로 실패 → 로컬 검증 루틴에 `npm run lint` 포함. (또 다른 "층": 테스트 ≠ lint.)

## 함정 / 주의사항

- **mock 은 경계 아래를 검증하지 못한다.** api-client 를 mock 하면 그 client 의 파싱·계약은 절대 테스트되지 않는다. 계약을 검증하려면 더 낮은 층(예: `http`/fetch 를 mock 하고 client 의 unwrap 까지 통과시키는 테스트) 또는 contract/e2e 가 필요.
- **TypeScript 반환 타입은 검증이 아니다.** `res.json()` 은 `Promise<any>` → `Promise<Education[]>` 로 단언해도 런타임 형태와 무관. 타입은 "주장"일 뿐 mock 과 함께면 거짓말이 통과한다.
- **"테스트 다 통과 = 안전" 은 함정.** 통과한 층이 무엇을 검증하는지, 무엇을 구조적으로 못 보는지를 알아야 한다.
- **per-task 리뷰만으로 통합을 보장할 수 없다.** 각 PR/태스크가 독립적으로 완벽해도 경계의 계약은 별도로 봐야 한다. 통합 리뷰를 "중복"이라 생략하지 말 것.
- 일관성 결정(BE 리스트 응답을 래퍼 vs flat 로 통일)을 안 하면 이런 계약 불일치가 반복된다. 본 프로젝트는 notification=래퍼, applications/company=flat 로 혼재 → drift 의 토양.

## 참고

- 이번 세션 성과: [P-0004](../portfolio/achievements.md)
- 관련 선행: [subagent-driven 리뷰 판단](subagent-driven-review-judgment.md) (리뷰 지적의 검증·반영·기각)
- 테스트 피라미드/계약 테스트 일반론 (Martin Fowler, "Test Pyramid" / "Contract Test")
