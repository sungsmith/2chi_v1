"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PostingEditModal } from "./posting-edit-modal";
import { fetchPosting, deletePosting, patchPosting } from "@/lib/api/posting";
import type { JobPosting, JobPostingPatchRequest } from "@/lib/types/posting";

const Ico = {
  ArrowLeft: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
    </svg>
  ),
  Edit: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Sparkle: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73.71.71M3 12h1m16 0h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Layers: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Target: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  FileEdit: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="10" y1="12" x2="16" y2="12" />
      <line x1="10" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Plus: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

type Props = { id: number };

function srcLabel(source: string) {
  if (source === "SARAMIN") return "사람인";
  if (source === "URL") return "URL 등록";
  return "직접 작성";
}

function formatDday(deadline: string | null): string {
  if (!deadline) return "—";
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-day";
  return `D-${diff}`;
}

function formatDeadlineStr(deadline: string | null): string {
  if (!deadline) return "—";
  const d = new Date(deadline);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatDeadlineDay(deadline: string | null): string {
  if (!deadline) return "";
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return weekdays[new Date(deadline).getDay()];
}

function formatAdded(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

// Exported variant that accepts a posting directly (for tests)
export function PostingDetailContent({ posting: initialPosting }: { posting: JobPosting }) {
  const router = useRouter();
  const [current, setCurrent] = useState<JobPosting>(initialPosting);
  const [editOpen, setEditOpen] = useState(false);

  const dday = formatDday(current.deadline);

  async function handleDelete() {
    if (!window.confirm(`"${current.title}" 공고를 삭제할까요?`)) return;
    await deletePosting(current.id);
    router.push("/company/postings");
  }

  async function handleSave(patch: JobPostingPatchRequest) {
    const updated = await patchPosting(current.id, patch);
    setCurrent(updated);
    setEditOpen(false);
  }

  async function handleDeleteFromModal() {
    await deletePosting(current.id);
    router.push("/company/postings");
  }

  return (
    <div className="pd-shell">
      <Link href="/company/postings" className="pd-back">
        <Ico.ArrowLeft size={12} /> 목록으로
      </Link>

      {/* HEADER CARD */}
      <section className="pd-head-card">
        <div className="pd-head-top">
          <div className="left">
            <span className="crumb">
              기업 / 채용공고 / <span className="co">{current.company}</span>
            </span>
            <h1>{current.title}</h1>
            <div className="meta">
              {current.jobRole && <span>{current.jobRole}</span>}
              {current.jobRole && <span className="sep" />}
              <span className="src-pill">{srcLabel(current.source)}</span>
              <span className="sep" />
              <span>등록 {formatAdded(current.createdAt)}</span>
            </div>
          </div>
          <div className="pd-head-actions">
            <button className="btn ghost sm" onClick={() => setEditOpen(true)}>
              <Ico.Edit size={12} /> 편집
            </button>
            <button className="btn ghost sm" onClick={handleDelete}>
              삭제
            </button>
            <Link
              href={`/cover-letters/variants/new?postingId=${current.id}`}
              className="btn primary sm"
            >
              <Ico.Sparkle size={12} /> 자소서 쓰러 가기
            </Link>
          </div>
        </div>
        <div className="pd-stats">
          <div className="stat">
            <span className="k">D-day</span>
            <span className="v dday">{dday}</span>
          </div>
          <div className="stat">
            <span className="k">마감일</span>
            <span className="v" style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: 0 }}>
              {formatDeadlineStr(current.deadline)}
              {current.deadline && <span className="unit">{formatDeadlineDay(current.deadline)}</span>}
            </span>
          </div>
          <div className="stat">
            <span className="k">출처</span>
            <span className="v">{srcLabel(current.source)}</span>
          </div>
          <div className="stat">
            <span className="k">키워드</span>
            <span className="v">{current.keywords.length}<span className="unit">개</span></span>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="pd-grid">
        <div className="pd-col">
          {/* JD card */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="ttl">
                <span className="ico"><Ico.Layers size={13} /></span>채용 정보 (JD)
              </span>
              <span className="meta">{srcLabel(current.source)}</span>
            </div>
            <div className="pd-card-body">
              {current.mainTasks && (
                <>
                  <h4>주요 업무</h4>
                  <ul>
                    {current.mainTasks.split("\n").filter(Boolean).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
              {current.requirements && (
                <>
                  <h4>자격 요건</h4>
                  <ul>
                    {current.requirements.split("\n").filter(Boolean).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
              {current.preferred && (
                <>
                  <h4>우대 사항</h4>
                  <ul>
                    {current.preferred.split("\n").filter(Boolean).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
              {!current.mainTasks && !current.requirements && !current.preferred && (
                <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                  채용 공고 상세 정보가 없어요. 편집에서 내용을 추가해보세요.
                </p>
              )}
            </div>
          </section>

          {/* Keywords card */}
          {current.keywords.length > 0 && (
            <section className="pd-card">
              <div className="pd-card-head">
                <span className="ttl mint">
                  <span className="ico"><Ico.Target size={13} /></span>추출된 키워드
                </span>
                <span className="meta">JD 분석 키워드</span>
              </div>
              <div className="pd-match-row matched">
                <div className="row-head">
                  <span className="nm">
                    키워드 <span className="count">{current.keywords.length}</span>
                  </span>
                </div>
                <div className="chip-row">
                  {current.keywords.map((kw) => (
                    <span key={kw} className="chip">{kw}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Cover letters */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="ttl lav">
                <span className="ico"><Ico.FileEdit size={13} /></span>연결된 자소서
              </span>
              <span className="meta">변형본 포함</span>
            </div>
            <button
              className="pd-cl-add"
              onClick={() =>
                router.push(`/cover-letters/variants/new?postingId=${current.id}`)
              }
            >
              <Ico.Plus size={12} /> 새 자소서 변형본 만들기
            </button>
          </section>
        </div>

        {/* RIGHT RAIL */}
        <aside className="pd-col">
          <section className="pd-rail-card">
            <span className="rail-ttl">공고 정보</span>
            {current.jobRole && (
              <div className="pd-rail-row">
                <span className="k">직무</span>
                <span className="v">{current.jobRole}</span>
              </div>
            )}
            <div className="pd-rail-row">
              <span className="k">출처</span>
              <span className="v">{srcLabel(current.source)}</span>
            </div>
            {current.sourceUrl && (
              <div className="pd-rail-row">
                <span className="k">원문</span>
                <a
                  href={current.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v link"
                >
                  원문 보기
                </a>
              </div>
            )}
          </section>

          <section className="pd-rail-card">
            <span className="rail-ttl">날짜 정보</span>
            <div className="pd-rail-row">
              <span className="k">마감일</span>
              <span className="v">{current.deadline ?? "—"}</span>
            </div>
            <div className="pd-rail-row">
              <span className="k">등록일</span>
              <span className="v">{formatAdded(current.createdAt)}</span>
            </div>
          </section>

          <section className="pd-rail-card">
            <span className="rail-ttl">빠른 액션</span>
            <Link
              href={`/cover-letters/variants/new?postingId=${current.id}`}
              className="btn primary"
              style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
            >
              <Ico.Sparkle size={14} /> 자소서 쓰러 가기
            </Link>
          </section>
        </aside>
      </div>

      {editOpen && (
        <PostingEditModal
          posting={current}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          onDelete={handleDeleteFromModal}
        />
      )}
    </div>
  );
}

// Default export for the route page: fetches by id
export function PostingDetailLoader({ id }: Props) {
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchPosting(id)
      .then(setPosting)
      .catch((e) => setError(e instanceof Error ? e.message : "공고를 불러오지 못했어요."));
  }, [id]);

  if (error) {
    return (
      <section style={{ padding: 32 }}>
        <p style={{ color: "var(--color-semantic-error)" }}>{error}</p>
        <Link href="/company/postings" className="btn ghost">목록으로</Link>
      </section>
    );
  }

  if (!posting) {
    return (
      <section style={{ padding: 32 }}>
        <p style={{ color: "var(--color-text-muted)" }}>불러오는 중…</p>
      </section>
    );
  }

  return <PostingDetailContent posting={posting} />;
}
