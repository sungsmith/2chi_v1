/* =========================================================
   2chi · Web UI Kit — 내 정보 (Me) cluster
   - 2 sections in sidebar:
       01 내 정보  — single page with all subsections stacked
       02 경력기술 — PRAR-driven career history
       03 포트폴리오 — link + file upload combined
========================================================= */

const ME_NAV = [
  { id: "profile",    label: "내 정보" },
  { id: "career",     label: "경력기술", pill: "PRAR", pillTitle: "입력 구조: Problem · Root cause · Approach · Result" },
  { id: "portfolio",  label: "포트폴리오" },
];

const ME_TITLES = {
  profile:   { eyebrow: "ME · PROFILE",       title: "내 정보",        sub: "자소서·이력서 헤더와 채용공고 매칭에 쓰이는 정보예요. 한 번 정리해두면 모든 화면이 자동으로 채워집니다." },
  career:    { eyebrow: "ME · CAREER · PROJECTS", title: "경력기술",   sub: "프로젝트 경험을 한 번 구조화해두면, 자소서·면접 답변·기업별 매칭 분석에 그대로 다시 쓸 수 있어요." },
  portfolio: { eyebrow: "ME · PORTFOLIO",     title: "포트폴리오",     sub: "외부 링크 또는 파일을 한곳에 모아두는 곳이에요. 자소서 헤더에 같이 보내져요." },
};

/* ---------- Sidebar ---------- */
function MeSideNav({ active, onSelect }) {
  return (
    <aside className="side-nav">
      <div className="crumb">내 정보</div>
      {ME_NAV.map(it => (
        <button
          key={it.id}
          type="button"
          className={"nav-item" + (active === it.id ? " active" : "")}
          onClick={() => onSelect(it.id)}
        >
          <span>{it.label}</span>
          {it.pill && <span className="pill" title={it.pillTitle}>{it.pill}</span>}
        </button>
      ))}
    </aside>
  );
}

/* ---------- Header ---------- */
function MePageHeader({ active }) {
  const t = ME_TITLES[active];
  return (
    <section className="pg-head">
      <div className="lead">
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="sub">{t.sub}</p>
      </div>
      <div className="head-actions">
        {active === "career" ? (
          <>
            <button className="btn secondary sm"><Ico.Layers size={13}/> 미리보기</button>
            <button className="btn primary sm"><Ico.Plus size={13}/> 회사 추가</button>
          </>
        ) : (
          <button className="btn primary sm"><Ico.Save size={13}/> 저장</button>
        )}
      </div>
    </section>
  );
}

/* ---------- Context strip + Coach (career only) ---------- */
function CareerMeta() {
  // Inline meta — no boxed card. Just text under the page subtitle.
  return (
    <div className="career-meta">
      <span className="meta-item"><span className="sw"/>백엔드</span>
      <span className="meta-sep"/>
      <span className="meta-item"><span className="sw lav"/>PRAR · 4단 구조</span>
      <span className="meta-sep"/>
      <span className="meta-item"><span className="sw mint"/>완성도 <b>72%</b> · 프로젝트 2건</span>
      <a className="meta-edit" href="#">기초 정보에서 변경 <Ico.ArrowRight size={11}/></a>
    </div>
  );
}

