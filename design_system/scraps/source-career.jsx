/* =========================================================
   이취 2chi · 내 정보 → 경력 / 프로젝트 (PRAR)
   - Tokens: /tokens.css
   - Base components: /doc.css
   - Top nav styles reused from /pages/dashboard.css
   - Page layout/components: ./career.css
   ========================================================= */

const { useState } = React;

/* ---------- Inline icons (Lucide-style, 1.8 stroke) ---------- */
const Ico = {
  Bell: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Pencil: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Briefcase: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="8" x2="11" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="11" y2="16"/>
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/>
    </svg>
  ),
  Layers: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>
    </svg>
  ),
};

/* ---------- Top nav (matches dashboard pattern, 내 정보 active) ---------- */
function TopNav() {
  const menus = [
    { id: "home", label: "대시보드" },
    { id: "me",   label: "내 정보", active: true },
    { id: "apps", label: "지원 현황" },
    { id: "job",  label: "이직 / 취업" },
    { id: "co",   label: "기업" },
  ];
  return (
    <header className="dash-nav">
      <div className="dash-nav-inner">
        <a className="dash-brand" href="../index.html" aria-label="이취 (2chi)">
          <img src="../assets/logo.svg" alt="이취"/>
        </a>
        <nav className="dash-menus">
          {menus.map(m => (
            <a key={m.id} href="#" className={m.active ? "active" : ""}>{m.label}</a>
          ))}
        </nav>
        <div className="dash-nav-right">
          <button className="nav-icon-btn" aria-label="검색"><Ico.Search size={18}/></button>
          <button className="nav-icon-btn" aria-label="알림"><Ico.Bell size={18}/></button>
          <div className="nav-profile" role="button" tabIndex={0}>
            <span className="avatar">소</span>
            <span className="nm">김소미</span>
            <span className="caret"><Ico.ChevronDown size={14}/></span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Left sidebar — 내 정보 sections ---------- */
function SideNav() {
  return (
    <aside className="me-side" aria-label="내 정보 메뉴">
      <div className="crumb">내 정보</div>

      <div className="sec"><span className="n">01</span>기본 정보</div>
      <a className="nav-item" href="#"><span className="dot"/>기초 정보</a>
      <a className="nav-item" href="#"><span className="dot"/>학력</a>
      <a className="nav-item" href="#"><span className="dot"/>자격증</a>
      <a className="nav-item" href="#"><span className="dot"/>경험 / 대외활동</a>

      <div className="sec"><span className="n">02</span>경력 / 이력</div>
      <a className="nav-item" href="#"><span className="dot"/>이력서</a>
      <a className="nav-item active" href="#" aria-current="page">
        <span className="dot"/>경력기술
        <span className="pill">PRAR</span>
      </a>

      <div className="sec"><span className="n">03</span>기타</div>
      <a className="nav-item" href="#"><span className="dot"/>포트폴리오 링크</a>
    </aside>
  );
}

/* ---------- Page header ---------- */
function PageHeader() {
  return (
    <section className="pg-head">
      <div className="lead">
        <div className="eyebrow">ME · CAREER · PROJECTS</div>
        <h1>경력기술</h1>
        <p className="sub">
          프로젝트 경험을 한 번 구조화해두면,<br/>
          자소서·면접 답변·기업별 매칭 분석에 그대로 다시 쓸 수 있어요.
        </p>
      </div>
      <div className="head-actions">
        <button className="btn-secondary" type="button">
          <Ico.Layers size={14}/> 미리보기
        </button>
        <button className="btn-primary" type="button">
          <Ico.Plus size={14}/> 회사 추가
        </button>
      </div>
    </section>
  );
}

/* ---------- Context strip (role + structure + completeness) ---------- */
function CtxStrip() {
  return (
    <section className="ctx-strip">
      <div className="ctx-item">
        <span className="k">현재 직군</span>
        <span className="v"><span className="sw"/>백엔드 (Backend)</span>
      </div>
      <div className="ctx-item">
        <span className="k">입력 구조</span>
        <span className="v"><span className="sw lav"/>PRAR · 4단</span>
      </div>
      <div className="ctx-item">
        <span className="k">완성도</span>
        <span className="v"><span className="sw mint"/>72% · 프로젝트 2건</span>
      </div>
      <a className="ctx-link" href="#">기초 정보에서 변경 <Ico.ArrowRight/></a>
    </section>
  );
}

/* ---------- Coach helper ---------- */
function Coach() {
  return (
    <section className="coach">
      <span className="coach-mascot mascot-cloud sm" aria-hidden="true">
        <span className="blush"/>
      </span>
      <div className="coach-body">
        <div className="ttl">문제 · 원인 · 접근 · 결과,&nbsp;네 칸으로 나눠서 적으면 충분해요.</div>
        <div className="msg">
          백엔드 직군에서는 <b>PRAR</b> 구조가 자소서·기술 면접 답변과 가장 잘 맞아요.
          정량 결과가 함께 적혀 있으면 채용공고 매칭률 분석에도 더 잘 활용됩니다.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRAR cell
============================================================ */
function PrarCell({ tone, glyph, ko, en, value, max = 240, placeholder }) {
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
      <textarea
        className="ta"
        defaultValue={value}
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );
}

/* ============================================================
   Metric chip
============================================================ */
function MetricChip({ k, before, after, delta, dir }) {
  if (delta) {
    return (
      <span className="metric-chip">
        <span className="k">{k}</span>
        <span className="v">
          <span className={dir === "down" ? "down" : "up"}>{delta}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="metric-chip">
      <span className="k">{k}</span>
      <span className="v">
        {before} <span className="arrow">→</span> {after}
      </span>
    </span>
  );
}

/* ============================================================
   Project — expanded with PRAR
============================================================ */
function ProjectExpanded({ data, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className={"pj-card " + (open ? "open" : "")}>
      <div className="pj-head" onClick={() => setOpen(o => !o)} role="button" tabIndex={0}>
        <span className="chev"><Ico.ChevronRight size={14}/></span>
        <div className="pj-title-block">
          <div className="pj-title">
            <span>{data.name}</span>
            <span className="tag-row">
              {data.tags.map((t, i) => (
                <span key={i} className={"tech-tag " + (t.tone || "")}>{t.label}</span>
              ))}
            </span>
          </div>
          <div className="pj-meta">
            <span className="dur">{data.period}</span>
            <span className="sep"/>
            <span className="contrib">본인 기여도 <span className="num">{data.contribution}%</span></span>
            {data.role && <><span className="sep"/><span>{data.role}</span></>}
          </div>
        </div>
        <div className="pj-mini-actions" onClick={e => e.stopPropagation()}>
          <span className="pill">PRAR 4/4</span>
          <button className="iconbtn" type="button" aria-label="편집">
            <Ico.Pencil/>편집
          </button>
        </div>
      </div>

      {open && (
        <div className="pj-body">
          <div className="prar-grid">
            <PrarCell
              tone="p"
              glyph="P"
              ko="문제"
              en="PROBLEM"
              max={240}
              value="월말 정산 시 TPS 500 한계 도달, 처리 지연이 10분 이상 발생했습니다. 운영팀 야간 대응이 늘었고, 정산 마감일이 매번 미뤄지는 상황이었어요."
              placeholder="해결해야 했던 문제 상황을 적어주세요"
            />
            <PrarCell
              tone="r1"
              glyph="R"
              ko="원인"
              en="ROOT CAUSE"
              max={240}
              value="N+1 쿼리 + 인덱스 부재 + 단일 DB 직접 접근으로 인한 병목. 정산 배치가 트래픽 피크 시간대와 겹치면서 락 경합까지 발생했습니다."
              placeholder="문제의 근본 원인을 분석해 적어주세요"
            />
            <PrarCell
              tone="a"
              glyph="A"
              ko="접근"
              en="APPROACH"
              max={240}
              value="JPA 패치 전략을 fetch join 으로 전환하고 복합 인덱스를 추가했어요. 정산 트랜잭션을 분리해 Kafka 기반 비동기 처리로 옮겼습니다."
              placeholder="어떤 방식으로 해결했는지 적어주세요"
            />
            <PrarCell
              tone="r2"
              glyph="R"
              ko="결과"
              en="RESULT"
              max={240}
              value="TPS 500 → 2,000, 처리 지연 10분 → 30초로 단축. 무중단 전환에 성공했고, 야간 운영 대기조 1명을 줄일 수 있었어요."
              placeholder="달성한 결과를 정량/정성으로 적어주세요"
            />
          </div>

          <div className="metrics">
            <div className="metrics-head">
              <span className="lbl">
                <span className="glyph">#</span>
                정량 성과
              </span>
              <span className="hint">숫자 변화·금액·사용자 수처럼 비교 가능한 값을 권장합니다</span>
            </div>
            <div className="metric-row">
              <MetricChip k="TPS" before="500" after="2,000"/>
              <MetricChip k="처리 지연" before="10분" after="30초"/>
              <MetricChip k="월간 운영비" delta="-₩2,000,000" dir="down"/>
              <MetricChip k="장애 알림" delta="-78%" dir="down"/>
              <span className="metric-chip add" role="button" tabIndex={0}>
                <span className="k"><Ico.Plus size={12}/> 성과 지표 추가</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ============================================================
   Project — collapsed
============================================================ */
function ProjectCollapsed({ data }) {
  return (
    <article className="pj-card">
      <div className="pj-head" role="button" tabIndex={0}>
        <span className="chev"><Ico.ChevronRight size={14}/></span>
        <div className="pj-title-block">
          <div className="pj-title">
            <span>{data.name}</span>
            <span className="tag-row">
              {data.tags.map((t, i) => (
                <span key={i} className={"tech-tag " + (t.tone || "")}>{t.label}</span>
              ))}
            </span>
          </div>
          <div className="pj-meta">
            <span className="dur">{data.period}</span>
            <span className="sep"/>
            <span className="contrib">본인 기여도 <span className="num">{data.contribution}%</span></span>
          </div>
        </div>
        <div className="pj-mini-actions" onClick={e => e.stopPropagation()}>
          <span className="pill" style={{ background: "var(--color-yellow-50)", color: "var(--color-yellow-400)", borderColor: "var(--color-yellow-200)" }}>
            PRAR 2/4
          </span>
          <button className="iconbtn" type="button">
            <Ico.Pencil/>이어 쓰기
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   Company card — current (expanded)
============================================================ */
function CurrentCompany() {
  return (
    <article className="co-card">
      <header className="co-head">
        <span className="co-mark">현</span>
        <div className="co-info">
          <div className="nm">
            (주)현재회사
            <span className="pill">재직 중</span>
          </div>
          <div className="meta">
            <span className="role">백엔드 개발자</span>
            <span className="sep"/>
            <span className="dur">2024.04 ~ 재직 중</span>
            <span className="sep"/>
            <span>약 2년 1개월</span>
            <span className="sep"/>
            <span>프로젝트 2건</span>
          </div>
        </div>
        <div className="co-actions">
          <button className="iconbtn" type="button"><Ico.Pencil/>편집</button>
          <button className="iconbtn danger" type="button"><Ico.Trash/>삭제</button>
        </div>
      </header>

      <div className="co-body">
        <div className="sub-head">
          <span className="lbl">
            <Ico.Briefcase size={14}/>
            프로젝트
            <span className="num">2</span>
          </span>
        </div>

        <ProjectExpanded
          defaultOpen={true}
          data={{
            name: "주문 정산 시스템 성능 개선",
            period: "2025.02 ~ 2025.06",
            contribution: 70,
            role: "백엔드 리드",
            tags: [
              { label: "Spring Boot" },
              { label: "PostgreSQL", tone: "mint" },
              { label: "Kafka", tone: "lav" },
            ],
          }}
        />

        <ProjectCollapsed
          data={{
            name: "유저 인증 모듈 리팩토링",
            period: "2024.09 ~ 2024.12",
            contribution: 100,
            tags: [
              { label: "Spring Security" },
              { label: "JWT", tone: "peach" },
            ],
          }}
        />

        <button className="add-proj" type="button">
          <Ico.Plus size={14}/>
          이 회사에 프로젝트 추가
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   Company card — previous (collapsed)
============================================================ */
function PreviousCompany() {
  return (
    <article className="co-card collapsed">
      <header className="co-head">
        <span className="co-mark lav">전</span>
        <div className="co-info">
          <div className="nm">
            (주)이전회사
            <span className="pill past">퇴사 · 2024.03</span>
          </div>
          <div className="meta">
            <span className="role">백엔드 개발자</span>
            <span className="sep"/>
            <span className="dur">2023.07 ~ 2024.03</span>
            <span className="sep"/>
            <span>근무 8개월</span>
            <span className="sep"/>
            <span>프로젝트 1건</span>
          </div>
        </div>
        <div className="co-actions">
          <button className="iconbtn" type="button"><Ico.ChevronDown size={14}/>펼치기</button>
          <button className="iconbtn" type="button"><Ico.Pencil/>편집</button>
        </div>
      </header>
    </article>
  );
}

/* ---------- Page-level add company strap ---------- */
function PageFoot() {
  return (
    <section className="page-foot">
      <div className="lead">
        <div className="ttl">또 다른 회사 경력이 있나요?</div>
        <div className="sub">신입이라면 인턴·동아리·사이드 프로젝트도 “회사”로 추가해 정리할 수 있어요.</div>
      </div>
      <div className="actions">
        <button className="btn-secondary" type="button">
          <Ico.Sparkle size={14}/> 이력서에서 가져오기
        </button>
        <button className="btn-primary" type="button">
          <Ico.Plus size={14}/> 회사 추가
        </button>
      </div>
    </section>
  );
}

/* ---------- Assistant note (coach summary at bottom) ---------- */
function AssistantNote() {
  return (
    <section className="assistant-note">
      <span className="a-avatar mascot-cloud sm" aria-hidden="true">
        <span className="blush"/>
      </span>
      <div className="a-body">
        <div className="ttl">
          <span className="who">이취가 한 번 훑어봤어요</span>
          <span className="stamp">방금 · 자동 분석</span>
        </div>
        <div className="msg">
          <b>주문 정산 시스템 성능 개선</b> 프로젝트는 정량 성과까지 잘 정리돼 있어요. 다만
          {" "}<span className="miss">유저 인증 모듈 리팩토링</span>은 결과 수치가 비어 있어요.
          채용공고 매칭률을 높이려면 <b>처리 시간·요청 수·오류 감소율</b>처럼 비교 가능한 숫자를 한두 개 더해보세요.
        </div>
        <div className="a-actions">
          <a className="a-link" href="#">
            <Ico.Sparkle size={12}/> 정량 수치 보완 가이드 열기
          </a>
          <a className="a-link ghost" href="#">자소서 마스터에 반영하기</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
function CareerPage() {
  return (
    <>
      <TopNav/>
      <div className="me-shell">
        <SideNav/>
        <main className="me-main">
          <PageHeader/>
          <CtxStrip/>
          <Coach/>
          <CurrentCompany/>
          <PreviousCompany/>
          <PageFoot/>
          <AssistantNote/>
        </main>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CareerPage/>);
