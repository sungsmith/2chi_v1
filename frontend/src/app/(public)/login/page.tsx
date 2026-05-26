import { Suspense } from "react";
import { BrandPanel } from "@/components/onboarding/brand-panel";
import { LoginForm } from "@/components/login/login-form";

export const metadata = {
  title: "로그인 · 2chi",
};

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <BrandPanel />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
