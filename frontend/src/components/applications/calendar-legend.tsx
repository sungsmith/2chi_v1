import type { EventType } from "@/lib/types/application";
import { EVENT_TYPE_LABEL, EVENT_TYPE_TOKEN_CLASS } from "@/lib/types/application";

const TYPES: EventType[] = [
  "DOC_DEADLINE","CODING_TEST","FIRST_INTERVIEW","SECOND_INTERVIEW",
  "EXEC_INTERVIEW","NEGOTIATION","PASSED","FAILED","ETC",
];

export function CalendarLegend() {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 11 }}>
      {TYPES.map((t) => (
        <span key={t}><span className={EVENT_TYPE_TOKEN_CLASS[t]}>{EVENT_TYPE_LABEL[t]}</span></span>
      ))}
    </div>
  );
}
