import { AccountView } from "@/components/mypage/account-view";
import { ACCOUNT_MOCK } from "@/lib/mock/mypage";

export default function MyPageAccount() {
  return <AccountView data={ACCOUNT_MOCK} />;
}
