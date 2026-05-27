export type SocialProvider = "google" | "kakao" | "naver" | "github";

export type SocialConnection = {
  provider: SocialProvider;
  label: string;
  connected: boolean;
  email?: string; // connected 시 표시
};

export const SOCIAL_MOCK: SocialConnection[] = [
  { provider: "google", label: "Google", connected: true, email: "somi.kim@gmail.com" },
  { provider: "kakao",  label: "카카오", connected: false },
  { provider: "naver",  label: "네이버", connected: false },
  { provider: "github", label: "GitHub", connected: true, email: "somi-kim" },
];
