import { http } from "@/lib/api/http";
import type {
  MeProfile,
  NotiSettingsResponse,
  UpdateNotiOverride,
} from "@/lib/types/mypage";

type ErrorBody = { code?: string };

async function readCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as ErrorBody;
    return body.code;
  } catch {
    return undefined;
  }
}

export async function fetchMe(): Promise<MeProfile> {
  const res = await http("/api/v1/users/me");
  if (!res.ok) throw new Error("프로필을 불러오지 못했어요.");
  return res.json() as Promise<MeProfile>;
}

export async function updateNickname(nickname: string): Promise<MeProfile> {
  const res = await http("/api/v1/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "NICKNAME_DUPLICATE") throw new Error("이미 사용중인 닉네임이에요.");
    throw new Error("닉네임 변경에 실패했어요.");
  }
  return res.json() as Promise<MeProfile>;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await http("/api/v1/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "PASSWORD_MISMATCH") throw new Error("현재 비밀번호가 일치하지 않아요.");
    if (code === "PASSWORD_UNCHANGED") throw new Error("현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요.");
    throw new Error("비밀번호 변경에 실패했어요.");
  }
}

export async function withdraw(currentPassword: string): Promise<void> {
  const res = await http("/api/v1/users/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "PASSWORD_MISMATCH") throw new Error("현재 비밀번호가 일치하지 않아요.");
    if (code === "ALREADY_WITHDRAWN") throw new Error("이미 탈퇴 처리됐어요.");
    throw new Error("탈퇴 처리에 실패했어요.");
  }
}

export async function fetchNotiSettings(): Promise<NotiSettingsResponse> {
  const res = await http("/api/v1/users/me/noti-settings");
  if (!res.ok) throw new Error("알림 설정을 불러오지 못했어요.");
  return res.json() as Promise<NotiSettingsResponse>;
}

export async function updateNotiSettings(
  overrides: UpdateNotiOverride[],
): Promise<NotiSettingsResponse> {
  const res = await http("/api/v1/users/me/noti-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) {
    const code = await readCode(res);
    if (code === "SETTING_LOCKED") throw new Error("보안 알림은 변경할 수 없어요.");
    if (code === "UNKNOWN_SETTING") throw new Error("알 수 없는 알림 설정이에요.");
    if (code === "DUPLICATE_SETTING") throw new Error("같은 항목이 중복돼서 전송됐어요.");
    throw new Error("알림 설정 저장에 실패했어요.");
  }
  return res.json() as Promise<NotiSettingsResponse>;
}
