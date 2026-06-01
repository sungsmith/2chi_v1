"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  fetchProfile,
  updateProfileBasic,
} from "@/lib/api/profile";
import {
  fetchEducations,
  createEducation,
  deleteEducation,
} from "@/lib/api/education";
import {
  fetchCertificates,
  createCertificate,
  deleteCertificate,
} from "@/lib/api/certificate";
import {
  fetchExperiences,
  createExperience,
  deleteExperience,
} from "@/lib/api/experience";
import type {
  ProfileBasic,
  Education,
  Certificate,
  Experience,
  EducationLevel,
  EducationStatus,
  ExperienceType,
  ProfileBasicUpdateRequest,
} from "@/lib/types/me-profile";
import {
  EDUCATION_LEVEL_LABEL,
  EDUCATION_STATUS_LABEL,
  EXPERIENCE_TYPE_LABEL,
} from "@/lib/types/me-profile";

/* ---- Icons ---- */

const IcoGradCap = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6"/>
    <path d="M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5a6 3 0 0 0 12 0v-5"/>
  </svg>
);

const IcoAward = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/>
  </svg>
);

const IcoStar = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L15 8.5 22 9.3 17 14.1 18.5 21 12 17.8 5.5 21 7 14.1 2 9.3 9 8.5 z"/>
  </svg>
);

const IcoEdit = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IcoTrash = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);

const IcoPlus = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

/* ---- Shared sub-components ---- */

