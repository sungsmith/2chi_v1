"use client";

import { ITEM_TYPE_LABELS, ITEM_TYPE_QUESTIONS, type ItemType } from "@/lib/types/cover-letter";

type Props = {
  itemType: ItemType;
  charLimit: number;
  postingCompany: string;
  postingTitle: string;
  userRequest: string;
  onUserRequestChange: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  hasDraft: boolean;
  readOnly: boolean;
};

export function WriteInputPanel({
  itemType, charLimit, postingCompany, postingTitle,
  userRequest, onUserRequestChange,
  onGenerate, generating, hasDraft, readOnly,
}: Props) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <div className="lbl">자소서 항목</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{ITEM_TYPE_LABELS[itemType]}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{ITEM_TYPE_QUESTIONS[itemType]}</div>
        </div>
        <div>
          <div className="lbl">글자수 제한</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{charLimit}자</div>
        </div>
        <div>
          <div className="lbl">채용공고</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{postingCompany}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{postingTitle}</div>
        </div>
        <div>
          <div className="lbl">기업분석 연결</div>
          <select className="input" disabled style={{ marginTop: 4 }}>
            <option>곧 추가 예정</option>
          </select>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <div className="lbl">사용자 요청사항</div>
          <input className="input" placeholder="ex) 정량 수치를 강조해주세요"
                 value={userRequest}
                 onChange={(e) => onUserRequestChange(e.target.value)}
                 readOnly={readOnly}
                 style={{ marginTop: 4 }} />
        </div>
      </div>
      {!hasDraft && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn" onClick={onGenerate} disabled={generating}>
            {generating ? "AI 초안 생성 중…" : "🤖 AI 초안 생성"}
          </button>
        </div>
      )}
    </div>
  );
}
