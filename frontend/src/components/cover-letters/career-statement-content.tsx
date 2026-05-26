"use client";

import * as Ico from "@/components/ui/icons";
import type { PostingPickerMock, CareerStatementResultMock } from "@/lib/mock/cover-letters";

type Props = {
  postings: PostingPickerMock[];
  result: CareerStatementResultMock;
};

export function CareerStatementContent({ postings, result }: Props) {
  return (
    <div className="cs-shell">
      {/* Header */}
      <div className="cs-head">
        <div>
          <h1>경력기술서 재구조화</h1>
          <div className="sub">
            내 경력기술 + 채용공고 + 기업분석을 함께 보고, 공고에 가까운 표현으로 다시 정리해드려요.
          </div>
        </div>
        <button className="btn secondary" disabled={true}>
          <Ico.Download size={13} /> 결과 다운로드
        </button>
      </div>

      {/* Step indicator */}
      <div className="cs-steps">
        <span className="cs-step done">
          <span className="num"><Ico.Check size={11} /></span>채용공고 선택
        </span>
        <span className="cs-step-sep" />
        <span className="cs-step active">
          <span className="num">2</span>옵션 · 결과 확인
        </span>
        <span className="cs-step-summary">
          <b>{postings.find((p) => p.selected)?.title ?? postings[0]?.title}</b>
        </span>
      </div>

      {/* Posting picker */}
      <section className="cs-picker">
        <div className="picker-head">
          <span className="lbl">
            연결할 채용공고 <span className="req">*</span>
          </span>
          <span className="sub">등록된 {postings.length}건 · 매칭률순</span>
        </div>
        <label className="search">
          <span className="ico"><Ico.Search size={14} /></span>
          <input placeholder="회사명 · 직무로 검색…" />
        </label>
        <div className="posting-picker cs-posting-list">
          {postings.map((p) => (
            <div
              key={p.id}
              className={"item cs-posting-row" + (p.selected ? " selected" : "")}
            >
              <div className="body">
                <div className="nm">{p.title}</div>
                <div className="meta">
                  <span className="co">{p.company}</span>
                </div>
              </div>
              <span className="pick-radio" />
            </div>
          ))}
        </div>
        <div className="cs-picker-foot">
          <span className="hint">등록된 공고가 없다면 기업 → 채용공고 등록에서 추가하세요.</span>
          <button className="btn primary sm" disabled={true}>
            선택하고 다음 단계로 <Ico.ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* Options */}
      <section className="cs-options">
        <div>
          <div className="ctl-lbl">강조하고 싶은 경험<span className="opt">선택</span></div>
          <input className="ctl-input" defaultValue="결제·정산 도메인 운영 경험을 가장 위로" disabled />
        </div>
        <div>
          <div className="ctl-lbl">자소서 톤<span className="opt">선택</span></div>
          <input className="ctl-input" defaultValue="협업 · 주도성 키워드 자연스럽게" disabled />
        </div>
        <div className="ctl-full">
          <div className="ctl-lbl">사용자 요청사항<span className="opt">선택</span></div>
          <textarea
            defaultValue={"Kafka 경험은 '학습 중'으로 표현해주시면 좋겠어요."}
            disabled
          />
        </div>
        <button className="gen-btn" disabled={true}>
          <Ico.Sparkle size={14} /> 재구조화 결과 만들기
        </button>
      </section>

      {/* Result */}
      <div className="cs-result-shell">
        {/* Before pane (static example) */}
        <section className="cs-result-pane before">
          <div className="cs-pane-head">
            <span className="ttl-row">
              <span className="ttl-eyebrow">Before</span>
              <span className="ttl">원본 경력기술</span>
            </span>
          </div>
          <div className="cs-pane-body">
            <div className="meta-line">{result.projectName}</div>
            <h4>원본 내용</h4>
            <ul>
              <li className="kept">경력기술 원문이 여기에 표시됩니다.</li>
            </ul>
          </div>
          <div className="cs-pane-foot">
            <span className="meta">소스 · <b>경력기술 (PRAR)</b></span>
            <div className="right">
              <button className="btn ghost sm" disabled={true}>원본 페이지로</button>
            </div>
          </div>
        </section>

        {/* After pane */}
        <section className="cs-result-pane after">
          <div className="cs-pane-head">
            <span className="ttl-row">
              <span className="ttl-eyebrow">After</span>
              <span className="ttl">재구조화 결과</span>
            </span>
            <span className="badge"><Ico.Sparkle size={11} /> AI · 검토 필요</span>
          </div>
          <div className="cs-pane-body">
            {result.sections.map((sec) => (
              <div key={sec.heading}>
                <h4>{sec.heading}</h4>
                <ul>
                  {sec.bullets.map((b, i) => (
                    <li key={i}><span className="ins">{b}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="cs-pane-foot">
            <span className="meta">변경 <b>0</b>건</span>
            <div className="right">
              <button className="btn secondary sm" disabled={true}>자소서 마스터에 반영</button>
              <button className="btn primary sm" disabled={true}>결과로 덮어쓰기</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