function CoachBanner({ onDismiss }) {
  return (
    <div className="info-banner lav" role="note">
      <span className="ico"><Ico.Sparkle size={14}/></span>
      <span className="body">
        <b>PRAR 구조로 정리하면 자소서에 그대로 다시 쓸 수 있어요.</b>
        {" "}문제 · 원인 · 접근 · 결과 네 칸으로 나눠 채워보세요.
      </span>
      <button className="x" aria-label="안내 닫기" onClick={onDismiss}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ============================================================
   PROFILE — single page combining all subsections
============================================================ */
function ProfileSubHead({ idx, title, sub, action }) {
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

function ProfileView() {
  return (
    <section className="me-section">
      {/* 01 기초 정보 */}
      <ProfileSubHead idx={1} title="기초 정보" sub="자소서 헤더 · 추천 공고 매칭에 사용"/>
      <div className="form-grid">
        <div className="fld">
          <label className="lbl">이름 <span className="req">*</span></label>
          <input className="input" defaultValue="김소미"/>
        </div>
        <div className="fld">
          <label className="lbl">생년월일 <span className="req">*</span></label>
          <div className="input-w-ico">
            <span className="ico"><Ico.Calendar size={14}/></span>
            <input className="input" defaultValue="1998.03.12"/>
          </div>
        </div>
        <div className="fld">
          <label className="lbl">연락처</label>
          <input className="input" defaultValue="010-1234-5678"/>
        </div>
        <div className="fld">
          <label className="lbl">거주 지역</label>
          <input className="input" defaultValue="서울 · 마포구"/>
        </div>
        <div className="fld full">
          <label className="lbl">한 줄 소개</label>
          <textarea defaultValue="결제 · 정산 도메인을 좋아하는 백엔드 개발자예요. 작게 쓴 코드도 운영에 안전한지 따져봐요."/>
          <span className="helper">자소서·이력서 표지에 같이 노출돼요. 40자 이내 권장.</span>
        </div>
      </div>

      <div className="sub-divider"/>

      {/* 02 학력 */}
      <ProfileSubHead
        idx={2} title="학력" sub="최신순으로 정렬돼요"
        action={<button className="btn-text"><Ico.Plus size={12}/> 추가</button>}
      />
      <div className="list">
        <ListRow
          tone="mint"
          icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/></svg>}
          nm="한국대학교 · 컴퓨터공학과"
          meta="학사 · 2017.03 — 2021.02 · 학점 3.8 / 4.5 · 졸업"
        />
        <ListRow
          icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/></svg>}
          nm="한국고등학교 · 자연계"
          meta="고졸 · 2014.03 — 2017.02"
        />
      </div>

      <div className="sub-divider"/>

      {/* 03 자격증 */}
      <ProfileSubHead
        idx={3} title="자격증" sub="희망 포지션 표준 역량 매트릭스와 비교돼요"
        action={<button className="btn-text"><Ico.Plus size={12}/> 추가</button>}
      />
      <div className="list">
        <ListRow
          tone="lav"
          icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/></svg>}
          nm="정보처리기사"
          meta="한국산업인력공단 · 2020.11 · 총점 78점"
        />
        <ListRow
          icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/></svg>}
          nm="AWS Certified Solutions Architect — Associate"
          meta="AWS · 2024.07 · 점수 815 / 1,000"
        />
      </div>

      <div className="sub-divider"/>

      {/* 04 경험 · 대외활동 */}
      <ProfileSubHead
        idx={4} title="경험 · 대외활동" sub="인턴, 동아리, 공모전, 봉사, 사이드 프로젝트 모두 OK"
        action={<button className="btn-text"><Ico.Plus size={12}/> 추가</button>}
      />
      <div className="list">
        <ListRow
          tone="peach"
          icon={<Ico.Sparkle size={16}/>}
          nm="사이드 프로젝트 · 식권 정산 API"
          meta="개인 프로젝트 · 2023.06 — 2023.12 · Spring Boot, Redis, PostgreSQL"
        />
        <ListRow
          tone="mint"
          icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L15 8.5 22 9.3 17 14.1 18.5 21 12 17.8 5.5 21 7 14.1 2 9.3 9 8.5 z"/></svg>}
          nm="2020 한국정보처리학회 공모전 · 우수상"
          meta="학회 공모전 · 2020.09 — 2020.11 · 2등 / 87팀"
        />
        <ListRow
          icon={<Ico.Code size={16}/>}
          nm="한국대학교 컴퓨터공학 학회 멤버"
          meta="동아리 · 2018.03 — 2020.12 · 스터디 운영 1년"
        />
      </div>
    </section>
  );
}

