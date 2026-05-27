export type MeProfile = {
  userId: number;
  email: string;
  nickname: string;
  role: string;
  onboardingCompleted: boolean;
  joinedAt: string;
  passwordChangedAt: string;
  plan: "free" | "pro";
};

export type NotiSettingItemDto = {
  id: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;
  locked: boolean;
};

export type NotiSettingsResponse = {
  settings: NotiSettingItemDto[];
};

export type UpdateNotiOverride = {
  id: string;
  enabled: boolean;
};
