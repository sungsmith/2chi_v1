import Link from "next/link";
import { Sparkle, Plus, Building, Calendar } from "./icons";

type ShortcutItem = {
  label: string;
  sub: string;
  toneCls: string; // .shortcut.primary | .shortcut.tone-1 | .tone-2 | .tone-3
  icon: React.ReactNode;
  href?: string;   // 있으면 작동, 없으면 disabled
};

const ITEMS: ShortcutItem[] = [
  {
    label: "자소서 작성",
    sub: "AI 초안 → 수정본 흐름",
    toneCls: "primary",
    icon: <Sparkle size={16} />,
    href: "/cover-letter",
  },
  {
    label: "채용공고 등록",
    sub: "URL 붙여넣기 · 직접 작성",
    toneCls: "tone-1",
    icon: <Plus size={16} />,
    href: "/jobs",
  },
  {
    label: "기업분석 시작",
    sub: "컬처 · 도메인 · 기술 스택",
    toneCls: "tone-2",
    icon: <Building />,
  },
  {
    label: "캘린더 보기",
    sub: "월·주·일 전형 일정",
    toneCls: "tone-3",
    icon: <Calendar />,
  },
];

export function Shortcuts() {
  return (
    <section className="shortcuts">
      <div className="lead">
        <span className="k">SHORTCUTS</span>
        <span className="t">다음 한 걸음, 어디부터 할까요?</span>
      </div>
      <div className="shortcuts-grid">
        {ITEMS.map((it) =>
          it.href ? (
            <Link key={it.label} className={`shortcut ${it.toneCls}`} href={it.href}>
              <span className="ico">{it.icon}</span>
              <div className="body">
                <span className="nm">{it.label}</span>
                <span className="sub">{it.sub}</span>
              </div>
            </Link>
          ) : (
            <div
              key={it.label}
              className={`shortcut ${it.toneCls} is-disabled`}
              role="link"
              aria-disabled="true"
              tabIndex={-1}
              style={{ opacity: 0.55, cursor: "not-allowed", position: "relative" }}
            >
              <span className="ico">{it.icon}</span>
              <div className="body">
                <span className="nm">{it.label}</span>
                <span className="sub">{it.sub}</span>
              </div>
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--color-text-muted)",
                  color: "var(--color-bg)",
                }}
              >
                준비중
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
