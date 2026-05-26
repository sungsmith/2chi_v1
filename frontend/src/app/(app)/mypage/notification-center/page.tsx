import { NotiCenterView } from "@/components/mypage/noti-center-view";
import { NOTI_CENTER_MOCK } from "@/lib/mock/mypage";

export default function NotificationCenterPage() {
  return <NotiCenterView entries={NOTI_CENTER_MOCK} />;
}
