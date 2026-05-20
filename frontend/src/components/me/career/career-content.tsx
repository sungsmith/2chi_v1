"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "../page-header";
import { CareerCard } from "./career-card";
import { AssistantNote } from "./assistant-note";
import { Plus } from "../icons";
import { fetchCareers, createCareer } from "@/lib/api/career";
import type { Career } from "@/lib/types/career";
import { NewCareerForm } from "./new-career-form";

export function CareerContent() {
  const { user } = useAuth();
  const [careers, setCareers] = useState<Career[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [addingCareer, setAddingCareer] = useState(false);

  useEffect(() => {
    fetchCareers()
      .then(setCareers)
      .catch((e) => setError(e instanceof Error ? e.message : "경력 정보를 불러오지 못했어요."));
  }, []);

  function updateCareerInList(updated: Career) {
    setCareers((prev) => prev ? prev.map((c) => c.id === updated.id ? updated : c) : prev);
  }

  function removeCareerFromList(id: number) {
    setCareers((prev) => prev ? prev.filter((c) => c.id !== id) : prev);
  }

  async function handleAddCareer(req: {
    company: string;
    position?: string;
    startDate: string;
    endDate?: string | null;
  }) {
    try {
      const created = await createCareer(req);
      const withProjects: Career = { ...created, projects: created.projects ?? [] };
      setCareers((prev) => prev ? [withProjects, ...prev] : [withProjects]);
      setAddingCareer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회사 추가에 실패했어요.");
    }
  }

  if (!user) return null;

  return (
    <section className="career-page">
      <PageHeader title="경력기술" subtitle="회사 단위로 묶고, 프로젝트 안에 PRAR 4단으로 채워요." />

      {error && (
        <div role="alert" style={{
          margin: "0 32px 16px",
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{ padding: "0 32px 64px" }}>
        {careers === null ? (
          <div style={{ padding: "24px 0", color: "var(--color-text-secondary)" }}>불러오는 중…</div>
        ) : (
          <>
            <AssistantNote careers={careers} />
            {careers.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>
                아직 등록된 회사가 없어요. 첫 회사를 추가해보세요.
              </div>
            )}
            {careers.map((c, i) => (
              <CareerCard
                key={c.id}
                career={c}
                defaultOpen={i === 0}
                onChange={updateCareerInList}
                onDelete={() => removeCareerFromList(c.id)}
                onError={setError}
              />
            ))}
            {!addingCareer ? (
              <button className="btn" onClick={() => setAddingCareer(true)} style={{ marginTop: 12 }}>
                <Plus size={14} /> 회사 추가
              </button>
            ) : (
              <NewCareerForm
                onSubmit={handleAddCareer}
                onCancel={() => setAddingCareer(false)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
