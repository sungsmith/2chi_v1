import { Edit, FileEdit, Link as LinkIco } from "@/components/ui/icons";
import type { PortfolioSnapshot, PortfolioLink, PortfolioFile } from "@/lib/mock/me";

type Props = { data: PortfolioSnapshot };

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
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

function linkToneClass(kind: PortfolioLink["kind"]): string {
  if (kind === "notion") return " lav";
  if (kind === "blog") return " mint";
  return "";
}

function LinkBadgeIcon({ kind }: { kind: PortfolioLink["kind"] }) {
  if (kind === "github") return <GitHubSvg />;
  if (kind === "notion") return <NotionSvg />;
  return <LinkIco size={18} />;
}

function kindPillLabel(kind: PortfolioLink["kind"]): string {
  if (kind === "github") return "GitHub";
  if (kind === "notion") return "Notion";
  if (kind === "blog") return "Blog";
  return "링크";
}

function LinkRow({ link }: { link: PortfolioLink }) {
  return (
    <a className={`list-row${linkToneClass(link.kind)}`} href={link.url} target="_blank" rel="noreferrer">
      <span className="badge-ico">
        <LinkBadgeIcon kind={link.kind} />
      </span>
      <div className="body">
        <div className="nm">{link.title}</div>
        <div className="meta">{link.url}</div>
      </div>
      <span className="kind-pill">{kindPillLabel(link.kind)}</span>
      <div className="actions">
        <button className="iconbtn" aria-label="편집"><Edit size={14} /></button>
      </div>
    </a>
  );
}

function FileRow({ file }: { file: PortfolioFile }) {
  return (
    <div className="list-row mint">
      <span className="badge-ico"><FileEdit size={16} /></span>
      <div className="body">
        <div className="nm">{file.filename}</div>
        <div className="meta">파일 · {file.size} · 업로드 {file.uploadedAt}</div>
      </div>
      <span className="kind-pill file">파일</span>
      <div className="actions">
        <button className="iconbtn" aria-label="편집"><Edit size={14} /></button>
      </div>
    </div>
  );
}

export function PortfolioView({ data }: Props) {
  const isEmpty = data.links.length === 0 && data.files.length === 0;

  return (
    <section className="me-section">
      <div className="sec-head">
        <div className="sec-title">포트폴리오</div>
        <div className="head-r">
          <button className="btn secondary sm">
            <LinkIco size={13} /> 링크 추가
          </button>
          <button className="btn secondary sm">
            <UploadSvg />
            파일 업로드
          </button>
        </div>
      </div>
      {isEmpty ? (
        <div className="list-empty">
          아직 등록된 포트폴리오가 없어요. 첫 링크나 파일을 추가해보세요.
        </div>
      ) : (
        <div className="list">
          {data.links.map((link) => (
            <LinkRow key={link.url} link={link} />
          ))}
          {data.files.map((file) => (
            <FileRow key={file.filename} file={file} />
          ))}
        </div>
      )}
    </section>
  );
}
