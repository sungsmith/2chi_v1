import { Suspense } from "react";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export default function VerifyEmailPage() {
  return (
    <div className="auth-shell">
      <Suspense fallback={null}>
        <VerifyEmailView />
      </Suspense>
    </div>
  );
}
