"use client";

export type PostingTab = "url" | "manual" | "search";

const Ico = {
  Link: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Edit: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Search: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Lock: ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
};

const POST_TABS: { id: PostingTab; nm: string; sub: string; Ico: (p: { size?: number }) => React.ReactNode; locked?: boolean }[] = [
  { id: "url",    nm: "URL 붙여넣기", sub: "사람인 · 원티드 · 잡코리아", Ico: Ico.Link },
  { id: "manual", nm: "직접 작성",    sub: "회사명·공고 본문 직접 입력",  Ico: Ico.Edit },
  { id: "search", nm: "채용공고 검색", sub: "공고 검색으로 한 번에",      Ico: Ico.Search, locked: true },
];

type Props = {
  active: PostingTab;
  onChange: (t: PostingTab) => void;
};

export function PostingTabs({ active, onChange }: Props) {
  return (
    <div className="mode-tabs">
      {POST_TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            className={"mode-tab" + (isActive ? " active" : "") + (t.locked ? " locked" : "")}
            onClick={() => !t.locked && onChange(t.id)}
          >
            <span className="ico">
              {t.locked ? <Ico.Lock size={14} /> : <t.Ico size={16} />}
            </span>
            <span className="body">
              <span className="nm">
                {t.nm}
                {t.locked && <span className="v2-badge">v2 · 준비 중</span>}
              </span>
              <span className="sub">{t.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
