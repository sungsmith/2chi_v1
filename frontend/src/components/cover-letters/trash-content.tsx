"use client";

import type { ClTrashItemMock } from "@/lib/mock/cover-letters";

type Props = {
  data: ClTrashItemMock[];
};

export function TrashContent({ data }: Props) {
  return (
    <>
      <section className="co-head" style={{ marginBottom: 14 }}>
        <div>
          <h1>휴지통</h1>
          <div className="sub" style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginTop: 4 }}>
            삭제한 자소서는 <b>30일간</b> 보관 후 영구 삭제돼요.
          </div>
        </div>
      </section>

      {data.length === 0 ? (
        <div className="trash-empty">
          <p>휴지통이 비어있어요</p>
        </div>
      ) : (
        <>
          <div className="trash-banner">
            <span className="ico">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span className="body">
              <b>{data.length}건이 휴지통에 있어요.</b> 30일이 지나면 자동으로 영구 삭제돼요. 그 안에 복구하면 원본 그대로 돌아와요.
            </span>
            <button className="clear-all" disabled>전부 영구 삭제</button>
          </div>

          <div className="trash-table">
            <div className="trash-row head">
              <div>자소서</div>
              <div>삭제일</div>
              <div>영구 삭제까지</div>
              <div />
            </div>
            {data.map((t) => {
              const soon = t.daysUntilPurge <= 7;
              return (
                <div key={t.id} className="trash-row">
                  <div className="body">
                    <div className="nm">{t.title}</div>
                    <div className="meta">
                      <span className="co">{t.kind === "master" ? "마스터" : "변형본"}</span>
                    </div>
                  </div>
                  <div className="deleted-at">{t.deletedAt}</div>
                  <div className={"remaining" + (soon ? " soon" : "")}>
                    <span className="bar">
                      <span style={{ width: (t.daysUntilPurge / 30 * 100) + "%" }} />
                    </span>
                    {t.daysUntilPurge}일
                  </div>
                  <div className="actions">
                    <button className="btn ghost sm" disabled>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4" />
                      </svg>
                      {" "}복원
                    </button>
                    <button className="btn ghost sm" style={{ color: "var(--color-semantic-error)" }} disabled>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                      {" "}영구 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
