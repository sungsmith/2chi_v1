# React 19 `react-hooks/set-state-in-effect` lint — `.then(setX)` inline 패턴

- 학습일: 2026-05-22
- 계기: 5.7 작성 중 `useEffect(() => { void loadX(); }, [])` 패턴이 lint 위반. 5.8 컴포넌트 13 개 작성 중 일관 적용.
- 관련 역량: FE-LANG-002 (React)
- 트랙: FRONTEND

## 핵심 개념

- React 19 의 ESLint `react-hooks/set-state-in-effect` 룰: useEffect 안에서 promise 의 `await` 결과를 `setState` 로 동기 호출하는 패턴이 unsafe (cleanup 시점 race + cancellation 어려움) 라고 경고.
- 위반:
  ```tsx
  useEffect(() => {
    async function load() {
      const data = await fetchX();
      setData(data);  // ← 위반
    }
    void load();
  }, []);
  ```
- 권장 (5.8 채택):
  ```tsx
  useEffect(() => {
    fetchX()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "..."));
  }, []);
  ```
- 핵심 차이: `.then(setX)` 가 **콜백을 등록할 뿐 useEffect 본체는 동기 종료**. setState 가 effect callback 의 동기 흐름 안에 없으므로 lint pass.
- Promise.all 로 병렬 fetch:
  ```tsx
  Promise.all([fetchA(), fetchB()])
    .then(([a, b]) => { setA(a); setB(b); })
    .catch(setError);
  ```

## 본 프로젝트 적용

- 5.7 `write-content.tsx` — 첫 적용
- 5.8 의 모든 client component (`ApplicationsContent`, `CalendarContent`, `ApplicationEditModal`, `UpcomingPanel`, `posting-card`) — 동일 패턴
- 모든 useEffect 의 fetch 가 일관되게 `.then(setX).catch(setErr)` 형태.

## 함정 / 주의사항

- **AbortController 누락**: 위 패턴은 컴포넌트 unmount 후 fetch 가 끝나면 setState 가 unmounted 컴포넌트에서 호출되어 warning. v1 에서는 무시 (UX 영향 미미), v2 에는 cleanup 으로 AbortController 추가 권장:
  ```tsx
  useEffect(() => {
    const ctrl = new AbortController();
    fetchX(ctrl.signal).then(setX).catch(...);
    return () => ctrl.abort();
  }, []);
  ```
- `useEffect` 내부에서 여러 setState 가 필요한 경우 (예: fetch 후 setLoading(false)) 도 `.then` chain 안에서 처리: `.then((x) => { setX(x); setLoading(false); })`.
- **inline 함수 vs 외부 함수**: `setError` 인라인은 lint pass. 하지만 callback 안에서 별도 변환이 필요하면 inline arrow function 사용.
- 의존성 array 에 `setX` 함수 포함 X (setState setter 는 stable, ESLint 도 이를 인식).

## 참고

- [React 19 useEffect — Cancelling a fetch with cleanup](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
- 프로젝트의 5.7 `write-content.tsx`, 5.8 `applications-content.tsx` 가 표준 reference.
