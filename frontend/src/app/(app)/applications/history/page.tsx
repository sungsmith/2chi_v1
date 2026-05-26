import { HistoryView } from "@/components/applications/history-view";
import { HISTORY_MOCK } from "@/lib/mock/applications";

export default function ApplicationsHistoryPage() {
  return <HistoryView entries={HISTORY_MOCK} />;
}
