import { Sparkle } from "../icons";
import type { Career } from "@/lib/types/career";

type Props = { careers: Career[] };

function checkIssues(careers: Career[]): string[] {
  const issues: string[] = [];
  careers.forEach((c) => {
    c.projects.forEach((p) => {
      if (p.metrics.length === 0) {
        issues.push(`"${p.title}" 프로젝트의 정량 성과가 비어있어요.`);
      }
      const filled = [p.prar.problem, p.prar.rootCause, p.prar.approach, p.prar.result]
        .filter((v) => v !== null && v !== "").length;
      if (filled < 4 && filled > 0) {
        issues.push(`"${p.title}" 의 PRAR 4 셀 중 ${4 - filled}개가 비어있어요.`);
      }
    });
  });
  return issues;
}

export function AssistantNote({ careers }: Props) {
  const issues = checkIssues(careers);
  if (issues.length === 0) return null;

  return (
    <aside
      className="assistant-note"
      style={{
        padding: "12px 16px",
        background: "var(--color-yellow-50)",
        border: "1px solid var(--color-yellow-200)",
        borderRadius: "var(--radius-md)",
        margin: "16px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
        <Sparkle size={14} />
        보완 안내
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--color-text-secondary)" }}>
        {issues.slice(0, 5).map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
        {issues.length > 5 && <li>… 그 외 {issues.length - 5}건</li>}
      </ul>
    </aside>
  );
}
