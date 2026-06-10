"use client";

import { useEffect, useRef, useState } from "react";
import { Edit, Trash, Link as LinkIco, FileEdit, Download } from "@/components/ui/icons";
import { fetchPortfolioLinks, deletePortfolioLink } from "@/lib/api/portfolio";
import { fetchPortfolioFiles, uploadPortfolioFile, getPortfolioFileDownloadUrl, deletePortfolioFile } from "@/lib/api/portfolio-file";
import type { PortfolioLink, PortfolioLinkKind } from "@/lib/types/me-portfolio";
import type { PortfolioFile } from "@/lib/types/me-portfolio-file";
import { PortfolioModal } from "./portfolio-modal";

const GitHubSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
const NotionSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const UploadSvg = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function toneClass(kind: PortfolioLinkKind): string {
  if (kind === "NOTION") return " lav";
  if (kind === "BLOG") return " mint";
  return "";
}
function KindIcon({ kind }: { kind: PortfolioLinkKind }) {
  if (kind === "GITHUB") return <GitHubSvg />;
  if (kind === "NOTION") return <NotionSvg />;
  return <LinkIco size={18} />;
}
function kindLabel(kind: PortfolioLinkKind): string {
  if (kind === "GITHUB") return "GitHub";
  if (kind === "NOTION") return "Notion";
  if (kind === "BLOG") return "Blog";
  return "링크";
}

export function PortfolioView() {
  const [links, setLinks] = useState<PortfolioLink[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioLink | undefined>();
  const [files, setFiles] = useState<PortfolioFile[] | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetchPortfolioLinks()
      .then(setLinks)
      .catch((e) => setError(e instanceof Error ? e.message : "포트폴리오를 불러오지 못했어요."));
  }
  useEffect(() => { load(); }, []);

  function loadFiles() {
    fetchPortfolioFiles()
      .then(setFiles)
      .catch((e) => setFileError(e instanceof Error ? e.message : "파일을 불러오지 못했어요."));
  }
  useEffect(() => { loadFiles(); }, []);

  async function handleDelete(id: number) {
    try {
      await deletePortfolioLink(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요.");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(undefined);
    try {
      await uploadPortfolioFile(file);
      loadFiles();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "업로드에 실패했어요.");
    }
  }

  async function handleFileDownload(id: number) {
    try {
      const url = await getPortfolioFileDownloadUrl(id);
      window.location.assign(url);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "다운로드에 실패했어요.");
    }
  }

  async function handleFileDelete(id: number) {
    try {
      await deletePortfolioFile(id);
      loadFiles();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "삭제에 실패했어요.");
    }
  }

  const isEmpty = links !== null && links.length === 0;

  return (
    <section className="me-section">
      <div className="sec-head">
        <div className="sec-title">포트폴리오</div>
        <div className="head-r">
          <button className="btn secondary sm" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
            <LinkIco size={13} /> 링크 추가
          </button>
          <button className="btn secondary sm" type="button" onClick={() => fileInputRef.current?.click()}>
            <UploadSvg /> 파일 업로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>
      </div>

      {error && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {links === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : isEmpty ? (
        <div className="list-empty">아직 등록된 포트폴리오가 없어요. 첫 링크를 추가해보세요.</div>
      ) : (
        <div className="list">
          {links.map((link) => (
            <div key={link.id} className={`list-row${toneClass(link.kind)}`}>
              <span className="badge-ico"><KindIcon kind={link.kind} /></span>
              <a className="body" href={link.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <div className="nm">{link.title}</div>
                <div className="meta">{link.url}</div>
              </a>
              <span className="kind-pill">{kindLabel(link.kind)}</span>
              <div className="actions">
                <button className="iconbtn" aria-label="편집" onClick={() => { setEditing(link); setModalOpen(true); }}><Edit size={14} /></button>
                <button className="iconbtn" aria-label="삭제" onClick={() => handleDelete(link.id)}><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files && files.length > 0 && (
        <div className="list" style={{ marginTop: 8 }}>
          {files.map((f) => (
            <div key={f.id} className="list-row">
              <span className="badge-ico"><FileEdit size={16} /></span>
              <div className="body">
                <div className="nm">{f.filename}</div>
                <div className="meta">{formatFileSize(f.sizeBytes)}</div>
              </div>
              <span className="kind-pill">파일</span>
              <div className="actions">
                <button className="iconbtn" aria-label="파일 다운로드" type="button" onClick={() => handleFileDownload(f.id)}><Download size={14} /></button>
                <button className="iconbtn" aria-label="파일 삭제" type="button" onClick={() => handleFileDelete(f.id)}><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {fileError && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13, marginTop: 6 }}>{fileError}</div>}

      {modalOpen && (
        <PortfolioModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </section>
  );
}
