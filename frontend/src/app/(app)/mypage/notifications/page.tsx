import { NotiSettingsView } from "@/components/mypage/noti-settings-view";
import { NOTI_SETTINGS_MOCK } from "@/lib/mock/mypage";

export default function MyPageNotifications() {
  return <NotiSettingsView items={NOTI_SETTINGS_MOCK} />;
}
