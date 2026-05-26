"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "../page-header";
import { CareerCard } from "./career-card";
import { AssistantNote } from "./assistant-note";
import { Plus, Sparkle, ArrowRight } from "@/components/ui/icons";
import { fetchCareers, createCareer } from "@/lib/api/career";
import type { Career, CareerCreateRequest } from "@/lib/types/career";
import { NewCareerForm } from "./new-career-form";

function CareerMeta() {
  return (
    <div className="career-meta">
      <span className="meta-item"><span className="sw"/>백엔드</span>
      <span className="meta-sep"/>
      <span className="meta-item"><span className="sw lav"/>PRAR · 4단 구조</span>
      <a className="meta-edit" href="/me">기초 정보에서 변경 <ArrowRight size={11}/></a>
    </div>
  );
}

export function CareerContent() {
  const { user } = useAuth();
  const [careers, setCareers] = useState<Career[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [addingCareer, setAddingCareer] = useState(false);
  const [coachOpen, setCoachOpen] = useState(true);

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

  async function handleAddCareer(req: CareerCreateRequest) {
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
    <section className="me-section">
      <PageHeader section="career" />

      <CareerMeta />

      {coachOpen && (
        <div className="info-banner lav" role="note">
          <span className="ico"><Sparkle size={14}/></span>
          <span className="body">
            <b>PRAR 구조로 정리하면 자소서에 그대로 다시 쓸 수 있어요.</b>
            {" "}문제 · 원인 · 접근 · 결과 네 칸으로 나눠 채워보세요.
          </span>
          <button className="x" aria-label="안내 닫기" onClick={() => setCoachOpen(false)}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
      )}

      {error && (
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
        }}>{error}</div>
      )}

      {careers === null ? (
        <div style={{ padding: "24px 0", color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : (
        <>
          <div className="work-section">
            <div className="work-section-head">
              <h2 className="work-title">
                회사 경력 <span className="work-count">{careers.length}</span>
              </h2>
              <div className="work-actions">
                {!addingCareer && (
                  <button className="btn primary sm" onClick={() => setAddingCareer(true)}>
                    <Plus size={12} />회사 추가
                  </button>
                )}
              </div>
            </div>

            {careers.length === 0 && !addingCareer && (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--color-text-secondary)" }}>
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

            {addingCareer && (
              <NewCareerForm
                onSubmit={handleAddCareer}
                onCancel={() => setAddingCareer(false)}
              />
            )}

            {!addingCareer && (
              <button className="add-company-row" onClick={() => setAddingCareer(true)}>
                <Plus size={14} />
                회사 추가
                <span className="hint">신입이면 인턴 · 동아리 · 사이드 프로젝트도 &ldquo;회사&rdquo;로 추가할 수 있어요</span>
              </button>
            )}
          </div>

          {careers.length > 0 && <AssistantNote careers={careers} />}
        </>
      )}
    </section>
  );
}
