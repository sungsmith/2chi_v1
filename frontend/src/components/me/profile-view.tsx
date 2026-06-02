"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  fetchProfile,
  updateProfileBasic,
} from "@/lib/api/profile";
import {
  fetchEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from "@/lib/api/education";
import {
  fetchCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/api/certificate";
import {
  fetchExperiences,
  createExperience,
  updateExperience,
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
import { Edit as IcoEdit, Trash as IcoTrash, Plus as IcoPlus } from "@/components/ui/icons";

/* ---- Icons (domain-specific, not in shared catalog) ---- */

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
            <IcoEdit size={14} />
          </button>
        )}
        {onDelete && (
          <button className="iconbtn" aria-label="삭제" onClick={onDelete}>
            <IcoTrash size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-text" onClick={onClick}>
      <IcoPlus size={12} />{" "}추가
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

type EducationFormData = {
  level: EducationLevel;
  school: string;
  major?: string;
  status: EducationStatus;
  startDate?: string;
  endDate?: string;
  gpa?: number | null;
  gpaMax?: number | null;
};

type EducationInitial = {
  level: EducationLevel;
  school: string;
  major: string | null;
  status: EducationStatus;
  startDate: string | null;
  endDate: string | null;
  gpa: number | null;
  gpaMax: number | null;
};

function EducationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: EducationInitial;
  onSubmit: (data: EducationFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [level, setLevel] = useState<EducationLevel>(initial?.level ?? "UNIVERSITY");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [major, setMajor] = useState(initial?.major ?? "");
  const [status, setStatus] = useState<EducationStatus>(initial?.status ?? "GRADUATED");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [gpaRaw, setGpaRaw] = useState(initial?.gpa != null ? String(initial.gpa) : "");
  const [gpaMaxRaw, setGpaMaxRaw] = useState(initial?.gpaMax != null ? String(initial.gpaMax) : "");
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
        gpa: gpaRaw === "" ? null : Number(gpaRaw),
        gpaMax: gpaMaxRaw === "" ? null : Number(gpaMaxRaw),
      });
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="edu-gpa">학점</label>
          <input
            id="edu-gpa"
            className="input"
            type="number"
            step="0.01"
            value={gpaRaw}
            onChange={(e) => setGpaRaw(e.target.value)}
            placeholder="3.8"
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="edu-gpa-max">만점</label>
          <input
            id="edu-gpa-max"
            className="input"
            type="number"
            step="0.01"
            value={gpaMaxRaw}
            onChange={(e) => setGpaMaxRaw(e.target.value)}
            placeholder="4.5"
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

/* ---- Certificate section ---- */

type CertificateFormData = {
  name: string;
  issuer?: string;
  acquiredAt?: string;
  score?: string;
};

type CertificateInitial = {
  name: string;
  issuer: string | null;
  acquiredAt: string | null;
  score: string | null;
};

function CertificateForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CertificateInitial;
  onSubmit: (data: CertificateFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [acquiredAt, setAcquiredAt] = useState(initial?.acquiredAt ?? "");
  const [score, setScore] = useState(initial?.score ?? "");
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
      });
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

type ExperienceFormData = {
  type: ExperienceType;
  name: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  role?: string;
  summary?: string;
};

type ExperienceInitial = {
  type: ExperienceType;
  name: string;
  organization: string | null;
  startDate: string | null;
  endDate: string | null;
  role: string | null;
  summary: string | null;
};

function ExperienceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: ExperienceInitial;
  onSubmit: (data: ExperienceFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<ExperienceType>(initial?.type ?? "INTERN");
  const [name, setName] = useState(initial?.name ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
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
      });
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
  const [basicBirthDate, setBasicBirthDate] = useState("");
  const [basicPhone, setBasicPhone] = useState("");
  const [basicRegion, setBasicRegion] = useState("");
  const [basicIntro, setBasicIntro] = useState("");
  const [basicSaving, setBasicSaving] = useState(false);

  // Add form visibility
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [addingExp, setAddingExp] = useState(false);

  // Edit state: which item id is being edited (null = none)
  const [editingEduId, setEditingEduId] = useState<number | null>(null);
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  // Per-section mutation errors
  const [eduError, setEduError] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);

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
        setBasicBirthDate(p.birthDate ?? "");
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
      birthDate: basicBirthDate || null,
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

  /* Education handlers */

  async function handleAddEducation(req: Parameters<typeof createEducation>[0]) {
    setEduError(null);
    try {
      const created = await createEducation(req);
      setEducations((prev) => [...(prev ?? []), created]);
      setAddingEdu(false);
    } catch (err) {
      setEduError(err instanceof Error ? err.message : "추가에 실패했어요. 다시 시도해주세요.");
      setAddingEdu(false);
    }
  }

  async function handleUpdateEducation(id: number, req: Parameters<typeof updateEducation>[1]) {
    setEduError(null);
    try {
      const updated = await updateEducation(id, req);
      setEducations((prev) => (prev ?? []).map((e) => e.id === id ? updated : e));
      setEditingEduId(null);
    } catch (err) {
      setEduError(err instanceof Error ? err.message : "수정에 실패했어요. 다시 시도해주세요.");
      setEditingEduId(null);
    }
  }

  async function handleDeleteEducation(id: number) {
    setEduError(null);
    try {
      await deleteEducation(id);
      setEducations((prev) => (prev ?? []).filter((e) => e.id !== id));
    } catch (err) {
      setEduError(err instanceof Error ? err.message : "삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  /* Certificate handlers */

  async function handleAddCertificate(req: Parameters<typeof createCertificate>[0]) {
    setCertError(null);
    try {
      const created = await createCertificate(req);
      setCertificates((prev) => [...(prev ?? []), created]);
      setAddingCert(false);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "추가에 실패했어요. 다시 시도해주세요.");
      setAddingCert(false);
    }
  }

  async function handleUpdateCertificate(id: number, req: Parameters<typeof updateCertificate>[1]) {
    setCertError(null);
    try {
      const updated = await updateCertificate(id, req);
      setCertificates((prev) => (prev ?? []).map((c) => c.id === id ? updated : c));
      setEditingCertId(null);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "수정에 실패했어요. 다시 시도해주세요.");
      setEditingCertId(null);
    }
  }

  async function handleDeleteCertificate(id: number) {
    setCertError(null);
    try {
      await deleteCertificate(id);
      setCertificates((prev) => (prev ?? []).filter((c) => c.id !== id));
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  /* Experience handlers */

  async function handleAddExperience(req: Parameters<typeof createExperience>[0]) {
    setExpError(null);
    try {
      const created = await createExperience(req);
      setExperiences((prev) => [...(prev ?? []), created]);
      setAddingExp(false);
    } catch (err) {
      setExpError(err instanceof Error ? err.message : "추가에 실패했어요. 다시 시도해주세요.");
      setAddingExp(false);
    }
  }

  async function handleUpdateExperience(id: number, req: Parameters<typeof updateExperience>[1]) {
    setExpError(null);
    try {
      const updated = await updateExperience(id, req);
      setExperiences((prev) => (prev ?? []).map((x) => x.id === id ? updated : x));
      setEditingExpId(null);
    } catch (err) {
      setExpError(err instanceof Error ? err.message : "수정에 실패했어요. 다시 시도해주세요.");
      setEditingExpId(null);
    }
  }

  async function handleDeleteExperience(id: number) {
    setExpError(null);
    try {
      await deleteExperience(id);
      setExperiences((prev) => (prev ?? []).filter((x) => x.id !== id));
    } catch (err) {
      setExpError(err instanceof Error ? err.message : "삭제에 실패했어요. 다시 시도해주세요.");
    }
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
          <label className="lbl" htmlFor="basic-birth">생년월일</label>
          <input
            id="basic-birth"
            type="date"
            className="input"
            value={basicBirthDate}
            onChange={(e) => setBasicBirthDate(e.target.value)}
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
      <div data-section="education" data-testid="section-education">
        <ProfileSubHead
          idx={2}
          title="학력"
          sub="최신순으로 정렬돼요"
          action={<AddButton onClick={() => { setAddingEdu(true); setEditingEduId(null); }} />}
        />
        {eduError && (
          <div role="alert" style={{
            padding: "8px 12px", marginBottom: 8,
            background: "var(--color-semantic-error-bg)",
            color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{eduError}</div>
        )}
        <div className="list">
          {educations !== null && educations.length === 0 && !addingEdu && (
            <EmptyRow message="아직 등록된 학력이 없어요." />
          )}
          {(educations ?? []).map((edu, i) => (
            <div key={edu.id}>
              <ListRow
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
                    {edu.gpa != null ? ` · ${edu.gpa}/${edu.gpaMax ?? "?"}` : ""}
                  </>
                }
                onEdit={() => { setEditingEduId(edu.id); setAddingEdu(false); }}
                onDelete={() => void handleDeleteEducation(edu.id)}
              />
              {editingEduId === edu.id && (
                <EducationForm
                  initial={{
                    level: edu.level,
                    school: edu.school,
                    major: edu.major,
                    status: edu.status,
                    startDate: edu.startDate,
                    endDate: edu.endDate,
                    gpa: edu.gpa,
                    gpaMax: edu.gpaMax,
                  }}
                  onSubmit={(req) => handleUpdateEducation(edu.id, req)}
                  onCancel={() => setEditingEduId(null)}
                />
              )}
            </div>
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
          action={<AddButton onClick={() => { setAddingCert(true); setEditingCertId(null); }} />}
        />
        {certError && (
          <div role="alert" style={{
            padding: "8px 12px", marginBottom: 8,
            background: "var(--color-semantic-error-bg)",
            color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{certError}</div>
        )}
        <div className="list">
          {certificates !== null && certificates.length === 0 && !addingCert && (
            <EmptyRow message="아직 등록된 자격증이 없어요." />
          )}
          {(certificates ?? []).map((cert, i) => (
            <div key={cert.id}>
              <ListRow
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
                onEdit={() => { setEditingCertId(cert.id); setAddingCert(false); }}
                onDelete={() => void handleDeleteCertificate(cert.id)}
              />
              {editingCertId === cert.id && (
                <CertificateForm
                  initial={{
                    name: cert.name,
                    issuer: cert.issuer,
                    acquiredAt: cert.acquiredAt,
                    score: cert.score,
                  }}
                  onSubmit={(req) => handleUpdateCertificate(cert.id, req)}
                  onCancel={() => setEditingCertId(null)}
                />
              )}
            </div>
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
          action={<AddButton onClick={() => { setAddingExp(true); setEditingExpId(null); }} />}
        />
        {expError && (
          <div role="alert" style={{
            padding: "8px 12px", marginBottom: 8,
            background: "var(--color-semantic-error-bg)",
            color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{expError}</div>
        )}
        <div className="list">
          {experiences !== null && experiences.length === 0 && !addingExp && (
            <EmptyRow message="아직 등록된 경험이 없어요." />
          )}
          {(experiences ?? []).map((exp, i) => (
            <div key={exp.id}>
              <ListRow
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
                onEdit={() => { setEditingExpId(exp.id); setAddingExp(false); }}
                onDelete={() => void handleDeleteExperience(exp.id)}
              />
              {editingExpId === exp.id && (
                <ExperienceForm
                  initial={{
                    type: exp.type,
                    name: exp.name,
                    organization: exp.organization,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    role: exp.role,
                    summary: exp.summary,
                  }}
                  onSubmit={(req) => handleUpdateExperience(exp.id, req)}
                  onCancel={() => setEditingExpId(null)}
                />
              )}
            </div>
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
