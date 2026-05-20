/* =========================================================
   이취 2chi · 기업 · 채용공고 등록 (/company/postings/new)
   - URL 붙여넣기 활성 + 파싱 후 상태
   ========================================================= */

const { useState } = React;

/* ---------- Inline icons ---------- */
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
  Link: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/>
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 12.5 10 18 20 6"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
    </svg>
  ),
  Bullet: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Briefcase: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="8" x2="11" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="15" y2="12"/>
    </svg>
  ),
  Tag: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
};

/* ---------- Top nav (기업 active) ---------- */
function TopNav() {
  const menus = [
    { id: "home", label: "대시보드" },
    { id: "me",   label: "내 정보" },
    { id: "apps", label: "지원 현황" },
    { id: "job",  label: "이직 / 취업" },
    { id: "co",   label: "기업", active: true },
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

/* ---------- Left sidebar — 기업 section ---------- */
function SideNav() {
  return (
    <aside className="me-side" aria-label="기업 메뉴">
      <div className="crumb">기업</div>

      <div className="sec"><span className="n">01</span>기업</div>
      <a className="nav-item active" href="#" aria-current="page">
        <span className="dot"/>채용공고
        <span className="pill">8</span>
      </a>
      <a className="nav-item" href="#"><span className="dot"/>기업분석</a>
    </aside>
  );
}

/* ---------- Page header ---------- */
function PageHeader() {
  return (
    <section className="pg-head">
      <div className="lead">
        <div className="eyebrow">COMPANY · POSTINGS · NEW</div>
        <h1>채용공고 등록</h1>
        <p className="sub">
          공고를 한 번 등록해두면 자소서 작성·일정 관리·기업분석에 그대로 연결돼요.
        </p>
      </div>
    </section>
  );
}

/* ---------- Mode tabs ---------- */
const TABS = [
  {
    id: "url",
    nm: "URL 붙여넣기",
    sub: "사람인 · 원티드 · 잡코리아 · 채용 페이지",
    glyph: <Ico.Link size={16}/>,
    active: true,
  },
  {
    id: "manual",
    nm: "직접 작성",
    sub: "회사명·공고 본문 직접 입력",
    glyph: <Ico.Edit size={16}/>,
  },
  {
    id: "search",
    nm: "검색",
    sub: "공고 검색으로 한 번에 불러오기",
    glyph: <Ico.Search size={16}/>,
    locked: true,
  },
];

function ModeTabs() {
  return (
    <div className="mode-tabs" role="tablist" aria-label="입력 방식">
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={!!t.active}
          aria-disabled={!!t.locked}
          tabIndex={t.locked ? -1 : 0}
          className={"mode-tab " + (t.active ? "active " : "") + (t.locked ? "locked" : "")}
        >
          <span className="ico">
            {t.locked ? <Ico.Lock size={14}/> : t.glyph}
          </span>
          <span className="body">
            <span className="nm">
              {t.nm}
              {t.locked && <span className="v2-badge">v2 · 준비 중</span>}
            </span>
            <span className="sub">{t.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------- URL row + helper + parsed banner ---------- */
function UrlSection() {
  return (
    <section className="fc-section">
      <div className="sec-head">
        <span className="sec-title">
          <span className="num">01</span>
          채용공고 URL
        </span>
        <span className="meta">SARAMIN · 자동 인식</span>
      </div>

      <div className="url-row">
        <label className="url-field">
          <span className="lico"><Ico.Link size={18}/></span>
          <input
            type="url"
            defaultValue="https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=49210384"
            placeholder="https://www.saramin.co.kr/zf_user/jobs/..."
            aria-label="채용공고 URL"
          />
          <span className="src-pill">사람인</span>
        </label>
        <button className="btn-parse" type="button">
          <Ico.Sparkle size={14}/> 공고 불러오기
        </button>
      </div>

      <div className="help-info">
        <span className="hi-ico">i</span>
        <span className="hi-body">
          파싱에 성공하면 <b>회사명 · 공고 제목 · 주요 업무 · 자격 요건 · 우대 사항</b>이 자동으로 채워져요.
          파싱이 어려운 채용 페이지는 <b>직접 작성</b> 탭에서 본문을 그대로 붙여 넣을 수 있어요.
        </span>
        <a className="hi-link" href="#">직접 작성으로 전환 <Ico.ArrowRight/></a>
      </div>

      <div className="parsed-banner" role="status">
        <span className="pb-ico"><Ico.Check size={18}/></span>
        <div className="pb-body">
          <span className="ttl">공고 정보를 자동으로 정리했어요.</span>
          <span className="sub">
            8개 항목 채움<span className="dot"/>2개 항목은 비어 있어 보완을 권장해요
            <span className="dot"/><span style={{fontFamily: "var(--font-family-mono)"}}>parsed · 03초 전</span>
          </span>
        </div>
        <div className="pb-actions">
          <button className="iconbtn" type="button"><Ico.Refresh size={14}/>다시 파싱</button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Basic info fields (2-col) ---------- */
function BasicInfo() {
  return (
    <section className="fc-section">
      <div className="sec-head">
        <span className="sec-title">
          <span className="num">02</span>
          기본 정보
        </span>
        <span className="meta">자동 채움 · 수정 가능</span>
      </div>

      <div className="grid-2c">
        <div className="fld">
          <label className="lbl">
            회사명<span className="req">*</span>
            <span className="pre">자동 입력</span>
          </label>
          <input className="fld-input" defaultValue="(주)테크컴퍼니" />
        </div>
        <div className="fld">
          <label className="lbl">
            공고 제목<span className="req">*</span>
            <span className="pre">자동 입력</span>
          </label>
          <input className="fld-input" defaultValue="백엔드 개발자 (경력 2~5년)" />
        </div>
        <div className="fld">
          <label className="lbl">
            직무
            <span className="opt">OPTIONAL</span>
          </label>
          <input className="fld-input" defaultValue="백엔드 개발자 · 결제·정산 도메인" />
        </div>
        <div className="fld">
          <label className="lbl">
            마감일
            <span className="pre">자동 입력</span>
          </label>
          <input className="fld-input" type="text" defaultValue="2026-05-31 (금)" />
          <span className="fld-helper">오늘 기준 D-19 · 캘린더에 마감 일정으로 추가됩니다.</span>
        </div>
        <div className="fld">
          <label className="lbl">
            경력 요건
            <span className="opt">OPTIONAL</span>
          </label>
          <input className="fld-input" defaultValue="경력 2년 ~ 5년" />
        </div>
        <div className="fld">
          <label className="lbl">
            근무 형태
            <span className="opt">OPTIONAL</span>
          </label>
          <input className="fld-input" defaultValue="정규직 · 본사 (성수동)" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Detail textareas ---------- */
const DETAIL_SECTIONS = [
  {
    id: "duty",
    tone: "tone-primary",
    glyph: "D",
    title: "주요 업무",
    sub: "DUTIES",
    value:
      "· 결제·정산 시스템 백엔드 개발 및 운영\n· MSA 환경에서 도메인 서비스 개발과 API 설계\n· 대용량 트래픽 처리 최적화 및 안정화\n· 데이터 정합성 보장을 위한 배치·이벤트 파이프라인 운영",
  },
  {
    id: "req",
    tone: "tone-mint",
    glyph: "R",
    title: "자격 요건",
    sub: "REQUIREMENTS",
    value:
      "· Java / Spring Boot 2년 이상\n· RDBMS(MySQL / PostgreSQL) 운영 경험\n· REST API 설계·구현 경험\n· Git 기반 협업 및 코드 리뷰 경험",
  },
  {
    id: "pref",
    tone: "tone-peach",
    glyph: "P",
    title: "우대 사항",
    sub: "PREFERRED",
    value:
      "· Kafka / MSA 운영 경험\n· AWS 운영 경험 (EKS · RDS · MSK)\n· 대용량 트래픽(TPS 5K+) 처리 경험\n· 결제·정산 도메인 이해도",
  },
];

function DetailSections() {
  return (
    <section className="fc-section">
      <div className="sec-head">
        <span className="sec-title">
          <span className="num">03</span>
          공고 상세
        </span>
        <span className="meta">불러온 내용은 언제든 수정할 수 있어요</span>
      </div>

      <div className="detail-block">
        {DETAIL_SECTIONS.map(s => (
          <article key={s.id} className={"detail-section " + s.tone}>
            <header className="ds-head">
              <span className="ds-glyph">{s.glyph}</span>
              <span className="ds-title">{s.title}</span>
              <span className="ds-sub">· {s.sub}</span>
              <span className="ds-count">{s.value.length} / 1,000</span>
            </header>
            <textarea
              className="ds-ta"
              defaultValue={s.value}
              rows={5}
              placeholder={`${s.title}을(를) 줄바꿈으로 나누어 입력해 주세요.`}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- JD keyword card ---------- */
const KEYWORDS = [
  { label: "Spring Boot",   freq: 3, kind: "match" },
  { label: "MSA",           freq: 2, kind: "gap" },
  { label: "Kafka",         freq: 2, kind: "gap" },
  { label: "AWS",           freq: 2, kind: "gap" },
  { label: "PostgreSQL",    freq: 2, kind: "match" },
  { label: "REST API",      freq: 1, kind: "match" },
  { label: "대용량 트래픽", freq: 2, kind: "gap" },
  { label: "결제·정산",     freq: 3, kind: "neutral" },
  { label: "백엔드",        freq: 4, kind: "match" },
  { label: "경력 2년+",     freq: 1, kind: "neutral" },
];

function KeywordCard() {
  return (
    <section className="kw-card">
      <header className="kw-head">
        <span className="kw-ico"><Ico.Tag size={16}/></span>
        <div className="kw-text">
          <span className="ttl">
            JD 핵심 키워드
            <span className="tag">자동 정리</span>
          </span>
          <span className="sub">자소서 작성과 매칭 분석에 자동으로 활용돼요. 누락된 키워드는 직접 추가할 수 있어요.</span>
        </div>
        <span className="kw-count">{KEYWORDS.length}개 · {KEYWORDS.filter(k => k.kind === "match").length}개 매칭</span>

      </header>

      <div className="kw-list">
        {KEYWORDS.map((k, i) => {
          const mod = k.kind === "match" ? "is-match" : k.kind === "gap" ? "is-gap" : "";
          return (
            <span key={i} className={"kw-pill " + mod}>
              {k.label}
              <span className="freq">×{k.freq}</span>
            </span>
          );
        })}
        <span className="kw-pill add" role="button" tabIndex={0}>키워드 추가</span>
      </div>

      <div className="kw-legend">
        <span className="li is-match"><span className="sw"/>내 이력과 일치</span>
        <span className="li is-gap"><span className="sw"/>보완하면 좋은 키워드</span>
        <span className="li neutral"><span className="sw"/>일반 키워드</span>
      </div>
    </section>
  );
}

/* ---------- Sticky action bar ---------- */
function ActionBar() {
  return (
    <section className="action-bar" role="region" aria-label="저장 액션">
      <div className="ab-info">
        <span className="nm">
          (주)테크컴퍼니 · 백엔드 개발자
          <span className="badge">저장 준비됨</span>
        </span>
        <span className="sub">저장 후 자소서 작성으로 바로 이어가면 매칭 키워드가 함께 반영됩니다.</span>
      </div>
      <div className="ab-actions">
        <button className="btn-ghost" type="button">취소</button>
        <button className="btn-cta alt" type="button">저장</button>
        <button className="btn-cta" type="button">
          <Ico.Sparkle size={14}/> 저장 후 자소서 작성 <Ico.ArrowRight/>
        </button>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
function PostingNewPage() {
  return (
    <>
      <TopNav/>
      <div className="me-shell posting-shell">
        <SideNav/>
        <main className="me-main">
          <PageHeader/>
          <ModeTabs/>

          <div className="form-card">
            <UrlSection/>
            <BasicInfo/>
            <DetailSections/>
            <KeywordCard/>
          </div>

          <ActionBar/>
        </main>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PostingNewPage/>);
