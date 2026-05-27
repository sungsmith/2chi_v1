"use client";

import type { NotiSettingItemDto } from "@/lib/types/mypage";

type Props = {
  item: NotiSettingItemDto;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
};

export function NotiSettingsRow({ item, onToggle, disabled = false }: Props) {
  return (
    <div className="mp-row">
      <div className="body">
        <span className="nm">{item.label}</span>
        <span className="desc">{item.description}</span>
      </div>
      {item.locked ? (
        <span className="value-pill" title="계정 보안 알림은 끌 수 없어요">강제 ON</span>
      ) : (
        <button
          type="button"
          className={`switch${item.enabled ? " on" : ""}`}
          aria-label={`${item.label} 알림 ${item.enabled ? "켜짐" : "꺼짐"}`}
          onClick={() => onToggle(!item.enabled)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
