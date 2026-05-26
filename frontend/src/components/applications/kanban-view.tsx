"use client";

import { useState } from "react";
import type { KanbanColumn } from "@/lib/mock/applications";

const Ico = {
  Plus: ({ size = 12 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

const STAGE_LEGEND = (
  <section className="stage-legend">
    <span className="item"><span className="dot doc"/>서류</span>
    <span className="item"><span className="dot code"/>코딩테스트</span>
    <span className="item"><span className="dot int1"/>1차면접</span>
    <span className="item"><span className="dot int2"/>2차면접</span>
    <span className="item"><span className="dot exec"/>임원면접</span>
    <span className="item"><span className="dot ok"/>합격</span>
    <span className="item"><span className="dot fail"/>불합격</span>
  </section>
);

type Props = { columns: KanbanColumn[] };

export function KanbanView({ columns }: Props) {
  const [result, setResult] = useState("all"); // all | active | passed | failed
  const [sort, setSort] = useState("recent");
  return (
    <>
      <section className="ap-head">
        <div>
          <h1>지원 대시보드</h1>
          <div className="sub">전형 단계별로 진행 중인 지원을 한눈에. 카드를 드래그해 단계를 이동할 수 있어요.</div>
        </div>
        <div className="actions">
          <button className="btn secondary sm"><Ico.Plus size={12}/> 지원 추가</button>
        </div>
      </section>

      {STAGE_LEGEND}

      <div className="kan-toolbar">
        <div className="filter-chips">
          <button className={result === "all"    ? "active" : ""} onClick={() => setResult("all")}>전체 <span className="n">7</span></button>
          <button className={result === "active" ? "active" : ""} onClick={() => setResult("active")}>진행중 <span className="n">7</span></button>
          <button className={result === "passed" ? "active" : ""} onClick={() => setResult("passed")}>합격 <span className="n">2</span></button>
          <button className={result === "failed" ? "active" : ""} onClick={() => setResult("failed")}>불합격 <span className="n">3</span></button>
        </div>
        <div className="sort">
          <span className="lbl">정렬</span>
          <div className="seg">
            <button className={sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}>최신순</button>
            <button className={sort === "dday"   ? "active" : ""} onClick={() => setSort("dday")}>마감순</button>
            <button className={sort === "co"     ? "active" : ""} onClick={() => setSort("co")}>회사명</button>
          </div>
        </div>
      </div>

      <div className="kan-active-filters">
        <span className="lbl">활성 필터</span>
        <span className="chip">백엔드 직군<button className="x"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button></span>
        <span className="chip">최근 30일<button className="x"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button></span>
        <button className="clear">전체 초기화</button>
      </div>

      <div className="kanban">
        {columns.map(col => (
          <div key={col.id} className="kanban-col">
            <div className="kanban-col-head">
              <span className="nm"><span className={"dot " + col.id}/>{col.label}</span>
              <span className="count">{col.count}</span>
            </div>
            {col.items.map((it) => (
              <article key={it.id} className="kan-card">
                <div className="row1">
                  <span className="co">{it.co}</span>
                  <span className={"dday-pill" + (it.soon ? "" : " cool")}>{it.dday}</span>
                </div>
                <div className="pos">{it.pos}</div>
                <div className="meta"><span>{it.added}</span></div>
              </article>
            ))}
            <button className="kan-add"><Ico.Plus size={11}/>지원 추가</button>
          </div>
        ))}
      </div>
    </>
  );
}
