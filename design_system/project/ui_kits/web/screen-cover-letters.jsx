/* =========================================================
   2chi · Web UI Kit — 자소서 클러스터
   - cl-list:   자소서 목록 (master + variants)
   - cl-statement: 경력기술서 재구조화
   Routes off the "이직/취업" top-nav.
========================================================= */

const CL_TABS = [
  { id: "cl-list",      label: "자소서",      pill: "14", pillTitle: "휴지통 제외 자소서 전체 수 (마스터 + 변형본)" },
  { id: "cl-statement", label: "경력기술서" },
];

/* ============================================================
   COVER-LETTER LIST
============================================================ */
const CL_FILTERS = [
  { id: "all",   nm: "전체",   n: 14 },
  { id: "draft", nm: "작성중", n: 5 },
  { id: "ready", nm: "제출완료", n: 7 },
  { id: "trash", nm: "휴지통", n: 2 },
];

const MASTERS = [
  { id: "m1", title: "백엔드 마스터 자소서", co: "공통", pos: "백엔드 개발자", mark: "마",
    match: 100, updated: "어제", variants: 6, dday: null, status: "master" },
  { id: "m2", title: "신입 백엔드 마스터 (중고신입 톤)", co: "공통", pos: "백엔드 · 중고신입", mark: "신",
    match: 100, updated: "3일 전", variants: 3, dday: null, status: "master" },
];

const VARIANTS = [
  { id: "v1", title: "카카오 X 결제·정산 백엔드", co: "카카오", pos: "백엔드 (Saas 팀)", mark: "카",
    match: 72, updated: "3분 전", dday: "D-3", status: "draft" },
  { id: "v2", title: "(주)테크컴퍼니 백엔드 (경력 2~5년)", co: "(주)테크컴퍼니", pos: "백엔드 · 결제·정산", mark: "테",
    match: 68, updated: "1시간 전", dday: "D-19", status: "draft" },
  { id: "v3", title: "네이버 신입 백엔드", co: "네이버", pos: "백엔드 신입 / 주니어", mark: "네",
    match: 81, updated: "어제", dday: null, status: "ready" },
  { id: "v4", title: "토스 Server Engineer", co: "토스", pos: "Server Engineer", mark: "토",
    match: 64, updated: "2일 전", dday: "D-6", status: "draft" },
  { id: "v5", title: "쿠팡 백엔드 (라스트마일)", co: "쿠팡", pos: "백엔드", mark: "쿠",
    match: 70, updated: "5일 전", dday: null, status: "ready" },
];

