import { Bell, Check, Sparkle, FileEdit, Plus } from "@/components/ui/icons";
import type { NotiCenterEntry } from "@/lib/mock/mypage";

const IcoMap: Record<string, React.FC<{ size?: number }>> = {
  Bell,
  Check,
  Sparkle,
  FileEdit,
  Plus,
};

interface NotiCenterViewProps {
  entries: NotiCenterEntry[];
}

function NotiRow({ entry }: { entry: NotiCenterEntry }) {
  const Icon = IcoMap[entry.icon] ?? Bell;
  const toneClass = entry.iconTone === "default" ? "" : ` ${entry.iconTone}`;
  return (
    <div className={`noti-row${entry.unread ? " unread" : ""}`}>
      <span className={`ico${toneClass}`}>
        <Icon size={14} />
      </span>
      <div className="body">
        <span className="ttl">{entry.msg}</span>
      </div>
      <span className="time">{entry.time}</span>
      <span className="unread-dot" />
    </div>
  );
}

export function NotiCenterView({ entries }: NotiCenterViewProps) {
  const unread = entries.filter((e) => e.unread);
  const read = entries.filter((e) => !e.unread);

  return (
    <>
      <section
        className="mp-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <div>
          <h1>알림 센터</h1>
          <div className="sub">
            최근 30일간 받은 알림이에요. 읽지 않은 알림은 페리윙클로 표시돼요.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn ghost sm" disabled>
            <Check size={12} /> 모두 읽음
          </button>
          <button className="btn secondary sm" disabled>
            전체 삭제
          </button>
        </div>
      </section>

      <section className="noti-shell">
        <div className="noti-day">오늘 · 2026.05.12 (화)</div>
        {unread.map((entry) => (
          <NotiRow key={entry.id} entry={entry} />
        ))}
        {read.length > 0 && (
          <>
            <div className="noti-day">2026.05.11 (월)</div>
            {read.map((entry) => (
              <NotiRow key={entry.id} entry={entry} />
            ))}
          </>
        )}
      </section>
    </>
  );
}
