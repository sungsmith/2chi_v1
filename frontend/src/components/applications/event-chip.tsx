"use client";

import type { EventListItem } from "@/lib/types/application";
import { EVENT_TYPE_LABEL } from "@/lib/types/application";

// Map EventType → cal-evt stage modifier class
const EVENT_TYPE_STAGE_CLASS: Record<string, string> = {
  DOC_DEADLINE: "doc",
  CODING_TEST: "code",
  FIRST_INTERVIEW: "int1",
  SECOND_INTERVIEW: "int2",
  EXEC_INTERVIEW: "exec",
  NEGOTIATION: "exec",
  PASSED: "ok",
  FAILED: "fail",
  ETC: "",
};

type Props = { event: EventListItem; onClick: () => void };

export function EventChip({ event, onClick }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={"cal-evt " + (EVENT_TYPE_STAGE_CLASS[event.type] ?? "")}
      aria-label={`${EVENT_TYPE_LABEL[event.type]} ${event.company}`}
    >
      <span className="time">{event.eventTime ? event.eventTime.slice(0, 5) : ""}</span>
      <span>{EVENT_TYPE_LABEL[event.type]} {event.company}</span>
    </div>
  );
}
