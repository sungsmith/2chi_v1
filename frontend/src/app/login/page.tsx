import { LoginForm } from "@/components/login/login-form";

export const metadata = {
  title: "로그인 · 2chi",
};

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <h1 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-page-title)", marginBottom: "var(--space-8)" }}>
        로그인
      </h1>
      <LoginForm />
    </main>
  );
}
