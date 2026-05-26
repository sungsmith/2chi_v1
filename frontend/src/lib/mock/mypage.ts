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

export type NotiChannel = "push" | "email" | "in_app";

export type NotiSettingItem = {
  id: string;
  category: string;       // "전형 일정 · 마감" / "제품 안내" / "계정 보안" / "알림 채널"
  label: string;
  description: string;
  defaultOn: boolean;
  locked?: boolean;       // 일부 항목은 비활성 (계정 보안 알림)
};

export const NOTI_SETTINGS_MOCK: NotiSettingItem[] = [
  // 전형 일정 · 마감
  {
    id: "deadline-d3",
    category: "전형 일정 · 마감",
    label: "채용공고 마감 D-3",
    description: "마감 3일 전 09:00에 받기",
    defaultOn: true,
  },
  {
    id: "deadline-d1",
    category: "전형 일정 · 마감",
    label: "채용공고 마감 D-1",
    description: "마감 1일 전 09:00에 받기",
    defaultOn: true,
  },
  {
    id: "interview-d1",
    category: "전형 일정 · 마감",
    label: "면접·일정 D-1",
    description: "등록한 일정 하루 전 09:00에 받기",
    defaultOn: true,
  },
  {
    id: "cl-unsubmitted",
    category: "전형 일정 · 마감",
    label: "자소서 저장 후 미제출 7일",
    description: "저장하고 제출하지 않은 자소서가 있을 때",
    defaultOn: false,
  },
  // 제품 안내
  {
    id: "weekly-summary",
    category: "제품 안내",
    label: "주간 요약",
    description: "이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)",
    defaultOn: false,
  },
  {
    id: "new-feature",
    category: "제품 안내",
    label: "신기능 안내",
    description: "새로 추가된 기능·업데이트 소식",
    defaultOn: true,
  },
  {
    id: "event-promo",
    category: "제품 안내",
    label: "이벤트 · 프로모션",
    description: "할인·이벤트 안내",
    defaultOn: false,
  },
  // 계정 보안 (locked)
  {
    id: "signup-verify",
    category: "계정 보안",
    label: "회원가입 인증",
    description: "가입 직후 이메일 인증 코드 발송",
    defaultOn: true,
    locked: true,
  },
  {
    id: "pw-reset",
    category: "계정 보안",
    label: "비밀번호 재설정",
    description: "비밀번호 재설정 요청 시 발송",
    defaultOn: true,
    locked: true,
  },
  {
    id: "new-device",
    category: "계정 보안",
    label: "새 기기 로그인 감지",
    description: "등록되지 않은 기기에서 로그인 시 안내",
    defaultOn: true,
    locked: true,
  },
  // 알림 채널
  {
    id: "channel-email",
    category: "알림 채널",
    label: "이메일 알림",
    description: "가장 안정적인 채널 · 발송 후 30일간 보관",
    defaultOn: true,
  },
  {
    id: "channel-push",
    category: "알림 채널",
    label: "웹푸시 알림",
    description: "브라우저 알림 권한이 필요해요",
    defaultOn: false,
  },
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
