import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";

export const metadata = {
  title: "개인정보 처리방침 · 2chi",
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), "..", "files", "md", "2chi_v1_privacy_policy_v0.1.md");
  const content = await fs.readFile(filePath, "utf-8");

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
