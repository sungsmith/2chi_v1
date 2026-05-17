export type SignupPayload = {
  email: string;
  password: string;
  nickname: string;
  ageConfirmed: boolean;
  consents: { terms: boolean; privacy: boolean; marketing: boolean };
};

export type SignupSuccess = { userId: number; email: string; nickname: string };

export type SignupError = {
  code: string;
  message: string;
  traceId: string;
  errors?: { field: string; message: string }[];
};

export class SignupApiError extends Error {
  readonly status: number;
  readonly body: SignupError;
  constructor(status: number, body: SignupError) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function signup(payload: SignupPayload): Promise<SignupSuccess> {
  const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    return (await res.json()) as SignupSuccess;
  }
  const body = (await res.json()) as SignupError;
  throw new SignupApiError(res.status, body);
}