function ClCard({ item, master = false, onOpen }) {
  return (
    <article
      className={"cl-card" + (master ? " master" : "")}
      onClick={onOpen}
      tabIndex={0}
    >
      <div className="cl-card-head">
        <div className="cl-card-meta">
          <span className="co">{item.co}</span>
          <span className="sep"/>
          <span>{item.pos}</span>
        </div>
        <button className="more" aria-label="더보기" onClick={e => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>
      <div className="title">{item.title}</div>
      {!master && (
        <div className="match">
          <span className="match-bar"><span style={{width: item.match + "%"}}/></span>
          <span className="pct">{item.match}%</span>
        </div>
      )}
      <div className="cl-card-foot">
        {master && <span className="badge master">마스터</span>}
        {!master && item.status === "draft" && <span className="badge draft">작성중</span>}
        {!master && item.status === "ready" && <span className="badge done">제출완료</span>}
        {item.dday && <span className="badge dday">{item.dday}</span>}
        {master && <span className="badge">변형본 {item.variants}</span>}
        <span className="updated">{item.updated}</span>
      </div>
    </article>
  );
}

function ClListView({ onOpenEditor }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  if (filter === "trash") {
    return <TrashView onBack={() => setFilter("all")}/>;
  }
  return (
    <>
      <div className="cl-list-head">
        <div>
          <h1>자소서</h1>
          <div className="sub">마스터 자소서 한 벌을 만들어두면, 회사별 변형본은 한 번에 만들어드려요.</div>
        </div>
        <button className="btn primary"><Ico.Plus size={14}/> 새 자소서 작성</button>
      </div>

      <div className="cl-toolbar">
        <label className="search">
          <span className="ico"><Ico.Search size={14}/></span>
          <input placeholder="회사명 · 자소서 제목으로 검색…"/>
        </label>
        <div className="cl-filter-chips">
          {CL_FILTERS.map(f => (
            <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>
              {f.nm}<span className="n">{f.n}</span>
            </button>
          ))}
        </div>
        <div className="cl-sort">
          <div className="seg">
            <button className={sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}>최근순</button>
            <button className={sort === "dday" ? "active" : ""} onClick={() => setSort("dday")}>마감순</button>
            <button className={sort === "match" ? "active" : ""} onClick={() => setSort("match")}>매칭률</button>
          </div>
        </div>
      </div>

      <div className="cl-section-title">마스터 자소서 <span className="count">{MASTERS.length}</span></div>
      <div className="cl-grid">
        {MASTERS.map(m => <ClCard key={m.id} item={m} master onOpen={onOpenEditor}/>)}
        <button className="cl-card add" type="button">
          <span className="ico"><Ico.Plus size={14}/></span>
          <span className="label">새 마스터 자소서</span>
          <span className="hint">공통 톤을 한 번에 정해두기</span>
        </button>
      </div>

      <div className="cl-section-title">회사별 변형본 <span className="count">{VARIANTS.length}</span></div>
      <div className="cl-grid">
        {VARIANTS.map(v => <ClCard key={v.id} item={v} onOpen={onOpenEditor}/>)}
      </div>
    </>
  );
}

/* ============================================================
   경력기술서 재구조화
============================================================ */
const TRASH_ITEMS = [
  { id: "t1", title: "당근 Server Engineer · 결제 자소서",  co: "당근",   pos: "Backend",            deleted: "2026.05.10", remainingDays: 28 },
  { id: "t2", title: "라인 백엔드 신입 자소서 v2",          co: "라인",   pos: "백엔드 신입",         deleted: "2026.04.28", remainingDays: 16 },
  { id: "t3", title: "쿠팡 결제 백엔드 (구버전 마스터)",    co: "쿠팡",   pos: "백엔드",              deleted: "2026.04.15", remainingDays: 3, soon: true },
];

function TrashView({ onBack }) {
  return (
    <>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:14}}>
        <button className="btn ghost sm" onClick={onBack}>
          <Ico.ArrowLeft size={12}/> 자소서 목록으로
        </button>
      </div>

      <section className="co-head" style={{marginBottom:14}}>
        <div>
          <h1>휴지통</h1>
          <div className="sub" style={{fontSize:13.5, color:"var(--color-text-secondary)", marginTop:4}}>
            삭제한 자소서는 <b>30일간</b> 보관 후 영구 삭제돼요.
          </div>
        </div>
      </section>

      <div className="trash-banner">
        <span className="ico">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </span>
        <span className="body">
          <b>3건이 휴지통에 있어요.</b> 30일이 지나면 자동으로 영구 삭제돼요. 그 안에 복구하면 원본 그대로 돌아와요.
        </span>
        <button className="clear-all">전부 영구 삭제</button>
      </div>

      <div className="trash-table">
        <div className="trash-row head">
          <div>자소서</div>
          <div>삭제일</div>
          <div>영구 삭제까지</div>
          <div/>
        </div>
        {TRASH_ITEMS.map(t => (
          <div key={t.id} className="trash-row">
            <div className="body">
              <div className="nm">{t.title}</div>
              <div className="meta"><span className="co">{t.co}</span> · {t.pos}</div>
            </div>
            <div className="deleted-at">{t.deleted}</div>
            <div className={"remaining" + (t.soon ? " soon" : "")}>
              <span className="bar"><span style={{width: (t.remainingDays / 30 * 100) + "%"}}/></span>
              {t.remainingDays}일
            </div>
            <div className="actions">
              <button className="btn ghost sm"><Ico.Refresh size={12}/> 복구</button>
              <button className="btn ghost sm" style={{color:"var(--color-semantic-error)"}}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                영구 삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
Object.assign(window, { TrashView });

const POSTINGS_FOR_PICKER = [
  { id: "p1", co: "카카오",         nm: "백엔드 (Saas 팀)",            role: "백엔드 · 결제·정산", dday: "D-3",  match: 72, soon: true },
  { id: "p2", co: "(주)테크컴퍼니", nm: "백엔드 개발자 (경력 2~5년)",   role: "백엔드 · 결제·정산", dday: "D-19", match: 68 },
  { id: "p3", co: "네이버",         nm: "백엔드 신입 / 주니어",          role: "백엔드",            dday: "D-23", match: 81 },
  { id: "p4", co: "토스",           nm: "Server Engineer",              role: "Backend Platform",  dday: "D-6",  match: 64, soon: true },
];

function CareerStatementView() {
  const [picked, setPicked] = useState(null);
  const [hover, setHover]   = useState("p1");

  if (!picked) {
    return (
      <>
        <div className="cs-head">
          <div>
            <h1>경력기술서 재구조화</h1>
            <div className="sub">
              내 경력기술 + 채용공고 + 기업분석을 함께 보고, 공고에 가까운 표현으로 다시 정리해드려요.
              먼저 어떤 공고를 기준으로 재구조화할지 골라주세요.
            </div>
          </div>
        </div>

        <div className="cs-steps">
          <span className="cs-step active"><span className="num">1</span>채용공고 선택</span>
          <span className="cs-step-sep"/>
          <span className="cs-step"><span className="num">2</span>옵션 · 결과 확인</span>
        </div>

        <section className="cs-picker">
          <div className="picker-head">
            <span className="lbl">연결할 채용공고 <span className="req">*</span></span>
            <span className="sub">등록된 8건 · 매칭률순</span>
          </div>
          <label className="search">
            <span className="ico"><Ico.Search size={14}/></span>
            <input placeholder="회사명 · 직무로 검색…"/>
          </label>
          <div className="cs-posting-list">
            {POSTINGS_FOR_PICKER.map(p => (
              <div
                key={p.id}
                className={"cs-posting-row" + (hover === p.id ? " selected" : "")}
                onClick={() => setHover(p.id)}
                onDoubleClick={() => setPicked(p)}
              >
                <div className="body">
                  <div className="nm">{p.nm}</div>
                  <div className="meta"><span className="co">{p.co}</span> · {p.role}</div>
                </div>
                <span className="match-mini">
                  <span className="bar"><span style={{width: p.match + "%"}}/></span>
                  {p.match}%
                </span>
                <span className={"dday-pill" + (p.soon ? "" : " cool")}>{p.dday}</span>
                <span className="pick-radio"/>
              </div>
            ))}
          </div>
          <div className="cs-picker-foot">
            <span className="hint">등록된 공고가 없다면 기업 → 채용공고 등록에서 추가하세요.</span>
            <button
              className="btn primary sm"
              onClick={() => setPicked(POSTINGS_FOR_PICKER.find(p => p.id === hover))}
            >
              선택하고 다음 단계로 <Ico.ArrowRight size={13}/>
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="cs-head">
        <div>
          <h1>경력기술서 재구조화</h1>
          <div className="sub">선택한 공고에 맞춰 옵션을 조정하고, 재구조화 결과를 검토하세요.</div>
        </div>
        <button className="btn secondary"><Ico.Download size={13}/> 결과 다운로드</button>
      </div>

      <div className="cs-steps">
        <span className="cs-step done"><span className="num"><Ico.Check size={11}/></span>채용공고 선택</span>
        <span className="cs-step-sep"/>
        <span className="cs-step active"><span className="num">2</span>옵션 · 결과 확인</span>
        <span className="cs-step-summary">
          <b>{picked.co}</b> · {picked.nm}
          <button className="change" onClick={() => setPicked(null)}>변경</button>
        </span>
      </div>

      <section className="cs-options">
        <div>
          <div className="ctl-lbl">강조하고 싶은 경험<span className="opt">선택</span></div>
          <input className="ctl-input" defaultValue="결제·정산 도메인 운영 경험을 가장 위로"/>
        </div>
        <div>
          <div className="ctl-lbl">자소서 톤<span className="opt">선택</span></div>
          <input className="ctl-input" defaultValue="협업 · 주도성 키워드 자연스럽게"/>
        </div>
        <div className="ctl-full">
          <div className="ctl-lbl">사용자 요청사항<span className="opt">선택</span></div>
          <textarea defaultValue={"Kafka 경험은 '학습 중'으로 표현해주시면 좋겠어요.\n결과 수치가 빈 프로젝트는 보완 가이드도 함께 제안해주세요."}/>
        </div>
        <button className="gen-btn"><Ico.Sparkle size={14}/> 재구조화 결과 만들기</button>
      </section>

      <div className="cs-result-shell">
        <section className="cs-result-pane before">
          <div className="cs-pane-head">
            <span className="ttl-row">
              <span className="ttl-eyebrow">Before</span>
              <span className="ttl">원본 경력기술</span>
            </span>
          </div>
          <div className="cs-pane-body">
            <div className="meta-line">(주)현재회사 · 2024.04 ~ 재직 중</div>
            <h4>주문 정산 시스템 성능 개선</h4>
            <ul>
              <li>월말 정산 TPS 500 한계 도달, 지연 10분.</li>
              <li>JPA 패치 전략을 fetch join으로 전환, 정산 트랜잭션 분리해 Kafka 기반 비동기 처리로 옮김.</li>
              <li className="kept">TPS 500 → 2,000, 처리 지연 10분 → 30초로 단축. 야간 운영 대기조 1명 감축.</li>
            </ul>
            <h4>유저 인증 모듈 리팩토링</h4>
            <ul>
              <li className="del">레거시 인증 모듈을 Spring Security + JWT 구조로 전환.</li>
              <li className="del">결과 수치 없음.</li>
            </ul>
          </div>
          <div className="cs-pane-foot">
            <span className="meta">소스 · <b>경력기술 (PRAR)</b></span>
            <div className="right">
              <button className="btn ghost sm">원본 페이지로</button>
            </div>
          </div>
        </section>

        <section className="cs-result-pane after">
          <div className="cs-pane-head">
            <span className="ttl-row">
              <span className="ttl-eyebrow">After</span>
              <span className="ttl">{picked.co} 백엔드용 재구조화</span>
            </span>
            <span className="badge"><Ico.Sparkle size={11}/> AI · 검토 필요</span>
          </div>
          <div className="cs-pane-body">
            <div className="meta-line">결제·정산 도메인 강조 · 협업/주도성 키워드 반영</div>
            <h4>주문 정산 시스템 — 결제·정산 도메인 성능 개선</h4>
            <ul>
              <li>월말 정산 TPS 500 한계로 운영팀과 함께 마감 일정이 미뤄지던 상황이었습니다.</li>
              <li><span className="ins">결제·정산 도메인</span>의 병목을 직접 분석하고, fetch join + 복합 인덱스 + 비동기 분리를 주도적으로 적용했습니다.</li>
              <li>TPS <b>500 → 2,000</b>, 처리 지연 <b>10분 → 30초</b>로 단축. 무중단 전환 + 야간 운영 대기조 1명 감축.</li>
              <li><span className="ins">Kafka 기반 비동기 처리는 학습하며 점진적으로 도입</span>했고, 운영 안정화까지 확인했습니다.</li>
            </ul>
            <h4>유저 인증 모듈 리팩토링 — 협업 중심으로 풀어쓰기</h4>
            <ul>
              <li>레거시 인증 모듈을 Spring Security + JWT 구조로 전환했습니다.</li>
              <li><span className="ins">보안팀 · QA와 협업해 인증 흐름을 합의하고 단계적으로 배포</span>했습니다.</li>
            </ul>
          </div>
          <div className="cs-pane-foot">
            <span className="meta">변경 <b>5</b>건 · 추가 <b>4</b>건 · 키워드 매칭 <b>+6</b></span>
            <div className="right">
              <button className="btn secondary sm">자소서 마스터에 반영</button>
              <button className="btn primary sm">결과로 덮어쓰기</button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* ============================================================
   ROUTER
============================================================ */
function CoverLettersScreen({ initialTab = "cl-list", onOpenEditor }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div className="cl-shell-wrap">
      <aside className="side-nav">
        <div className="crumb">이직 / 취업</div>
        {CL_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={"nav-item" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            {t.pill && <span className="pill" title={t.pillTitle}>{t.pill}</span>}
          </button>
        ))}
      </aside>
      <div className="cl-main">
        {tab === "cl-list"      && <ClListView onOpenEditor={() => setTab("cl-editor")}/>}
        {tab === "cl-statement" && <CareerStatementView/>}
        {tab === "cl-editor"    && (
          <>
            <div style={{marginBottom: 14}}>
              <button className="btn ghost sm" onClick={() => setTab("cl-list")}>
                <Ico.ArrowLeft size={12}/> 자소서 목록으로
              </button>
            </div>
            <CoverLetterScreen/>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CoverLettersScreen });
