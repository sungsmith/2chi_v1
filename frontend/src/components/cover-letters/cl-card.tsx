"use client";

type ClCardItem = {
  id: string;
  title: string;
  co: string;
  pos: string;
  updated: string;
  /* variant fields */
  match?: number;
  dday?: string | null;
  status?: "draft" | "ready" | "master";
  /* master fields */
  variants?: number;
};

type Props = {
  item: ClCardItem;
  master?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
};

export function ClCard({ item, master = false, disabled = false, onOpen }: Props) {
  const cn = "cl-card" + (master ? " master" : "") + (disabled ? " disabled" : "");

  return (
    <article
      className={cn}
      onClick={disabled ? undefined : onOpen}
      role={onOpen && !disabled ? "button" : undefined}
      tabIndex={onOpen && !disabled ? 0 : undefined}
      aria-disabled={disabled ? true : undefined}
      title={disabled ? "준비중" : undefined}
    >
      <div className="cl-card-head">
        <div className="cl-card-meta">
          <span className="co">{item.co}</span>
          <span className="sep" />
          <span>{item.pos}</span>
        </div>
        <button
          className="more"
          aria-label="더보기"
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      <div className="title">{item.title}</div>

      {!master && typeof item.match === "number" && (
        <div className="match">
          <span className="match-bar">
            <span style={{ width: item.match + "%" }} />
          </span>
          <span className="pct">{item.match}%</span>
        </div>
      )}

      <div className="cl-card-foot">
        {master && <span className="badge master">마스터</span>}
        {!master && item.status === "draft" && (
          <span className="badge draft">작성중</span>
        )}
        {!master && item.status === "ready" && (
          <span className="badge done">제출완료</span>
        )}
        {item.dday && <span className="badge dday">{item.dday}</span>}
        {master && typeof item.variants === "number" && (
          <span className="badge">변형본 {item.variants}</span>
        )}
        <span className="updated">{item.updated}</span>
      </div>
    </article>
  );
}
