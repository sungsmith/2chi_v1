export type SignupErrors = {
  email?: string;
  password?: string;
  nickname?: string;
  ageConfirmed?: string;
  terms?: string;
  privacy?: string;
};

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NICKNAME_RE = /^[가-힣A-Za-z0-9]{2,20}$/;

export function validateEmail(value: string): string | undefined {
  if (!value) return "이메일을 입력해주세요.";
  if (!EMAIL_RE.test(value)) return "이메일 형식이 올바르지 않습니다.";
  if (value.length > 255) return "이메일이 너무 깁니다.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "비밀번호를 입력해주세요.";
  if (value.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  const hasAlpha = /[A-Za-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const types = [hasAlpha, hasDigit, hasSymbol].filter(Boolean).length;
  if (types < 2) return "영문, 숫자, 특수문자 중 2종 이상을 조합해주세요.";
  return undefined;
}

export function validateNickname(value: string): string | undefined {
  if (!value) return "닉네임을 입력해주세요.";
  if (!NICKNAME_RE.test(value)) return "닉네임은 2~20자의 한글/영문/숫자만 가능합니다.";
  return undefined;
}

export type SignupFormState = {
  email: string;
  password: string;
  nickname: string;
  ageConfirmed: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

export function validateSignup(state: SignupFormState): SignupErrors {
  const errors: SignupErrors = {};
  const e = validateEmail(state.email);    if (e) errors.email = e;
  const p = validatePassword(state.password); if (p) errors.password = p;
  const n = validateNickname(state.nickname); if (n) errors.nickname = n;
  if (!state.ageConfirmed) errors.ageConfirmed = "만 14세 이상 확인이 필요합니다.";
  if (!state.terms)        errors.terms        = "서비스 이용 약관에 동의해주세요.";
  if (!state.privacy)      errors.privacy      = "개인정보 수집·이용에 동의해주세요.";
  return errors;
}