function ProfileSubHead({
  idx,
  title,
  sub,
  action,
}: {
  idx: number;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="sub-section-head">
      <div className="head-l">
        <span className="num">{String(idx).padStart(2, "0")}</span>
        <div>
          <div className="ttl">{title}</div>
          {sub && <div className="sub">{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function ListRow({
  tone = "",
  icon,
  nm,
  meta,
  onEdit,
  onDelete,
}: {
  tone?: string;
  icon: ReactNode;
  nm: ReactNode;
  meta: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={"list-row " + tone}>
      <span className="badge-ico">{icon}</span>
      <div className="body">
        <div className="nm">{nm}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="actions">
        {onEdit && (
          <button className="iconbtn" aria-label="편집" onClick={onEdit}>
            {IcoEdit}
          </button>
        )}
        {onDelete && (
          <button className="iconbtn" aria-label="삭제" onClick={onDelete}>
            {IcoTrash}
          </button>
        )}
      </div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-text" onClick={onClick}>
      {IcoPlus}{" "}추가
    </button>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="list-row" style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
      {message}
    </div>
  );
}

/* ---- Education section ---- */

const EDUCATION_LEVELS: EducationLevel[] = ["HIGH_SCHOOL", "UNIVERSITY", "GRADUATE"];
const EDUCATION_STATUSES: EducationStatus[] = ["GRADUATED", "ATTENDING", "LEAVE", "DROP"];

function EducationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { level: EducationLevel; school: string; status: EducationStatus }) => Promise<void>;
  onCancel: () => void;
}) {
  const [level, setLevel] = useState<EducationLevel>("UNIVERSITY");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [status, setStatus] = useState<EducationStatus>("GRADUATED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!school.trim()) { setError("학교명을 입력해주세요"); return; }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        level,
        school: school.trim(),
        status,
        ...(major.trim() ? { major: major.trim() } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      } as Parameters<typeof onSubmit>[0]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      style={{
        marginTop: 12, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="edu-level">학력 구분</label>
        <select
          id="edu-level"
          className="input"
          value={level}
          onChange={(e) => setLevel(e.target.value as EducationLevel)}
        >
          {EDUCATION_LEVELS.map((l) => (
            <option key={l} value={l}>{EDUCATION_LEVEL_LABEL[l]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="edu-school">학교명<span className="req">*</span></label>
        <input
          id="edu-school"
          className={`input${error ? " error" : ""}`}
          autoFocus
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="OO대학교"
        />
        {error && <div className="helper error">{error}</div>}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="edu-major">전공</label>
        <input
          id="edu-major"
          className="input"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder="컴퓨터공학"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="edu-start">입학일</label>
          <input
            id="edu-start"
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="edu-end">졸업일</label>
          <input
            id="edu-end"
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="edu-status">상태</label>
        <select
          id="edu-status"
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as EducationStatus)}
        >
          {EDUCATION_STATUSES.map((s) => (
            <option key={s} value={s}>{EDUCATION_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
      </div>
    </form>
  );
}

/* ---- Certificate section ---- */

function CertificateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; issuer?: string; acquiredAt?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("자격증명을 입력해주세요"); return; }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        ...(issuer.trim() ? { issuer: issuer.trim() } : {}),
        ...(acquiredAt ? { acquiredAt } : {}),
        ...(score.trim() ? { score: score.trim() } : {}),
      } as Parameters<typeof onSubmit>[0]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      style={{
        marginTop: 12, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="cert-name">자격증명<span className="req">*</span></label>
        <input
          id="cert-name"
          className={`input${error ? " error" : ""}`}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="정보처리기사"
        />
        {error && <div className="helper error">{error}</div>}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="cert-issuer">발급 기관</label>
        <input
          id="cert-issuer"
          className="input"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          placeholder="한국산업인력공단"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="cert-date">취득일</label>
          <input
            id="cert-date"
            className="input"
            type="date"
            value={acquiredAt}
            onChange={(e) => setAcquiredAt(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="cert-score">점수</label>
          <input
            id="cert-score"
            className="input"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="900점"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
      </div>
    </form>
  );
}

/* ---- Experience section ---- */

const EXPERIENCE_TYPES: ExperienceType[] = [
  "INTERN", "CLUB", "CONTEST", "VOLUNTEER", "SIDE_PROJECT", "OTHER",
];

function ExperienceForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { type: ExperienceType; name: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<ExperienceType>("INTERN");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [role, setRole] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("활동명을 입력해주세요"); return; }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        type,
        name: name.trim(),
        ...(organization.trim() ? { organization: organization.trim() } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(role.trim() ? { role: role.trim() } : {}),
        ...(summary.trim() ? { summary: summary.trim() } : {}),
      } as Parameters<typeof onSubmit>[0]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      style={{
        marginTop: 12, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="exp-type">유형</label>
        <select
          id="exp-type"
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value as ExperienceType)}
        >
          {EXPERIENCE_TYPES.map((t) => (
            <option key={t} value={t}>{EXPERIENCE_TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="exp-name">활동명<span className="req">*</span></label>
        <input
          id="exp-name"
          className={`input${error ? " error" : ""}`}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="백엔드 스터디 리딩"
        />
        {error && <div className="helper error">{error}</div>}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="exp-org">기관 / 단체</label>
        <input
          id="exp-org"
          className="input"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="(주)예시기업"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="exp-start">시작일</label>
          <input
            id="exp-start"
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="exp-end">종료일</label>
          <input
            id="exp-end"
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="helper">진행 중이면 비워두세요</div>
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="exp-role">역할</label>
        <input
          id="exp-role"
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="백엔드 개발"
        />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="exp-summary">활동 내용</label>
        <textarea
          id="exp-summary"
          className="input"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="주요 내용을 간략히 적어주세요"
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
      </div>
    </form>
  );
}

/* ---- Helper: format date range ---- */
function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return d.slice(0, 7); // YYYY-MM
}

function fmtRange(start: string | null | undefined, end: string | null | undefined) {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} — 진행 중`;
  return null;
}

/* ---- ProfileView ---- */

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileBasic | null>(null);
  const [educations, setEducations] = useState<Education[] | null>(null);
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Basic info edit state
  const [basicName, setBasicName] = useState("");
  const [basicPhone, setBasicPhone] = useState("");
  const [basicRegion, setBasicRegion] = useState("");
  const [basicIntro, setBasicIntro] = useState("");
  const [basicSaving, setBasicSaving] = useState(false);

  // Add form visibility
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [addingExp, setAddingExp] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchEducations(),
      fetchCertificates(),
      fetchExperiences(),
    ])
      .then(([p, e, c, x]) => {
        setProfile(p);
        setBasicName(p.name ?? "");
        setBasicPhone(p.phone ?? "");
        setBasicRegion(p.region ?? "");
        setBasicIntro(p.introduction ?? "");
        setEducations(e);
        setCertificates(c);
        setExperiences(x);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "정보를 불러오지 못했어요.");
      });
  }, []);

  async function handleBasicSave() {
    const req: ProfileBasicUpdateRequest = {
      name: basicName || null,
      phone: basicPhone || null,
      region: basicRegion || null,
      introduction: basicIntro || null,
    };
    setBasicSaving(true);
    try {
      const updated = await updateProfileBasic(req);
      setProfile(updated);
    } finally {
      setBasicSaving(false);
    }
  }

  async function handleAddEducation(req: Parameters<typeof createEducation>[0]) {
    const created = await createEducation(req);
    setEducations((prev) => [...(prev ?? []), created]);
    setAddingEdu(false);
  }

  async function handleDeleteEducation(id: number) {
    await deleteEducation(id);
    setEducations((prev) => (prev ?? []).filter((e) => e.id !== id));
  }

  async function handleAddCertificate(req: Parameters<typeof createCertificate>[0]) {
    const created = await createCertificate(req);
    setCertificates((prev) => [...(prev ?? []), created]);
    setAddingCert(false);
  }

  async function handleDeleteCertificate(id: number) {
    await deleteCertificate(id);
    setCertificates((prev) => (prev ?? []).filter((c) => c.id !== id));
  }

  async function handleAddExperience(req: Parameters<typeof createExperience>[0]) {
    const created = await createExperience(req);
    setExperiences((prev) => [...(prev ?? []), created]);
    setAddingExp(false);
  }

  async function handleDeleteExperience(id: number) {
    await deleteExperience(id);
    setExperiences((prev) => (prev ?? []).filter((x) => x.id !== id));
  }

  if (loadError) {
    return (
      <div role="alert" style={{
        padding: "12px 16px",
        background: "var(--color-semantic-error-bg)",
        color: "var(--color-semantic-error)",
        borderRadius: "var(--radius-md)",
        fontSize: 13,
      }}>{loadError}</div>
    );
  }

  if (profile === null) {
    return (
      <div style={{ padding: "24px 0", color: "var(--color-text-secondary)" }}>불러오는 중…</div>
    );
  }

  return (
    <section className="me-section">
      {/* 01 기본정보 */}
      <ProfileSubHead idx={1} title="기본정보" sub="자소서 헤더 · 추천 공고 매칭에 사용" />
      <div className="form-grid">
        <div className="fld">
          <label className="lbl" htmlFor="basic-name">이름 <span className="req">*</span></label>
          <input
            id="basic-name"
            className="input"
            value={basicName}
            onChange={(e) => setBasicName(e.target.value)}
          />
        </div>
        <div className="fld">
          <label className="lbl" htmlFor="basic-phone">연락처</label>
          <input
            id="basic-phone"
            className="input"
            value={basicPhone}
            onChange={(e) => setBasicPhone(e.target.value)}
          />
        </div>
        <div className="fld">
          <label className="lbl" htmlFor="basic-region">지역</label>
          <input
            id="basic-region"
            className="input"
            value={basicRegion}
            onChange={(e) => setBasicRegion(e.target.value)}
          />
        </div>
        <div className="fld" style={{ gridColumn: "1 / -1" }}>
          <label className="lbl" htmlFor="basic-intro">자기소개</label>
          <textarea
            id="basic-intro"
            className="input"
            rows={3}
            value={basicIntro}
            onChange={(e) => setBasicIntro(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          className="btn"
          aria-label="기본정보 저장"
          disabled={basicSaving}
          onClick={() => void handleBasicSave()}
        >
          {basicSaving ? "저장 중…" : "저장"}
        </button>
      </div>

      <div className="sub-divider" />

      {/* 02 학력 */}
      <div data-section="education">
        <ProfileSubHead
          idx={2}
          title="학력"
          sub="최신순으로 정렬돼요"
          action={<AddButton onClick={() => setAddingEdu(true)} />}
        />
        <div className="list">
          {educations !== null && educations.length === 0 && !addingEdu && (
            <EmptyRow message="아직 등록된 학력이 없어요." />
          )}
          {(educations ?? []).map((edu, i) => (
            <ListRow
              key={edu.id}
              tone={i === 0 ? "mint" : ""}
              icon={IcoGradCap}
              nm={
                <>
                  <span>{edu.school}</span>
                  {edu.major && <span style={{ color: "var(--color-text-secondary)", marginLeft: 4 }}>· {edu.major}</span>}
                </>
              }
              meta={
                <>
                  {EDUCATION_LEVEL_LABEL[edu.level]}
                  {fmtRange(edu.startDate, edu.endDate) && ` · ${fmtRange(edu.startDate, edu.endDate)}`}
                  {` · ${EDUCATION_STATUS_LABEL[edu.status]}`}
                </>
              }
              onDelete={() => void handleDeleteEducation(edu.id)}
            />
          ))}
        </div>
        {addingEdu && (
          <EducationForm
            onSubmit={(req) => handleAddEducation(req)}
            onCancel={() => setAddingEdu(false)}
          />
        )}
      </div>

      <div className="sub-divider" />

      {/* 03 자격증 */}
      <div data-section="certificate">
        <ProfileSubHead
          idx={3}
          title="자격증"
          sub="희망 포지션 표준 역량 매트릭스와 비교돼요"
          action={<AddButton onClick={() => setAddingCert(true)} />}
        />
        <div className="list">
          {certificates !== null && certificates.length === 0 && !addingCert && (
            <EmptyRow message="아직 등록된 자격증이 없어요." />
          )}
          {(certificates ?? []).map((cert, i) => (
            <ListRow
              key={cert.id}
              tone={i === 0 ? "lav" : ""}
              icon={IcoAward}
              nm={cert.name}
              meta={
                <>
                  {cert.issuer ?? ""}
                  {cert.acquiredAt ? ` · ${cert.acquiredAt.slice(0, 7)}` : ""}
                  {cert.score ? ` · ${cert.score}` : ""}
                </>
              }
              onDelete={() => void handleDeleteCertificate(cert.id)}
            />
          ))}
        </div>
        {addingCert && (
          <CertificateForm
            onSubmit={(req) => handleAddCertificate(req)}
            onCancel={() => setAddingCert(false)}
          />
        )}
      </div>

      <div className="sub-divider" />

      {/* 04 경험 · 대외활동 */}
      <div data-section="experience">
        <ProfileSubHead
          idx={4}
          title="경험 · 대외활동"
          sub="인턴, 동아리, 공모전, 봉사, 사이드 프로젝트 모두 OK"
          action={<AddButton onClick={() => setAddingExp(true)} />}
        />
        <div className="list">
          {experiences !== null && experiences.length === 0 && !addingExp && (
            <EmptyRow message="아직 등록된 경험이 없어요." />
          )}
          {(experiences ?? []).map((exp, i) => (
            <ListRow
              key={exp.id}
              tone={i === 0 ? "peach" : ""}
              icon={IcoStar}
              nm={
                <>
                  <span>{exp.name}</span>
                  {exp.organization && <span style={{ color: "var(--color-text-secondary)", marginLeft: 4 }}>· {exp.organization}</span>}
                </>
              }
              meta={
                <>
                  {EXPERIENCE_TYPE_LABEL[exp.type]}
                  {fmtRange(exp.startDate, exp.endDate) && ` · ${fmtRange(exp.startDate, exp.endDate)}`}
                  {exp.role ? ` · ${exp.role}` : ""}
                </>
              }
              onDelete={() => void handleDeleteExperience(exp.id)}
            />
          ))}
        </div>
        {addingExp && (
          <ExperienceForm
            onSubmit={(req) => handleAddExperience(req)}
            onCancel={() => setAddingExp(false)}
          />
        )}
      </div>
    </section>
  );
}
