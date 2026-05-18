import { apiUrl, setAccessToken, http } from "./http";

export type SignupPayload = {
  email: string;
  password: string;
  nickname: string;
  ageConfirmed: boolean;
  consents: { terms: boolean; privacy: boolean; marketing: boolean };
};

export type SignupSuccess = { userId: number; email: string; nickname: string };

export type AuthUser = { userId: number; email: string; nickname: string };

export type SignupError = {
  code: string;
  message: string;
  traceId: string;
  metadata?: Record<string, unknown>;
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

export async function signup(payload: SignupPayload): Promise<SignupSuccess> {
  const res = await fetch(apiUrl("/api/v1/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return (await res.json()) as SignupSuccess;
  throw new SignupApiError(res.status, await res.json() as SignupError);
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    const body = await res.json() as { accessToken: string; user: AuthUser };
    setAccessToken(body.accessToken);
    return body;
  }
  throw new SignupApiError(res.status, await res.json() as SignupError);
}

export async function logout(): Promise<void> {
  await fetch(apiUrl("/api/v1/auth/logout"), {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await http("/api/v1/users/me");
  if (!res.ok) return null;
  const body = await res.json() as { userId: number; email: string; nickname: string; role: string };
  return { userId: body.userId, email: body.email, nickname: body.nickname };
}
