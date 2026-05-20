import { Briefcase } from "./icons";

type Props = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="page-header" style={{ padding: "24px 32px 16px" }}>
      <div className="ctx-strip" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Briefcase size={14} />
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>내 정보 / 경력기술</span>
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ color: "var(--color-text-secondary)", marginTop: 6, fontSize: 14 }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
