# [ISSUE-0004] KST 환경에서 `toISOString().slice(0,10)` 으로 캘린더 이벤트 invisible

- 발생일: 2026-05-22 (5.8 Task 8 code review 중 발견)
- 환경: local (vitest jsdom 은 UTC default 라 테스트로는 감지 못함)
- 심각도: medium (잠재 production 영향 — 브라우저 KST 환경에서 이벤트 안 보임)
- 관련 역량: FE-LANG-001 (JavaScript / TypeScript)

## 증상

5.8 캘린더 그리드 (`calendar-grid.tsx` / `day-cell.tsx` / `calendar-content.tsx`) 에서 셀의 iso 문자열을 다음과 같이 계산:

```ts
const iso = d.toISOString().slice(0, 10);
```

`new Date(year, month-1, day)` 는 **로컬 자정** 으로 생성되지만 `toISOString()` 은 UTC 변환. KST (UTC+9) 환경에서는:

- `new Date(2026, 4, 15)` = 2026-05-15 00:00 KST = **2026-05-14 15:00 UTC**
- `.toISOString().slice(0,10)` = `"2026-05-14"`

결과: 그리드의 5/15 셀이 `iso = "2026-05-14"` 로 인식되어 BE 의 `eventDate: "2026-05-15"` 이벤트와 매칭 안 됨 → **이벤트가 캘린더에 안 보임**. 또한 빈 일자 클릭 시 `onDayClick(iso)` 로 전날 날짜가 전달되어 EventCreateModal 이 잘못된 날짜로 prefill.

vitest 가 jsdom 의 UTC default 환경에서 돌아서 6/6 테스트는 모두 통과. 코드 리뷰어가 코드 read 단계에서 발견.

## 원인

- `Date#toISOString()` 의 명세상 항상 UTC. 로컬 자정의 `Date` 를 ISO 로 변환하면 UTC 기준 전날일 수 있음.
- JS 의 Date API 가 시간대 처리에 명시적이지 않아 `.slice(0,10)` 패턴이 흔하게 쓰이지만 정확히는 로컬 자정 가정 시에만 옳음 (즉 UTC 환경에서만).
- 다른 callsite (예: 대시보드 upcoming-panel 의 today/today+7) 도 동일 패턴 사용 — Task 9 에서 함께 정정해야 함.

## 해결

1. **즉시 (Task 8 fix-up commit `6bcf7b7`):**
   `frontend/src/lib/utils/date.ts` 에 헬퍼 추가:
   ```ts
   export function toLocalIso(d: Date): string {
     const y = d.getFullYear();
     const m = String(d.getMonth() + 1).padStart(2, "0");
     const day = String(d.getDate()).padStart(2, "0");
     return `${y}-${m}-${day}`;
   }
   ```
   `calendar-content.tsx` (monthBounds), `calendar-grid.tsx` (셀 iso), `day-cell.tsx` (onDayClick), `upcoming-panel.tsx` (today/today+7), `event-create-modal.tsx` (initialDate 기본값) — 5 곳 적용.
2. **근본 (룰 추가):**
   - 코드베이스에서 `toISOString().slice(0, 10)` grep 결과 0 건이 되도록 lint rule (또는 PR template 체크박스).
   - 모든 "로컬 자정 → YYYY-MM-DD" 변환은 `toLocalIso` 를 거치도록.

## 학습

- vitest 의 jsdom default 가 UTC 라는 점이 함정. 시간대 관련 코드는 unit test 만으로 잡히지 않음 — 코드 read 시 시간대 가정 명시 필요.
- BE 도 `LocalDate.now(ZoneId.of("Asia/Seoul"))` 로 명시 (ApplicationController.list 에 적용됨). FE 도 동일 원칙 — 시간대를 코드에서 명시.
- 향후 v2 에 day.js 또는 date-fns 같은 라이브러리 도입 검토 가능. 단 v1 에는 toLocalIso 4 줄 헬퍼로 충분.

## 자소서 활용 후보

- 항목: PROBLEM_SOLVING
- 정량: production 사용자 (KST 환경) 의 캘린더 이벤트 invisible 버그 사전 차단 — 코드 리뷰 단계에서 발견하여 5 callsite 일괄 정정
- 직군 권장 구조: PRAR
