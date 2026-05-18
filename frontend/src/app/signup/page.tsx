import { SignupForm } from "@/components/signup/signup-form";

export const metadata = {
  title: "회원가입 · 2chi",
};

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <h1 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-page-title)", marginBottom: "var(--space-8)" }}>
        회원가입
      </h1>
      <SignupForm />
    </main>
  );
}
