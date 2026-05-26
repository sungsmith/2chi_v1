import { KanbanView } from "@/components/applications/kanban-view";
import { KAN_COLS_MOCK } from "@/lib/mock/applications";

export const metadata = {
  title: "지원 현황 · 2chi",
};

export default function ApplicationsPage() {
  return <KanbanView columns={KAN_COLS_MOCK} />;
}
