"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchMe } from "@/lib/api/mypage";
import type { MeProfile } from "@/lib/types/mypage";
import { formatRelativeKo } from "@/lib/utils/relative-time";
import { Edit } from "@/components/ui/icons";
import { NicknameEditModal } from "./nickname-edit-modal";

export function AccountView() {
  const { refreshUser } = useAuth();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [editingNickname, setEditingNickname] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : "프로필을 불러오지 못했어요."));
  }, []);

  if (error && !me) {
    return <div role="alert" className="error-banner">{error}</div>;
  }
  if (!me) {
    return <div className="loading">불러오는 중...</div>;
  }

  const isPasswordNeverChanged = me.passwordChangedAt === me.joinedAt;
  const passwordHint = isPasswordNeverChanged
    ? "가입 후 변경하지 않았어요 · 90일마다 변경을 권장해요"
    : `마지막 변경 ${formatRelativeKo(new Date(me.passwordChangedAt))} · 90일마다 변경을 권장해요`;

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
            <span className="desc"><b>{me.email}</b> · 이메일 인증 완료</span>
          </div>
          <button className="btn ghost sm" disabled title="이메일 변경은 v2 에서 지원해요">변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">닉네임</span>
            <span className="desc"><b>{me.nickname}</b> · UI · 자소서 · 알림에서 사용</span>
          </div>
          <button className="btn ghost sm" onClick={() => setEditingNickname(true)}>
            <Edit size={12}/> 편집
          </button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">비밀번호</span>
            <span className="desc">{passwordHint}</span>
          </div>
          {/* Task 3 에서 password modal trigger 로 변경됨. 현재는 disabled. */}
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

      {editingNickname && (
        <NicknameEditModal
          currentNickname={me.nickname}
          onClose={() => setEditingNickname(false)}
          onSuccess={async (updated) => {
            setMe(updated);
            await refreshUser();
            setEditingNickname(false);
          }}
        />
      )}
    </>
  );
}
