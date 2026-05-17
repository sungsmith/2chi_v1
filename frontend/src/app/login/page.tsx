import Link from "next/link";

export const metadata = {
  title: "로그인 · 2chi",
};

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <h1 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-page-title)" }}>
        로그인
      </h1>
      <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-6)" }}>
        로그인 기능은 다음 단계에 구현됩니다.
      </p>
      <p style={{ marginTop: "var(--space-6)" }}>
        <Link href="/signup" style={{ color: "var(--color-text-brand)" }}>
          ← 회원가입 화면으로
        </Link>
      </p>
    </main>
  );
}
