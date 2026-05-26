import { SignupForm } from "@/components/signup/signup-form";

export const metadata = {
  title: "회원가입 · 2chi",
};

export default function SignupPage() {
  return (
    <div className="auth-shell">
      <SignupForm />
    </div>
  );
}
