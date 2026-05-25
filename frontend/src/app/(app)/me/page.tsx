import { PageHeader } from "@/components/me/page-header";
import { CoachBanner } from "@/components/me/coach-banner";
import { ProfileView } from "@/components/me/profile-view";
import { PROFILE_MOCK } from "@/lib/mock/me";

export default function MePage() {
  return (
    <>
      <PageHeader section="profile" />
      <CoachBanner />
      <ProfileView data={PROFILE_MOCK} />
    </>
  );
}
