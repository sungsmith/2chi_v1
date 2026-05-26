"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Refresh } from "@/components/ui/icons";
import { MascotCloud } from "@/components/ui/mascot-cloud";

type Props = {
  code?: 404 | 500;
  reset?: () => void;  // error.tsx 의 reset prop
};

export function ErrorContent({ code = 404, reset }: Props) {
  const router = useRouter();

  if (code === 500) {
    return (
      <div className="err-shell">
        <div className="err-card">
          <MascotCloud size="lg" expression="think" />
          <span className="code err">500 · 잠시 연결이 끊겼어요</span>
          <h2>잠시 후 다시 시도해주세요</h2>
          <p>서버 응답이 지연되고 있어요. 작성 중이던 자소서는 임시 저장되어 있어요.</p>
          <div className="actions">
            <button type="button" className="btn ghost sm">상태 페이지</button>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => (reset ? reset() : window.location.reload())}
            >
              <Refresh size={12} /> 다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="err-shell">
      <div className="err-card">
        <MascotCloud size="lg" expression="sleep" />
        <span className="code">404 · NOT FOUND</span>
        <h2>이 페이지는 더 이상 찾을 수 없어요</h2>
        <p>주소가 바뀌었거나, 삭제됐을 수 있어요. 대시보드에서 다시 시작해보세요.</p>
        <div className="actions">
          <button type="button" className="btn ghost sm" onClick={() => router.back()}>뒤로</button>
          <Link href="/" className="btn primary sm">대시보드로</Link>
        </div>
      </div>
    </div>
  );
}
