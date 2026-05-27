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

export type NotiCenterEntry = {
  id: string;
  time: string;        // "오늘 14:00" / "어제 09:30"
  icon: string;        // global Ico key
  iconTone: "default" | "mint" | "lav" | "pink" | "warn";
  msg: string;
  unread: boolean;
};

export const NOTI_CENTER_MOCK: NotiCenterEntry[] = [
  {
    id: "nc-1",
    time: "09:00",
    icon: "Bell",
    iconTone: "pink",
    msg: "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요",
    unread: true,
  },
  {
    id: "nc-2",
    time: "17:32",
    icon: "Check",
    iconTone: "mint",
    msg: "(주)테크컴퍼니 1차면접 일정이 등록됐어요",
    unread: true,
  },
  {
    id: "nc-3",
    time: "14:08",
    icon: "Sparkle",
    iconTone: "default",
    msg: "AI가 카카오 공고 매칭 결과를 정리했어요",
    unread: true,
  },
  {
    id: "nc-4",
    time: "20:14",
    icon: "FileEdit",
    iconTone: "mint",
    msg: "네이버 신입 백엔드 자소서가 저장됐어요",
    unread: false,
  },
  {
    id: "nc-5",
    time: "09:00",
    icon: "Bell",
    iconTone: "warn",
    msg: "쿠팡 백엔드 (라스트마일) 마감 D-3",
    unread: false,
  },
  {
    id: "nc-6",
    time: "22:01",
    icon: "Plus",
    iconTone: "default",
    msg: "기업분석 — 카카오 분석이 완료됐어요",
    unread: false,
  },
];
