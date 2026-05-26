import { ProfileSnapshot } from "@/lib/mock/me";
import { ReactNode } from "react";

type Props = { data: ProfileSnapshot };

/* ---------- Internal helpers (from mock lines 98-112 and 217-237) ---------- */

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
}: {
  tone?: string;
  icon: ReactNode;
  nm: string;
  meta: string;
}) {
  return (
    <div className={"list-row " + tone}>
      <span className="badge-ico">{icon}</span>
      <div className="body">
        <div className="nm">{nm}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="actions">
        <button className="iconbtn" aria-label="편집">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="iconbtn" aria-label="삭제">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

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

const IcoFile = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

/* ---------- ProfileView (from mock lines 113-216) ---------- */

export function ProfileView({ data }: Props) {
  return (
    <section className="me-section">
      {/* 01 기본정보 */}
      <ProfileSubHead idx={1} title="기본정보" sub="자소서 헤더 · 추천 공고 매칭에 사용" />
      <div className="form-grid">
        <div className="fld">
          <label className="lbl">이름 <span className="req">*</span></label>
          <div className="input">{data.basic.name}</div>
        </div>
        <div className="fld">
          <label className="lbl">연락처</label>
          <div className="input">{data.basic.phone}</div>
        </div>
        <div className="fld">
          <label className="lbl">이메일</label>
          <div className="input">{data.basic.email}</div>
        </div>
        <div className="fld">
          <label className="lbl">희망 포지션</label>
          <div className="input">{data.basic.position}</div>
        </div>
        <div className="fld">
          <label className="lbl">경력 구분</label>
          <div className="input">{data.basic.experienceYears}</div>
        </div>
      </div>

      <div className="sub-divider" />

      {/* 02 학력 */}
      <ProfileSubHead
        idx={2}
        title="학력"
        sub="최신순으로 정렬돼요"
        action={
          <button className="btn-text">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>{" "}
            추가
          </button>
        }
      />
      <div className="list">
        {data.educations.map((edu, i) => (
          <ListRow
            key={i}
            tone={i === 0 ? "mint" : ""}
            icon={IcoGradCap}
            nm={`${edu.school} · ${edu.major}`}
            meta={`${edu.period} · ${edu.status}`}
          />
        ))}
      </div>

      <div className="sub-divider" />

      {/* 03 자격증 */}
      <ProfileSubHead
        idx={3}
        title="자격증"
        sub="희망 포지션 표준 역량 매트릭스와 비교돼요"
        action={
          <button className="btn-text">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>{" "}
            추가
          </button>
        }
      />
      <div className="list">
        {data.certs.map((cert, i) => (
          <ListRow
            key={i}
            tone={i === 0 ? "lav" : ""}
            icon={IcoAward}
            nm={cert.name}
            meta={`${cert.issuer} · ${cert.date}`}
          />
        ))}
      </div>

      <div className="sub-divider" />

      {/* 04 경험 · 대외활동 */}
      <ProfileSubHead
        idx={4}
        title="경험 · 대외활동"
        sub="인턴, 동아리, 공모전, 봉사, 사이드 프로젝트 모두 OK"
        action={
          <button className="btn-text">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>{" "}
            추가
          </button>
        }
      />
      <div className="list">
        {data.experiences.map((exp, i) => (
          <ListRow
            key={i}
            tone={i === 0 ? "peach" : ""}
            icon={IcoStar}
            nm={`${exp.title} · ${exp.org}`}
            meta={`${exp.period} · ${exp.description}`}
          />
        ))}
      </div>

      <div className="sub-divider" />

      {/* 05 이력서 */}
      <ProfileSubHead
        idx={5}
        title="이력서"
        sub="PDF 또는 링크로 등록해두면 지원 시 자동으로 첨부돼요"
        action={
          <button className="btn-text">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>{" "}
            업로드
          </button>
        }
      />
      {data.resume ? (
        <div className="list">
          <ListRow
            tone="mint"
            icon={IcoFile}
            nm={data.resume.filename}
            meta={`업데이트 ${data.resume.updatedAt}`}
          />
        </div>
      ) : (
        <div className="list-row">
          <span className="badge-ico">{IcoFile}</span>
          <div className="body">
            <div className="nm">아직 이력서가 없어요</div>
            <div className="meta">PDF 파일을 업로드하거나 링크를 등록해보세요.</div>
          </div>
        </div>
      )}
    </section>
  );
}
