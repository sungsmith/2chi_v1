import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "비밀번호 재설정 · 2chi",
};

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
