import { PageHeader } from "@/components/me/page-header";
import { CoachBanner } from "@/components/me/coach-banner";
import { ProfileView } from "@/components/me/profile-view";

export default function MePage() {
  return (
    <>
      <PageHeader section="profile" />
      <CoachBanner />
      <ProfileView />
    </>
  );
}
