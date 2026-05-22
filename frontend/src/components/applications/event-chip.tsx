"use client";

import type { EventListItem } from "@/lib/types/application";
import { EVENT_TYPE_TOKEN_CLASS, EVENT_TYPE_LABEL } from "@/lib/types/application";

type Props = { event: EventListItem; onClick: () => void };

export function EventChip({ event, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={EVENT_TYPE_TOKEN_CLASS[event.type]}
      style={{
        border: "none", textAlign: "left", width: "100%",
        fontSize: 10, padding: "2px 6px", marginTop: 2,
        cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}
      aria-label={`${EVENT_TYPE_LABEL[event.type]} ${event.company}`}
    >
      {EVENT_TYPE_LABEL[event.type]} {event.company}
    </button>
  );
}
