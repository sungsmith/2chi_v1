interface NotiSettingsRowProps {
  nm: string;
  desc: string;
  defOn?: boolean;
  locked?: boolean;
}

export function NotiSettingsRow({ nm, desc, defOn = true, locked = false }: NotiSettingsRowProps) {
  return (
    <div className="mp-row">
      <div className="body">
        <span className="nm">{nm}</span>
        <span className="desc">{desc}</span>
      </div>
      {locked ? (
        <span className="value-pill" title="계정 보안 알림은 끌 수 없어요">강제 ON</span>
      ) : (
        <span className={`switch${defOn ? " on" : ""}`} aria-label={`${nm} 알림 ${defOn ? "켜짐" : "꺼짐"}`} />
      )}
    </div>
  );
}
