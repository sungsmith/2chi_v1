"use client";

import { Save, Download, ChevronDown, Sparkle } from "@/components/ui/icons";
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
    <header className="cl-head">
      <div className="crumb">
        <span>이직 / 취업</span><span>›</span><span>자소서</span><span>›</span>
        <b>{postingCompany} · {postingTitle}</b>
      </div>
      <div className="row">
        <div>
          <h1>{postingCompany}</h1>
          <div className="sub">
            {ITEM_TYPE_LABELS[itemType]} · 글자 제한 {charLimit}자
            {analysisRef?.id && " · 기업분석 연결됨"}
          </div>
        </div>
        <div className="pills">
          {!hasDraft && (
            <button
              type="button"
              className="btn ai"
              onClick={onGenerate}
              disabled={generating}
            >
              <Sparkle size={14} /> {generating ? "AI 초안 생성 중…" : "AI 초안 생성"}
            </button>
          )}
          {hasDraft && (
            <button type="button" className="btn secondary">
              <Save size={14} /> 임시저장
            </button>
          )}
          {hasDraft && (
            <div style={{ position: "relative" }}>
              <button type="button" className="btn secondary">
                <Download size={14} /> 다운로드 <ChevronDown size={12} />
              </button>
              <div className="download-menu">
                <button type="button" className="download-item">
                  <span className="ext">PDF</span>
                  <span className="meta"><b>제출용</b> · 폰트 포함 · 인쇄 최적화</span>
                </button>
                <button type="button" className="download-item">
                  <span className="ext">DOCX</span>
                  <span className="meta"><b>편집용</b> · MS Word · 외부 편집 가능</span>
                </button>
                <button type="button" className="download-item">
                  <span className="ext">TXT</span>
                  <span className="meta">텍스트만 · 클립보드 복사용</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 요청사항 — 항목 질문 + 요청사항 입력 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        <div>
          <div className="lbl">자소서 항목</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{ITEM_TYPE_LABELS[itemType]}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
            {ITEM_TYPE_QUESTIONS[itemType]}
          </div>
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
          <input
            className="input"
            placeholder="ex) 정량 수치를 강조해주세요"
            value={userRequest}
            onChange={(e) => onUserRequestChange(e.target.value)}
            readOnly={readOnly}
            style={{ marginTop: 4 }}
          />
        </div>
      </div>
    </header>
  );
}
