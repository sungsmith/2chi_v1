# Next.js 15 App Router — async params / searchParams 가 Promise

- 학습일: 2026-05-22
- 계기: 5.8 `/applications/page.tsx`, `/applications/calendar/page.tsx` 작성 시 적용
- 관련 역량: FE-LANG-003 (Next.js)
- 트랙: FRONTEND

## 핵심 개념

- Next.js 15 부터 `params`, `searchParams` 가 **`Promise<...>`** 타입으로 변경 (이전 14 까지는 동기 object). 서버 컴포넌트에서 `await` 해야 사용 가능.
- 시그니처 예:
  ```tsx
  type Props = {
    searchParams: Promise<{ stage?: string; result?: string; sort?: string }>;
  };

  export default async function Page({ searchParams }: Props) {
    const sp = await searchParams;
    return <Content stage={sp.stage} result={sp.result} sort={sp.sort} />;
  }
  ```
- `params` 도 동일하게 `Promise<{ id: string }>`. 따라서 page.tsx 자체가 `async function`.
- 클라이언트 컴포넌트는 변함없이 `useSearchParams()` (`'next/navigation'`) hook 사용. 동기 read.
- `export const metadata` 는 그대로 동작. 변경된 건 page function 의 props 시그니처만.

## 본 프로젝트 적용

- `frontend/src/app/(app)/applications/page.tsx` — searchParams = `{stage?, result?, sort?}`
- `frontend/src/app/(app)/applications/calendar/page.tsx` — searchParams = `{month?}`
- `frontend/src/app/(app)/company/analysis/[id]/page.tsx` — params = `{id: string}` (5.9)
- 클라이언트 측 URL 동기화: `ApplicationsContent` 에서 `useRouter().replace(\`/applications?stage=...\`)` 로 갱신 → page.tsx 가 다시 평가되며 새 searchParams 전달.

## 함정 / 주의사항

- ECMA TS lint 가 "searchParams type 이 Promise" 라고 잡지 못하는 경우가 있어 빌드 시 `next build` 가 실패해서야 발견. **타입 정의를 정확히 `Promise<{...}>` 으로 명시**.
- `await searchParams` 안 하면 `searchParams.stage` 가 `undefined` 가 아닌 `Promise.stage` 가 되어 런타임 NPE. 컴파일러는 잡아주지만 무시하기 쉬움.
- 같은 페이지 안에 `params` + `searchParams` 둘 다 쓰면 둘 다 await 필요.
- Next.js 15 의 [breaking change](https://nextjs.org/docs/app/building-your-application/upgrading/version-15) 중 가장 흔히 걸리는 항목. 14 에서 마이그레이션 시 페이지 전수 점검.

## 참고

- [Next.js 15 Upgrade Guide — async params and searchParams](https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change)
- 프로젝트의 5.7 ~ 5.9 모든 page.tsx 가 이미 이 패턴으로 작성됨 (참고용 reference).
