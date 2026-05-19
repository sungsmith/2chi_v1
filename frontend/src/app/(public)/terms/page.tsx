import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";

export const metadata = {
  title: "서비스 이용 약관 · 2chi",
};

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), "..", "files", "md", "2chi_v1_terms_of_service_v0.1.md");
  const content = await fs.readFile(filePath, "utf-8");

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
