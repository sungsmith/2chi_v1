export type AccountSnapshot = {
  email: string;
  nickname: string;
  joinedAt: string;
  plan: "free" | "pro";
};

export const ACCOUNT_MOCK: AccountSnapshot = {
  email: "somi.kim@example.com",
  nickname: "김소미",
  joinedAt: "2026-04-08",
  plan: "free",
};
