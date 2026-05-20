/* =========================================================
   이취 2chi · Dashboard Home
   - Tokens: /tokens.css
   - Base components: /doc.css
   - Page layout/components: ./dashboard.css
   ========================================================= */

const { useState } = React;

/* ---------- Inline icons (Lucide-style, 1.8 stroke) ---------- */
const Ico = {
  Bell: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
    </svg>
  ),
  FileEdit: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10.5 17.5l-2 .5.5-2 5-5 1.5 1.5z"/>
    </svg>
  ),
  Layers: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>
    </svg>
  ),
  Briefcase: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Target: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="8" x2="11" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="11" y2="16"/><line x1="13" y1="16" x2="15" y2="16"/>
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

/* ---------- Top nav ---------- */
function TopNav() {
  const menus = [
    { id: "home", label: "대시보드", active: true },
    { id: "me",   label: "내 정보" },
    { id: "apps", label: "지원 현황" },
    { id: "job",  label: "이직 / 취업" },
    { id: "co",   label: "기업" },
  ];
  return (
    <header className="dash-nav">
      <div className="dash-nav-inner">
        <a className="dash-brand" href="#" aria-label="이취 (2chi)">
          <img src="../assets/logo.svg" alt="이취"/>
        </a>
        <nav className="dash-menus">
          {menus.map(m => (
            <a key={m.id} href="#" className={m.active ? "active" : ""}>{m.label}</a>
          ))}
        </nav>
        <div className="dash-nav-right">
          <button className="nav-icon-btn" aria-label="검색">
            <Ico.Search size={18}/>
          </button>
          <button className="nav-icon-btn" aria-label="알림 3개">
            <Ico.Bell size={18}/>
            <span className="dot">3</span>
          </button>
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

/* ---------- Greeting ---------- */
function Greeting() {
  return (
    <section className="greet">
      <div className="greet-text">
        <div className="greet-meta">2026 · 05 · 12 수요일 · 오늘의 준비 현황</div>
        <h1>
          안녕하세요, 소미님<span className="wave" role="img" aria-label="hi">👋</span>
        </h1>
        <p className="line2">
          오늘도 이취가 다가오는 일정과 작성 흐름을 같이 정리해드릴게요.
          내 이력과 지원 현황을 기준으로, 이번 주에 챙기면 좋을 준비를 모아뒀어요.
        </p>
        <div className="greet-tags">
          <span className="greet-tag"><span className="swatch"/>백엔드</span>
          <span className="greet-tag mint"><span className="swatch"/>중고신입 (2년차)</span>
          <span className="greet-tag lav"><span className="swatch"/>이직 준비 중</span>
        </div>
      </div>
      <aside className="greet-aside" aria-hidden="true">
        <span className="mascot-cloud" aria-hidden="true"></span>
        <div className="copy">
          <small>오늘의 한 줄</small>
          이번 주는 1차 면접 두 곳,<br/>차근히 준비해봐요.
        </div>
      </aside>
    </section>
  );
}

/* ---------- KPI cards ---------- */
function KpiCompleteness() {
  return (
    <article className="kpi tone-mint">
      <div className="kpi-head">
        <span className="lbl">내 작성 이력 완성도</span>
        <span className="ico"><Ico.Layers/></span>
      </div>
      <div className="kpi-value">
        <span className="num">72</span>
        <span className="unit">%</span>
      </div>
      <div className="kpi-foot">
        <div className="bar-row mint">
          <span className="nm">이력서</span>
          <span className="track"><span style={{width: "90%"}}/></span>
          <span className="pct">90</span>
        </div>
        <div className="bar-row">
          <span className="nm">경력 기술</span>
          <span className="track"><span style={{width: "70%"}}/></span>
          <span className="pct">70</span>
        </div>
        <div className="bar-row peach">
          <span className="nm">포트폴리오</span>
          <span className="track"><span style={{width: "55%"}}/></span>
          <span className="pct">55</span>
        </div>
      </div>
    </article>
  );
}

function KpiCoverLetters() {
  return (
    <article className="kpi">
      <div className="kpi-head">
        <span className="lbl">자소서 작성 수</span>
        <span className="ico"><Ico.FileEdit/></span>
      </div>
      <div className="kpi-value">
        <span className="num">14</span>
        <span className="unit">건</span>
      </div>
      <div className="kpi-foot">
        <div className="mini-stats">
          <div className="mini">
            <span className="k">이번 달</span>
            <span className="v">5<em>건</em></span>
          </div>
          <div className="mini">
            <span className="k">마스터</span>
            <span className="v">6<em>개</em></span>
          </div>
          <div className="mini">
            <span className="k">변형본</span>
            <span className="v">14<em>개</em></span>
          </div>
        </div>
      </div>
    </article>
  );
}

function KpiInProgress() {
  return (
    <article className="kpi tone-lav">
      <span className="kpi-ring" aria-hidden="true"/>
      <div className="kpi-head">
        <span className="lbl">진행 중인 지원</span>
        <span className="ico"><Ico.Briefcase/></span>
      </div>
      <div className="kpi-value">
        <span className="num">7</span>
        <span className="unit">건</span>
      </div>
      <div className="kpi-foot">
        <div className="stage-row">
          <span className="stage doc dot">서류 <span className="n">3</span></span>
          <span className="stage code dot">코테 <span className="n">1</span></span>
          <span className="stage int1 dot">1차면접 <span className="n">2</span></span>
          <span className="stage int2 dot">2차면접 <span className="n">1</span></span>
        </div>
      </div>
    </article>
  );
}

/* ---------- Upcoming schedule ---------- */
const SCHEDULE = [
  { stage: "1차면접",    stageCls: "int1", company: "(주)테크컴퍼니", role: "백엔드 (경력 2~5년)",  m: "MAY", d: "10", wd: "MON", time: "14:00", dday: "D-2",  soon: true },
  { stage: "코딩테스트", stageCls: "code", company: "네이버",         role: "백엔드 신입 / 주니어", m: "MAY", d: "11", wd: "TUE", time: "10:00", dday: "D-3" },
  { stage: "서류마감",   stageCls: "doc",  company: "카카오",         role: "백엔드 (Saas 팀)",     m: "MAY", d: "12", wd: "WED", time: "23:59", dday: "오늘" },
  { stage: "임원면접",   stageCls: "exec", company: "토스",           role: "Server Engineer",      m: "MAY", d: "14", wd: "FRI", time: "16:00", dday: "D-6" },
];

function UpcomingPanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="title">
          <span className="ico"><Ico.Calendar size={16}/></span>
          다가오는 일정
        </div>
        <a className="more" href="#">캘린더 보기 <Ico.ArrowRight/></a>
      </div>
      <div className="sched-list">
        {SCHEDULE.map((s, i) => (
          <div key={i} className={"sched-row" + (s.soon ? " soon" : "")}>
            <div className="sched-date">
              <span className="m">{s.m}</span>
              <span className="d">{s.d}</span>
              <span className="wd">{s.wd}</span>
            </div>
            <div className="sched-info">
              <div className="co">{s.company}</div>
              <div className="meta">
                <span className={"stage " + s.stageCls}>{s.stage}</span>
                <span className="dot"/>
                <span>{s.role}</span>
              </div>
            </div>
            <div className="sched-time">{s.time}</div>
            <div className="sched-dday">{s.dday}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Matching analysis ---------- */
const GAPS = [
  { nm: "Kafka / MSA 운영 경험",         sub: "결제·정산 도메인 공고에서 자주 언급",   hit: "5건" },
  { nm: "대용량 트래픽 처리 (TPS 5K+)",  sub: "관련 프로젝트 정량 결과 보완 추천",      hit: "4건" },
  { nm: "관측성(Observability) 도구",    sub: "Datadog · Grafana · OpenTelemetry",      hit: "3건" },
];

function MatchingPanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="title">
          <span className="ico" style={{background: "var(--color-lavender-50)", color: "var(--color-lavender-600)"}}>
            <Ico.Target size={16}/>
          </span>
          매칭 분석
        </div>
        <a className="more" href="#">자세히 보기 <Ico.ArrowRight/></a>
      </div>

      <div className="match">
        <div className="match-top">
          <div className="match-ring" style={{"--p": 68}}>
            <span>
              <span className="v">68%</span>
              <span className="lbl">매칭률</span>
            </span>
          </div>
          <div className="meta">
            <span className="k">희망 포지션 · 백엔드</span>
            <span className="t">JD 평균 매칭률</span>
            <span className="sub">최근 등록한 채용공고 8건을 기준으로,<br/>이력과 키워드 매칭을 비교했어요.</span>
          </div>
        </div>

        <div className="gap-title">
          <span className="badge lav">부족 역량 TOP 3</span>
        </div>
        <div className="gap-list">
          {GAPS.map((g, i) => (
            <div key={i} className="gap-item">
              <span className="rank">{i + 1}</span>
              <div>
                <span className="nm">{g.nm}</span>
                <span className="sub">{g.sub}</span>
              </div>
              <span className="hit">+{g.hit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Shortcuts ---------- */
function Shortcuts() {
  return (
    <section className="shortcuts">
      <div className="lead">
        <span className="k">SHORTCUTS</span>
        <span className="t">다음 한 걸음, 어디부터 할까요?</span>
      </div>
      <div className="shortcuts-grid">
        <a className="shortcut primary" href="#">
          <span className="ico"><Ico.Sparkle size={16}/></span>
          <div className="body">
            <span className="nm">자소서 작성</span>
            <span className="sub">AI 초안 → 수정본 흐름</span>
          </div>
        </a>
        <a className="shortcut tone-1" href="#">
          <span className="ico"><Ico.Plus size={16}/></span>
          <div className="body">
            <span className="nm">채용공고 등록</span>
            <span className="sub">URL 붙여넣기 · 직접 작성</span>
          </div>
        </a>
        <a className="shortcut tone-2" href="#">
          <span className="ico"><Ico.Building/></span>
          <div className="body">
            <span className="nm">기업분석 시작</span>
            <span className="sub">컬처 · 도메인 · 기술 스택</span>
          </div>
        </a>
        <a className="shortcut tone-3" href="#">
          <span className="ico"><Ico.Calendar/></span>
          <div className="body">
            <span className="nm">캘린더 보기</span>
            <span className="sub">월·주·일 전형 일정</span>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
function Dashboard() {
  return (
    <>
      <TopNav/>
      <main className="dash-main">
        <Greeting/>
        <div className="kpi-grid">
          <KpiCompleteness/>
          <KpiCoverLetters/>
          <KpiInProgress/>
        </div>
        <div className="dual-grid">
          <UpcomingPanel/>
          <MatchingPanel/>
        </div>
        <Shortcuts/>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Dashboard/>);