function ListRow({ tone = "", icon, nm, meta }) {
  return (
    <div className={"list-row " + tone}>
      <span className="badge-ico">{icon}</span>
      <div className="body">
        <div className="nm">{nm}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="actions">
        <button className="iconbtn" aria-label="편집"><Ico.Edit size={14}/></button>
        <button className="iconbtn" aria-label="삭제">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PORTFOLIO — links + files in one bucket
============================================================ */
function PortfolioView() {
  return (
    <section className="me-section">
      <div className="sec-head">
        <div className="sec-title">포트폴리오</div>
        <div className="head-r">
          <button className="btn secondary sm">
            <Ico.Link size={13}/> 링크 추가
          </button>
          <button className="btn secondary sm">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            파일 업로드
          </button>
        </div>
      </div>
      <div className="list">
        <div className="list-row">
          <span className="badge-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          </span>
          <div className="body">
            <div className="nm">github.com/somikim</div>
            <div className="meta">GitHub · 레포 14개 · Java · Spring · TS</div>
          </div>
          <span className="kind-pill">링크</span>
          <div className="actions">
            <button className="iconbtn"><Ico.Edit size={14}/></button>
            <button className="iconbtn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
        <div className="list-row lav">
          <span className="badge-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <div className="body">
            <div className="nm">somi.notion.site/portfolio</div>
            <div className="meta">Notion · 프로젝트 5건 · 마지막 업데이트 4일 전</div>
          </div>
          <span className="kind-pill">링크</span>
          <div className="actions">
            <button className="iconbtn"><Ico.Edit size={14}/></button>
            <button className="iconbtn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
        <div className="list-row mint">
          <span className="badge-ico"><Ico.FileEdit size={16}/></span>
          <div className="body">
            <div className="nm">2025_정산_프로젝트_정리.pdf</div>
            <div className="meta">PDF · 2.4 MB · 업로드 2026.05.10</div>
          </div>
          <span className="kind-pill file">파일</span>
          <div className="actions">
            <button className="iconbtn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="iconbtn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CAREER — restructured for clear hierarchy
   회사 (band) → 프로젝트 (row) → PRAR (expanded inline, no nested card)
============================================================ */

function PrarCell({ tone, glyph, ko, en, max, value }) {
  const len = value ? value.length : 0;
  return (
    <div className={"prar-cell " + tone}>
      <div className="cell-head">
        <span className="glyph">{glyph}</span>
        <span className="cell-title">
          <span className="ko">{ko}</span>
          <span className="en">{en}</span>
        </span>
        <span className="cell-count">{len} / {max}</span>
      </div>
      <textarea className="ta" defaultValue={value} rows={3}/>
    </div>
  );
}

function ProjectRow({ open, name, tags, period, contribution, role, prarStatus, children }) {
  return (
    <div className={"pj-row" + (open ? " open" : "")}>
      <div className="pj-row-head">
        <span className="chev"><Ico.ChevronRight size={14}/></span>
        <div className="pj-row-info">
          <div className="pj-row-title">
            <span>{name}</span>
            <span className="tag-row">
              {tags.map((t, i) => <span key={i} className={"tech-tag " + (t.tone || "")}>{t.label}</span>)}
            </span>
          </div>
          <div className="pj-row-meta">
            <span>{period}</span>
            <span className="sep"/>
            <span>기여도 <span className="num">{contribution}%</span></span>
            {role && <><span className="sep"/><span>{role}</span></>}
          </div>
        </div>
        <span className={"prar-pill " + (prarStatus.tone || "")}>{prarStatus.label}</span>
        <button className="iconbtn-sm"><Ico.Edit size={12}/>편집</button>
      </div>
      {open && <div className="pj-row-body">{children}</div>}
    </div>
  );
}

function CompanyBand({ mark, markTone = "", name, statusPill, role, period, duration, projectCount, current = false, children }) {
  return (
    <div className={"co-band" + (current ? " current" : "")}>
      <div className="co-band-head">
        <span className={"co-mark " + markTone}>{mark}</span>
        <div className="co-band-info">
          <div className="nm">
            {name}
            <span className={"pill " + (current ? "" : "past")}>{statusPill}</span>
          </div>
          <div className="meta">
            <span className="role">{role}</span>
            <span className="sep"/>
            <span>{period}</span>
            {duration && <><span className="sep"/><span>{duration}</span></>}
            {projectCount != null && <><span className="sep"/><span>프로젝트 {projectCount}건</span></>}
          </div>
        </div>
        <div className="co-band-actions">
          <button className="iconbtn-sm"><Ico.Edit size={12}/>편집</button>
        </div>
      </div>
      {children && <div className="co-band-body">{children}</div>}
    </div>
  );
}

function CareerView() {
  const [coachOpen, setCoachOpen] = useState(true);
  return (
    <>
      <CareerMeta/>
      {coachOpen && <CoachBanner onDismiss={() => setCoachOpen(false)}/>}

      <div className="work-section">
        <div className="work-section-head">
          <h2 className="work-title">회사 경력 <span className="work-count">2</span></h2>
          <div className="work-actions">
            <button className="btn ghost sm"><Ico.Sparkle size={12}/>이력서에서 가져오기</button>
            <button className="btn primary sm"><Ico.Plus size={12}/>회사 추가</button>
          </div>
        </div>

        <CompanyBand
          current
          mark="현"
          name="(주)현재회사"
          statusPill="재직 중"
          role="백엔드 개발자"
          period="2024.04 ~ 재직 중"
          duration="약 2년 1개월"
          projectCount={2}
        >
          <div className="pj-list">
            <ProjectRow
              open
              name="주문 정산 시스템 성능 개선"
              tags={[{label:"Spring Boot"},{label:"PostgreSQL",tone:"mint"},{label:"Kafka",tone:"lav"}]}
              period="2025.02 — 2025.06"
              contribution={70}
              role="백엔드 리드"
              prarStatus={{label:"PRAR 4/4",tone:""}}
            >
              <div className="prar-grid">
                <PrarCell tone="p"  glyph="P" ko="문제"    en="PROBLEM"     max={240} value="월말 정산 시 TPS 500 한계 도달, 처리 지연이 10분 이상 발생했습니다. 운영팀 야간 대응이 늘었고, 정산 마감일이 매번 미뤄지는 상황이었어요."/>
                <PrarCell tone="r1" glyph="R" ko="원인"    en="ROOT CAUSE"  max={240} value="N+1 쿼리 + 인덱스 부재 + 단일 DB 직접 접근으로 인한 병목. 정산 배치가 트래픽 피크 시간대와 겹치면서 락 경합까지 발생했습니다."/>
                <PrarCell tone="a"  glyph="A" ko="접근"    en="APPROACH"    max={240} value="JPA 패치 전략을 fetch join 으로 전환하고 복합 인덱스를 추가했어요. 정산 트랜잭션을 분리해 Kafka 기반 비동기 처리로 옮겼습니다."/>
                <PrarCell tone="r2" glyph="R" ko="결과"    en="RESULT"      max={240} value="TPS 500 → 2,000, 처리 지연 10분 → 30초로 단축. 무중단 전환에 성공했고, 야간 운영 대기조 1명을 줄일 수 있었어요."/>
              </div>
              <div className="metrics-strip">
                <span className="metric-label">정량 성과</span>
                <span className="metric-chip"><span className="k">TPS</span><span className="v">500 <span className="arrow">→</span> 2,000</span></span>
                <span className="metric-chip"><span className="k">처리 지연</span><span className="v">10분 <span className="arrow">→</span> 30초</span></span>
                <span className="metric-chip"><span className="k">월간 운영비</span><span className="v"><span className="down">-₩2,000,000</span></span></span>
                <span className="metric-chip"><span className="k">장애 알림</span><span className="v"><span className="down">-78%</span></span></span>
                <button className="metric-add"><Ico.Plus size={11}/>지표 추가</button>
              </div>
            </ProjectRow>

            <ProjectRow
              name="유저 인증 모듈 리팩토링"
              tags={[{label:"Spring Security"},{label:"JWT",tone:"peach"}]}
              period="2024.09 — 2024.12"
              contribution={100}
              prarStatus={{label:"PRAR 2/4",tone:"warn"}}
            />
          </div>
          <button className="add-proj-sm"><Ico.Plus size={12}/>프로젝트 추가</button>
        </CompanyBand>

        <CompanyBand
          mark="전"
          markTone="lav"
          name="(주)이전회사"
          statusPill="퇴사 · 2024.03"
          role="백엔드 개발자"
          period="2023.07 — 2024.03"
          duration="근무 8개월"
          projectCount={1}
        />

        <button className="add-company-row">
          <Ico.Plus size={14}/>
          회사 추가
          <span className="hint">신입이면 인턴 · 동아리 · 사이드 프로젝트도 "회사"로 추가할 수 있어요</span>
        </button>
      </div>

      <div className="info-banner lav assistant">
        <span className="mascot-cloud sm think" aria-hidden/>
        <span className="body">
          <b>이취가 한 번 훑어봤어요</b> · 주문 정산 시스템 프로젝트는 정량 성과까지 잘 정리돼 있어요.
          {" "}<span className="miss">유저 인증 모듈 리팩토링</span>은 결과 수치가 비어 있어요 — 처리 시간 · 요청 수 · 오류 감소율처럼 비교 가능한 숫자를 한두 개 더해보세요.
        </span>
        <a className="banner-action" href="#"><Ico.Sparkle size={12}/>가이드</a>
      </div>
    </>
  );
}

/* ============================================================
   ROUTER
============================================================ */
function MeScreen() {
  const [active, setActive] = useState("career");

  return (
    <div className="me-shell">
      <MeSideNav active={active} onSelect={setActive}/>
      <main className="me-main">
        <MePageHeader active={active}/>
        {active === "profile"   && <ProfileView/>}
        {active === "career"    && <CareerView/>}
        {active === "portfolio" && <PortfolioView/>}
      </main>
    </div>
  );
}

Object.assign(window, { MeScreen });
