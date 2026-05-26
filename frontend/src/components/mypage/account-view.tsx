import { Edit } from "@/components/ui/icons";
import type { AccountSnapshot } from "@/lib/mock/mypage";

interface AccountViewProps {
  data: AccountSnapshot;
}

export function AccountView({ data }: AccountViewProps) {
  return (
    <>
      <section className="mp-head">
        <h1>계정 정보</h1>
        <div className="sub">이메일·닉네임·비밀번호 같은 계정 자체 정보를 관리해요.</div>
      </section>
      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">기본 정보</span>
          <span className="sec-sub">소셜 가입 계정은 비밀번호 변경이 불가해요</span>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">이메일</span>
            <span className="desc"><b>{data.email}</b> · 이메일 인증 완료</span>
          </div>
          <button className="btn ghost sm" disabled>변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">닉네임</span>
            <span className="desc"><b>{data.nickname}</b> · UI · 자소서 · 알림에서 사용</span>
          </div>
          <button className="btn ghost sm" disabled><Edit size={12}/> 편집</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">비밀번호</span>
            <span className="desc">마지막 변경 <b>3개월 전</b> · 90일마다 변경을 권장해요</span>
          </div>
          <button className="btn secondary sm" disabled>비밀번호 변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">2단계 인증</span>
            <span className="desc">로그인 시 이메일로 인증 코드를 한 번 더 확인해요. <b>v2 준비 중</b></span>
          </div>
          <span className="value-pill">곧 출시</span>
        </div>
      </section>
    </>
  );
}
