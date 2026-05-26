import type { HistoryEntry } from "@/lib/mock/applications";
import * as Icons from "@/components/ui/icons";

type IcoKey = keyof typeof Icons;

// Inline X icon for fail cases (not in global icons)
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18"/>
      <line x1="18" y1="6" x2="6" y2="18"/>
    </svg>
  );
}

function renderIcon(name: string, size = 14) {
  if (name === "X") return <XIcon size={size} />;
  const Comp = Icons[name as IcoKey] as React.ComponentType<{ size?: number }> | undefined;
  if (!Comp) return null;
  return <Comp size={size} />;
}

function renderMsg(entry: HistoryEntry) {
  const { msgParts, msg } = entry;
  if (!msgParts) return <span>{msg}</span>;

  const { bold, stageFrom, stageTo, suffix } = msgParts;

  // Build rich inline nodes
  const ArrowRight = Icons.ArrowRight as React.ComponentType<{ size?: number }>;

  return (
    <>
      {bold && <b>{bold}</b>}
      {stageFrom && <span className="stage-from">{stageFrom}</span>}
      {stageFrom && stageTo && <ArrowRight size={11} />}
      {stageTo && <span className="stage-to">{stageTo}</span>}
      {suffix && <span>{suffix}</span>}
    </>
  );
}

type Props = Pick<HistoryEntry, "time" | "icon" | "iconTone" | "msg" | "actor" | "msgParts">;

export function HistoryRow({ time, icon, iconTone, actor, msg, msgParts }: Props) {
  return (
    <div className="history-row">
      <span className="time">{time}</span>
      <span className={"icon" + (iconTone ? ` ${iconTone}` : "")}>
        {renderIcon(icon)}
      </span>
      <div className="body">
        <div className="msg">{renderMsg({ id: "", time, icon, iconTone, actor, msg, msgParts })}</div>
      </div>
      <span className="actor">{actor}</span>
    </div>
  );
}
