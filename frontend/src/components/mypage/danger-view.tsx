"use client";

import { useState } from "react";
import { Download } from "@/components/ui/icons";
import { WithdrawConfirmModal } from "./withdraw-confirm-modal";

export function DangerView() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <section className="mp-head">
        <h1>회원 탈퇴</h1>
        <div className="sub">탈퇴 후 30일간 유예 기간이 있어요. 그 안에 다시 로그인하면 복구할 수 있어요.</div>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">데이터 내보내기</span>
          <span className="sec-sub">탈퇴 전에 백업을 권장해요</span>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">내 정보·자소서·경력기술 일괄 다운로드</span>
            <span className="desc">JSON + PDF로 묶어 보내드려요. 처리에는 최대 24시간 걸려요.</span>
          </div>
          <button className="btn secondary sm" disabled>
            <Download size={12} /> 데이터 요청
          </button>
        </div>
      </section>

      <section className="mp-danger">
        <span className="danger-ttl">회원 탈퇴</span>
        <div className="danger-row">
          <div>
            <div className="desc">
              <b>탈퇴 시 영구 삭제되는 데이터</b>
            </div>
            <div className="desc">· 회원 정보 (이메일, 닉네임, 연결된 소셜 계정)</div>
            <div className="desc">· 자소서 · 경력기술 · 포트폴리오 링크</div>
            <div className="desc">· 지원 일정 · 히스토리 로그 · 알림 기록</div>
            <div className="desc">30일간 휴면 상태로 유예 후 영구 삭제됩니다.</div>
          </div>
          <button className="btn danger" onClick={() => setConfirmOpen(true)}>
            회원 탈퇴
          </button>
        </div>
      </section>

      {confirmOpen && (
        <WithdrawConfirmModal onClose={() => setConfirmOpen(false)} />
      )}
    </>
  );
}
