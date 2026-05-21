"use client";

import { ITEM_TYPE_LABELS, ITEM_TYPE_QUESTIONS, type ItemType } from "@/lib/types/cover-letter";
import type { ByCompanyResponse } from "@/lib/types/company-analysis";

type Props = {
  itemType: ItemType;
  charLimit: number;
  postingCompany: string;
  postingTitle: string;
  analysisRef: ByCompanyResponse | null;
  userRequest: string;
  onUserRequestChange: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  hasDraft: boolean;
  readOnly: boolean;
};

export function WriteInputPanel({
  itemType, charLimit, postingCompany, postingTitle,
  analysisRef,
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
          {analysisRef === null ? (
            <select className="input" disabled style={{ marginTop: 4 }}>
              <option>불러오는 중…</option>
            </select>
          ) : analysisRef.id !== null ? (
            <select className="input" defaultValue={String(analysisRef.id)} disabled style={{ marginTop: 4 }}>
              <option value={analysisRef.id}>{analysisRef.company} 분석 (자동 선택)</option>
            </select>
          ) : (
            <div style={{ marginTop: 4 }}>
              <select className="input" disabled>
                <option>해당 회사 분석 없음</option>
              </select>
              <a href={`/company/analysis/new?company=${encodeURIComponent(postingCompany)}`}
                 style={{ fontSize: 12, color: "var(--color-primary-600)", marginTop: 4, display: "inline-block" }}>
                + 이 회사 분석 만들기
              </a>
            </div>
          )}
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
