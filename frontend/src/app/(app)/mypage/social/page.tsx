import { SocialView } from "@/components/mypage/social-view";
import { SOCIAL_MOCK } from "@/lib/mock/mypage";

export default function MyPageSocial() {
  return <SocialView connections={SOCIAL_MOCK} />;
}
