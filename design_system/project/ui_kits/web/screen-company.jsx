/* =========================================================
   2chi · Web UI Kit — 기업 클러스터 (Company)
   sidebar: 채용공고 / 기업분석
   Within 채용공고: list (default) ↔ new (form) ↔ detail
   Within 기업분석: list ↔ result
========================================================= */

const CO_NAV = [
  { id: "postings",  label: "채용공고", pill: "8", pillTitle: "마감되지 않은 진행중 공고 수" },
  { id: "analysis",  label: "기업분석" },
];

const POSTINGS = [
  { id: "p1", co: "카카오",         nm: "백엔드 (Saas 팀)",            role: "백엔드 · 결제·정산",  src: "saramin", dday: "D-3",  match: 72, soon: true,  added: "2일 전" },
  { id: "p2", co: "(주)테크컴퍼니", nm: "백엔드 개발자 (경력 2~5년)",  role: "백엔드 · 결제·정산",  src: "saramin", dday: "D-19", match: 68, added: "5일 전" },
  { id: "p3", co: "네이버",         nm: "백엔드 신입 / 주니어",         role: "백엔드",             src: "url",     dday: "D-23", match: 81, added: "1주 전" },
  { id: "p4", co: "토스",           nm: "Server Engineer",             role: "Backend Platform",   src: "manual",  dday: "D-6",  match: 64, soon: true, added: "3일 전" },
  { id: "p5", co: "쿠팡",           nm: "백엔드 (라스트마일)",          role: "백엔드",             src: "url",     dday: "D-14", match: 70, added: "1주 전" },
  { id: "p6", co: "당근",           nm: "Server Engineer · 결제",      role: "Backend",            src: "saramin", dday: "마감", match: 55, closed: true, added: "2주 전" },
];

function CompanySideNav({ active, onSelect }) {
  return (
    <aside className="side-nav">
      <div className="crumb">기업</div>
      {CO_NAV.map(it => (
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

/* ============================================================
   채용공고 — list / new / detail tabs
============================================================ */
function PostingListView({ onNew, onOpenDetail }) {
  const [filter, setFilter] = useState("all");

  return (
    <>
      <section className="co-head">
        <div>
          <h1>채용공고</h1>
          <div className="sub">등록한 공고는 자소서 작성 · 일정 관리 · 기업분석에 자동으로 연결돼요.</div>
        </div>
        <button className="btn primary" onClick={onNew}><Ico.Plus size={14}/> 공고 등록</button>
      </section>

      <div className="posting-toolbar">
        <label className="search">
          <span className="ico"><Ico.Search size={14}/></span>
          <input placeholder="회사명 · 직무로 검색…"/>
        </label>
        <div className="filter-chips">
          <button className={filter === "all"     ? "active" : ""} onClick={() => setFilter("all")}>전체 <span className="n">8</span></button>
          <button className={filter === "active"  ? "active" : ""} onClick={() => setFilter("active")}>진행중 <span className="n">7</span></button>
          <button className={filter === "closed"  ? "active" : ""} onClick={() => setFilter("closed")}>마감 <span className="n">1</span></button>
        </div>
      </div>

      <div className="posting-table">
        <div className="posting-row head">
          <div>공고</div>
          <div>출처</div>
          <div>매칭률</div>
          <div>D-day</div>
          <div>등록</div>
          <div/>
        </div>
        {POSTINGS.map(p => (
          <div key={p.id} className="posting-row" onClick={() => onOpenDetail(p)}>
            <div className="body">
              <div className="nm">{p.nm}</div>
              <div className="meta"><span className="co">{p.co}</span><span className="sep"/><span>{p.role}</span></div>
            </div>
            <div>
              <span className={"src-pill " + p.src}>
                {p.src === "saramin" ? "사람인" : p.src === "url" ? "URL" : "직접 작성"}
              </span>
            </div>
            <div>
              <span className="match-mini">
                <span className="bar"><span style={{width: p.match + "%"}}/></span>
                {p.match}%
              </span>
            </div>
            <div>
              <span className={"dday-pill" + (p.closed ? " closed" : p.soon ? "" : " cool")}>{p.dday}</span>
            </div>
            <div style={{fontSize:11.5, color:"var(--color-text-muted)"}}>{p.added}</div>
            <button className="more" aria-label="더보기" onClick={e => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   기업분석 결과 (DART + News + 인재상 + 활용 포인트)
============================================================ */
function CompanyAnalysisView() {
  return (
    <div className="ca-shell">
      <div className="ca-head-card">
        <span className="icon"><Ico.Building size={22}/></span>
        <div className="body">
          <div className="co">카카오</div>
          <div className="meta">
            <span>(주)카카오 · 035720</span>
            <span className="pill">IT · 모바일 플랫폼</span>
            <span className="pill fresh">분석 완료 · 방금</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost sm"><Ico.Refresh size={12}/> 다시 분석</button>
          <button className="btn secondary sm"><Ico.Download size={13}/> PDF로 저장</button>
        </div>
      </div>

      <div className="ca-grid">
        {/* LEFT — main content */}
        <div className="ca-col">
          {/* 회사 개요 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl"><span className="ico"><Ico.Building size={14}/></span>회사 개요</span>
              <span className="src">DART · 사업보고서 2024</span>
            </div>
            <div className="ca-card-body">
              <p>모바일 메신저 <b>카카오톡</b>을 기반으로 한 국내 1위 모바일 플랫폼 기업입니다. 광고·커머스·콘텐츠·금융·모빌리티 전 영역을 사내·자회사 단위로 운영합니다.</p>
              <p>2024년 기준 연결 매출 약 <b>7.8조원</b>, 영업이익 <b>4,800억원</b>. 결제·정산 도메인은 카카오페이를 통해 운영되며, 자체 백엔드 인프라는 사내 클라우드 기반으로 운영됩니다.</p>
            </div>
            <div className="ca-stat-row">
              <div className="stat"><span className="k">매출</span><span className="v">7.8조</span></div>
              <div className="stat"><span className="k">영업이익</span><span className="v">4,800억</span></div>
              <div className="stat"><span className="k">임직원</span><span className="v">5,100명</span></div>
              <div className="stat"><span className="k">설립</span><span className="v">1995</span></div>
            </div>
          </section>

          {/* 최근 이슈 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl mint"><span className="ico"><Ico.Sparkle size={13}/></span>최근 이슈 (6개월)</span>
              <span className="src">네이버 뉴스 API · 24건 분석</span>
            </div>
            <div className="ca-news">
              <div className="ca-news-row">
                <div className="body">
                  <div className="ttl">카카오, 결제·정산 도메인 백엔드 신규 채용 확대</div>
                  <div className="meta"><span className="src">전자신문</span><span className="sep"/><span>2026.05.18</span></div>
                </div>
                <span className="tag good">채용</span>
              </div>
              <div className="ca-news-row">
                <div className="body">
                  <div className="ttl">카카오뱅크와 카카오페이, 송금 인프라 통합 추진</div>
                  <div className="meta"><span className="src">한국경제</span><span className="sep"/><span>2026.05.12</span></div>
                </div>
                <span className="tag lav">신사업</span>
              </div>
              <div className="ca-news-row">
                <div className="body">
                  <div className="ttl">카카오 CTO, "MSA 운영 안정화에 2026년 집중"</div>
                  <div className="meta"><span className="src">블로터</span><span className="sep"/><span>2026.04.30</span></div>
                </div>
                <span className="tag">기술</span>
              </div>
              <div className="ca-news-row">
                <div className="body">
                  <div className="ttl">데이터 보안 사고로 과징금 12억원 — 정보보호 강화 계획 발표</div>
                  <div className="meta"><span className="src">아이뉴스24</span><span className="sep"/><span>2026.03.21</span></div>
                </div>
                <span className="tag warn">리스크</span>
              </div>
            </div>
          </section>

          {/* 인재상 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl peach"><span className="ico"><Ico.Target size={13}/></span>인재상 · 핵심 키워드</span>
              <span className="src">kakao.com · 채용 페이지</span>
            </div>
            <div className="ca-card-body">
              <p>카카오가 채용 페이지에서 강조하는 인재상은 한 마디로 <b>"문제를 직접 푸는 사람"</b>. 합의보다는 실행, 위계보다는 책임을 중요하게 봅니다.</p>
            </div>
            <div className="ca-keywords">
              <span className="ca-keyword">주도성</span>
              <span className="ca-keyword">실행력</span>
              <span className="ca-keyword">협업</span>
              <span className="ca-keyword">기술적 호기심</span>
              <span className="ca-keyword">데이터 기반 의사결정</span>
              <span className="ca-keyword">사용자 중심</span>
            </div>
          </section>

          {/* 채용 절차 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl"><span className="ico"><Ico.Layers size={13}/></span>채용 절차</span>
              <span className="src">최근 합격자 후기 · 5건 종합</span>
            </div>
            <div className="ca-process">
              <div className="ca-process-list">
                <div className="ca-step-card"><span className="step-num">STEP 1</span><span className="step-nm">서류 전형</span><span className="step-meta">평균 5일</span></div>
                <div className="ca-step-card"><span className="step-num">STEP 2</span><span className="step-nm">코딩 테스트</span><span className="step-meta">2~3시간</span></div>
                <div className="ca-step-card"><span className="step-num">STEP 3</span><span className="step-nm">1차 기술 면접</span><span className="step-meta">실무진 2명</span></div>
                <div className="ca-step-card"><span className="step-num">STEP 4</span><span className="step-nm">2차 컬처 면접</span><span className="step-meta">팀장급</span></div>
                <div className="ca-step-card"><span className="step-num">STEP 5</span><span className="step-nm">처우 협의</span><span className="step-meta">평균 7일</span></div>
              </div>
            </div>
          </section>

          {/* 자소서·면접 활용 포인트 — 가장 가치 있는 카드 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl lav"><span className="ico"><Ico.Sparkle size={13}/></span>자소서 · 면접 활용 포인트</span>
              <span className="src">AI · 검토 권장</span>
            </div>
            <div>
              <div className="ca-action">
                <span className="num">1</span>
                <div className="body">
                  <div className="ttl">"주도성"을 추상적이지 않게 풀어내세요</div>
                  <div className="msg">
                    카카오의 인재상에서 <b>주도성</b>은 "내가 발견하고 끝까지 해결한 일"로 풀이됩니다.
                    소미님의 <span className="keyword">주문 정산 시스템 성능 개선</span> 프로젝트는 문제 발견 → 분석 → 적용까지 본인 주도이므로 강조 포인트로 적합해요.
                  </div>
                  <a className="link" href="#">자소서 마스터에 반영 <Ico.ArrowRight size={11}/></a>
                </div>
              </div>
              <div className="ca-action">
                <span className="num">2</span>
                <div className="body">
                  <div className="ttl">결제 · 정산 도메인 경험을 가장 위로</div>
                  <div className="msg">
                    카카오페이 송금 통합 이슈와 직접 연결되는 영역이에요.
                    이력의 <span className="keyword">결제·정산 도메인</span> 경험을 자소서 첫 문단에 배치하면 매칭률이 +12%p 오를 것으로 예상돼요.
                  </div>
                  <a className="link" href="#">매칭 분석 다시 보기 <Ico.ArrowRight size={11}/></a>
                </div>
              </div>
              <div className="ca-action">
                <span className="num">3</span>
                <div className="body">
                  <div className="ttl">컬처 면접에선 "협업의 구체적 사례" 준비</div>
                  <div className="msg">
                    2차 면접이 컬처 면접이라 합의·갈등 해결 사례가 자주 등장해요. <b>다른 팀과 의견이 갈렸을 때 어떻게 풀었는지</b>를 정량 결과까지 함께 정리해두면 답하기 편해요.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT — rail */}
        <aside className="ca-col">
          <section className="ca-rail-card">
            <span className="rail-ttl">2026 재무 요약</span>
            <div className="ca-rail-row"><span className="k">매출 (YoY)</span><span className="v up">+8.2%</span></div>
            <div className="ca-rail-row"><span className="k">영업이익 (YoY)</span><span className="v up">+12.5%</span></div>
            <div className="ca-rail-row"><span className="k">부채비율</span><span className="v">42.8%</span></div>
            <div className="ca-rail-row"><span className="k">현금성 자산</span><span className="v">2.1조</span></div>
          </section>

          <section className="ca-rail-card">
            <span className="rail-ttl">연결된 채용공고 · 2</span>
            <div className="ca-rail-related">
              <div className="ca-rail-posting">
                <div className="nm">백엔드 (Saas 팀)</div>
                <div className="meta">
                  <span>매칭률 72%</span>
                  <span className="dday">D-3</span>
                </div>
              </div>
              <div className="ca-rail-posting">
                <div className="nm">백엔드 (광고 플랫폼)</div>
                <div className="meta">
                  <span>매칭률 65%</span>
                  <span className="dday" style={{background:"var(--color-neutral-100)",color:"var(--color-text-secondary)"}}>D-12</span>
                </div>
              </div>
            </div>
          </section>

          <section className="ca-rail-card">
            <span className="rail-ttl">데이터 소스</span>
            <div style={{fontSize:11.5, color:"var(--color-text-muted)", lineHeight:1.6}}>
              <div>· DART 사업보고서 (2024 연결)</div>
              <div>· 네이버 뉴스 API (최근 180일)</div>
              <div>· kakao.com 채용·인재상 페이지</div>
              <div>· 합격자 후기 5건 (사용자 익명)</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AnalysisListView({ onOpen, onNew }) {
  const items = [
    { co: "카카오",   tag: "방금 분석", match: 72, postings: 2, fresh: true },
    { co: "네이버",   tag: "3일 전",   match: 81, postings: 1 },
    { co: "토스",     tag: "1주 전",   match: 64, postings: 1 },
    { co: "(주)테크컴퍼니", tag: "2주 전", match: 68, postings: 1 },
  ];
  return (
    <>
      <section className="co-head">
        <div>
          <h1>기업분석</h1>
          <div className="sub">DART · 뉴스 · 채용 페이지를 한 번에 정리한 회사별 카드를 모아둡니다.</div>
        </div>
        <button className="btn primary" onClick={onNew}><Ico.Plus size={14}/> 회사 분석 추가</button>
      </section>

      <div className="posting-toolbar">
        <label className="search">
          <span className="ico"><Ico.Search size={14}/></span>
          <input placeholder="회사명 검색…"/>
        </label>
      </div>

      <div className="posting-table">
        <div className="posting-row head" style={{gridTemplateColumns: "1fr 120px 100px 100px 80px 32px"}}>
          <div>회사</div>
          <div>분석</div>
          <div>매칭률</div>
          <div>연결 공고</div>
          <div/>
          <div/>
        </div>
        {items.map((it, i) => (
          <div key={i} className="posting-row" onClick={onOpen} style={{gridTemplateColumns: "1fr 120px 100px 100px 80px 32px"}}>
            <div className="body">
              <div className="nm">{it.co}</div>
              <div className="meta">DART · 뉴스 · 인재상</div>
            </div>
            <div>
              <span className={"src-pill " + (it.fresh ? "saramin" : "")}>{it.tag}</span>
            </div>
            <div>
              <span className="match-mini">
                <span className="bar"><span style={{width: it.match + "%"}}/></span>
                {it.match}%
              </span>
            </div>
            <div style={{fontFamily:"var(--font-family-mono)", fontSize:11, fontWeight:700}}>{it.postings}건</div>
            <div/>
            <button className="more" onClick={e => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   ROUTER
============================================================ */
function CompanyScreen() {
  // active = 'postings' | 'analysis'
  // sub    = 'list' | 'new' | 'detail' | 'result'
  const [active, setActive] = useState("postings");
  const [sub, setSub]       = useState("list");
  const [selectedPosting, setSelectedPosting] = useState(null);

  const goSection = (id) => { setActive(id); setSub("list"); };

  return (
    <div className="co-shell">
      <CompanySideNav active={active} onSelect={goSection}/>
      <div className="co-main">
        {active === "postings" && sub === "list" && (
          <PostingListView
            onNew={() => setSub("new")}
            onOpenDetail={(p) => { setSelectedPosting(p); setSub("detail"); }}
          />
        )}
        {active === "postings" && sub === "detail" && (
          <PostingDetailView
            posting={selectedPosting}
            onBack={() => setSub("list")}
            onEdit={() => setSub("new")}
          />
        )}
        {active === "postings" && sub === "new" && (
          <>
            <button className="pd-back" onClick={() => setSub(selectedPosting ? "detail" : "list")}>
              <Ico.ArrowLeft size={12}/> {selectedPosting ? "상세로" : "목록으로"}
            </button>
            <PostingNewScreenEmbedded/>
          </>
        )}
        {active === "analysis" && sub === "list" && (
          <AnalysisListView
            onOpen={() => setSub("result")}
            onNew={() => setSub("entry")}
          />
        )}
        {active === "analysis" && sub === "entry" && (
          <>
            <button className="pd-back" onClick={() => setSub("list")}>
              <Ico.ArrowLeft size={12}/> 분석 목록으로
            </button>
            <CompanyAnalysisEntry onResult={() => setSub("result")}/>
          </>
        )}
        {active === "analysis" && sub === "result" && (
          <>
            <button className="pd-back" onClick={() => setSub("list")}>
              <Ico.ArrowLeft size={12}/> 목록으로
            </button>
            <CompanyAnalysisView/>
          </>
        )}
      </div>
    </div>
  );
}

/* Embedded posting-new — uses the existing PostingNewScreen but
   strips its sidebar (we already render one at the cluster level). */
function PostingNewScreenEmbedded() {
  return <PostingNewScreen embedded/>;
}

/* ============================================================
   채용공고 상세 (Posting detail)
============================================================ */
function PostingDetailView({ posting, onBack, onEdit, onOpenCl, onOpenCompose }) {
  const p = posting || {
    co: "(주)테크컴퍼니", nm: "백엔드 개발자 (경력 2~5년)", role: "백엔드 · 결제·정산",
    src: "saramin", dday: "D-19", match: 68, added: "5일 전",
  };
  const srcLabel = p.src === "saramin" ? "사람인" : p.src === "url" ? "URL 등록" : "직접 작성";
  return (
    <div className="pd-shell">
      <button className="pd-back" onClick={onBack}>
        <Ico.ArrowLeft size={12}/> 목록으로
      </button>

      {/* HEADER CARD */}
      <section className="pd-head-card">
        <div className="pd-head-top">
          <div className="left">
            <span className="crumb">기업 / 채용공고 / <span className="co">{p.co}</span></span>
            <h1>{p.nm}</h1>
            <div className="meta">
              <span>{p.role}</span>
              <span className="sep"/>
              <span>경기 성남 · 정규직</span>
              <span className="sep"/>
              <span className="src-pill">{srcLabel}</span>
              <span className="sep"/>
              <span>등록 {p.added}</span>
            </div>
          </div>
          <div className="pd-head-actions">
            <button className="btn ghost sm" onClick={onEdit}><Ico.Edit size={12}/> 편집</button>
            <button className="btn secondary sm">기업분석 보기</button>
            <button className="btn primary sm" onClick={onOpenCompose}>
              <Ico.Sparkle size={12}/> 자소서 쓰러 가기
            </button>
          </div>
        </div>
        <div className="pd-stats">
          <div className="stat">
            <span className="k">매칭률</span>
            <span className="v match">{p.match}<span className="unit">%</span></span>
          </div>
          <div className="stat">
            <span className="k">D-day</span>
            <span className="v dday">{p.dday}</span>
          </div>
          <div className="stat">
            <span className="k">마감일</span>
            <span className="v" style={{fontSize:13.5,fontWeight:600,letterSpacing:0}}>2026.05.31<span className="unit">금</span></span>
          </div>
          <div className="stat">
            <span className="k">연결 자소서</span>
            <span className="v">2<span className="unit">건</span></span>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="pd-grid">
        <div className="pd-col">
          {/* JD card */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="ttl"><span className="ico"><Ico.Layers size={13}/></span>채용 정보 (JD)</span>
              <span className="meta">사람인 · 마지막 동기화 5분 전</span>
            </div>
            <div className="pd-card-body">
              <h4>주요 업무</h4>
              <ul>
                <li><span className="kw match">결제·정산 도메인</span> 백엔드 서비스 개발 운영</li>
                <li><span className="kw match">대용량 트래픽</span> 처리 및 성능 개선</li>
                <li>신규 결제 채널 연동 및 안정화</li>
                <li><span className="kw gap">Kafka 기반 비동기 처리</span> 안정성 강화</li>
              </ul>
              <h4>자격 요건</h4>
              <ul>
                <li><span className="kw match">Java</span> / <span className="kw match">Spring Boot</span> 2년 이상 운영 경험</li>
                <li>RDBMS · NoSQL 활용 경험 (<span className="kw match">PostgreSQL</span>, <span className="kw match">Redis</span> 우대)</li>
                <li><span className="kw match">Docker</span>, K8s 기반 배포 경험</li>
                <li><span className="kw gap">MSA 운영</span> 또는 분산 시스템 설계 경험</li>
              </ul>
              <h4>우대 사항</h4>
              <ul>
                <li>결제·정산 도메인에서 <span className="kw gap">TPS 5,000+</span> 처리 경험</li>
                <li>관측성 도구 (<span className="kw gap">Datadog</span>, Grafana, OpenTelemetry) 운영 경험</li>
                <li>오픈소스 컨트리뷰트 경험</li>
              </ul>
            </div>
          </section>

          {/* Match analysis card */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="ttl mint"><span className="ico"><Ico.Target size={13}/></span>매칭 분석</span>
              <span className="meta">내 이력 키워드 ∩ JD</span>
            </div>
            <div className="pd-match-row matched">
              <div className="row-head">
                <span className="nm">매칭된 키워드 <span className="count">12</span></span>
                <span style={{fontSize:11.5, color:"var(--color-text-muted)"}}>JD 18개 중 12개 일치</span>
              </div>
              <div className="chip-row">
                <span className="chip">PostgreSQL</span>
                <span className="chip">Redis</span>
                <span className="chip">Spring Boot</span>
                <span className="chip">Java</span>
                <span className="chip">Docker</span>
                <span className="chip">결제·정산 도메인</span>
                <span className="chip">JPA</span>
                <span className="chip">대용량 트래픽</span>
              </div>
            </div>
            <div className="pd-match-row gap">
              <div className="row-head">
                <span className="nm">보완할 키워드 <span className="count">4</span></span>
                <span style={{fontSize:11.5, color:"var(--color-text-muted)"}}>자소서·면접 답변에 추가 권장</span>
              </div>
              <div className="chip-row">
                <span className="chip">Kafka</span>
                <span className="chip">MSA 운영</span>
                <span className="chip">Datadog</span>
                <span className="chip">TPS 5K+</span>
              </div>
            </div>
          </section>

          {/* Linked cover letters */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="ttl lav"><span className="ico"><Ico.FileEdit size={13}/></span>연결된 자소서</span>
              <span className="meta">변형본 포함</span>
            </div>
            <div className="pd-cl-row" onClick={onOpenCl}>
              <div className="body">
                <div className="nm">테크컴퍼니 백엔드 자소서 v1</div>
                <div className="meta">변형본 · 마스터에서 분기 · 마지막 저장 1시간 전</div>
              </div>
              <span className="match-mini">
                <span className="bar"><span style={{width:"68%"}}/></span>
                68%
              </span>
              <span className="stage-pill draft">작성중</span>
              <button className="iconbtn" onClick={(e) => e.stopPropagation()} aria-label="더보기" style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--color-text-muted)",width:28,height:28,borderRadius:6,display:"grid",placeItems:"center"}}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>
            <div className="pd-cl-row" onClick={onOpenCl}>
              <div className="body">
                <div className="nm">테크컴퍼니 백엔드 자소서 v2 (협업 강조 톤)</div>
                <div className="meta">변형본 · 어제 분기</div>
              </div>
              <span className="match-mini">
                <span className="bar"><span style={{width:"72%"}}/></span>
                72%
              </span>
              <span className="stage-pill ready">제출완료</span>
              <button className="iconbtn" onClick={(e) => e.stopPropagation()} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--color-text-muted)",width:28,height:28,borderRadius:6,display:"grid",placeItems:"center"}}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>
            <button className="pd-cl-add" onClick={onOpenCompose}>
              <Ico.Plus size={12}/> 새 자소서 변형본 만들기
            </button>
          </section>
        </div>

        {/* RIGHT RAIL */}
        <aside className="pd-col">
          <section className="pd-rail-card">
            <span className="rail-ttl">공고 정보</span>
            <div className="pd-rail-row"><span className="k">고용 형태</span><span className="v">정규직</span></div>
            <div className="pd-rail-row"><span className="k">경력</span><span className="v">2~5년</span></div>
            <div className="pd-rail-row"><span className="k">지역</span><span className="v">경기 성남 (분당)</span></div>
            <div className="pd-rail-row"><span className="k">학력</span><span className="v">학력 무관</span></div>
            <div className="pd-rail-row"><span className="k">출처</span><span className="v link">사람인 원문 보기</span></div>
          </section>

          <section className="pd-rail-card">
            <span className="rail-ttl">동기화 · 알림</span>
            <div className="pd-rail-row"><span className="k">마지막 동기화</span><span className="v">5분 전</span></div>
            <div className="pd-rail-row"><span className="k">마감 알림</span><span className="v">D-3, D-1</span></div>
            <div className="pd-rail-row"><span className="k">캘린더</span><span className="v link">일정 등록됨</span></div>
          </section>

          <section className="pd-rail-card">
            <span className="rail-ttl">비슷한 공고 · 3</span>
            <div className="pd-similar">
              <div className="pd-similar-row">
                <div className="nm">카카오 백엔드 (Saas 팀)</div>
                <div className="meta">결제·정산 · 매칭률 72% <span className="dday soon">D-3</span></div>
              </div>
              <div className="pd-similar-row">
                <div className="nm">토스 Server Engineer</div>
                <div className="meta">Backend Platform · 매칭률 64% <span className="dday">D-6</span></div>
              </div>
              <div className="pd-similar-row">
                <div className="nm">네이버 백엔드 신입</div>
                <div className="meta">백엔드 · 매칭률 81% <span className="dday">D-23</span></div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
function CompanyAnalysisEntry({ onResult }) {
  const [step, setStep] = useState("search"); // search | candidates | empty
  const [picked, setPicked] = useState("c1");
  return (
    <div className="ca-entry">
      <section className="co-head">
        <div>
          <h1>새 회사 분석</h1>
          <div className="sub">분석할 회사명을 검색해주세요. DART · 뉴스 · 인재상을 한 번에 정리해드릴게요.</div>
        </div>
      </section>

      <section className="ca-entry-card">
        <div className="head">
          <span className="lbl">회사명 <span className="req">*</span></span>
          <span className="sub">정확한 회사명이 좋아요 (예: "카카오", "(주)테크컴퍼니")</span>
        </div>
        <div className="ca-search-row">
          <label className="ca-search-field">
            <span className="ico"><Ico.Search size={16}/></span>
            <input defaultValue="카카오" placeholder="회사명 검색…"/>
          </label>
          <button className="ca-search-btn" onClick={() => setStep("candidates")}>
            <Ico.Sparkle size={14}/> 검색
          </button>
        </div>

        {step === "candidates" && (
          <>
            <div className="head" style={{paddingTop:4}}>
              <span className="lbl">동명 기업 후보 · 3</span>
              <span className="sub">DART 등록된 사업자 기준</span>
            </div>
            <div className="ca-candidates">
              <div className={"ca-cand-row" + (picked === "c1" ? " selected" : "")} onClick={() => setPicked("c1")}>
                <span className="co-glyph">카</span>
                <div className="body">
                  <span className="nm">주식회사 카카오</span>
                  <span className="meta">IT · 모바일 플랫폼 <span className="sep">·</span> 본사 경기 성남 <span className="sep">·</span> 임직원 5,100명</span>
                </div>
                <span className="stock">KOSPI 035720</span>
                <span className="pick-radio"/>
              </div>
              <div className={"ca-cand-row" + (picked === "c2" ? " selected" : "")} onClick={() => setPicked("c2")}>
                <span className="co-glyph">카</span>
                <div className="body">
                  <span className="nm">카카오게임즈</span>
                  <span className="meta">게임 · 모바일/PC <span className="sep">·</span> 본사 경기 성남 <span className="sep">·</span> 임직원 1,200명</span>
                </div>
                <span className="stock">KOSDAQ 293490</span>
                <span className="pick-radio"/>
              </div>
              <div className={"ca-cand-row" + (picked === "c3" ? " selected" : "")} onClick={() => setPicked("c3")}>
                <span className="co-glyph">카</span>
                <div className="body">
                  <span className="nm">카카오페이</span>
                  <span className="meta">금융 · 간편결제 <span className="sep">·</span> 본사 서울 <span className="sep">·</span> 임직원 1,150명</span>
                </div>
                <span className="stock">KOSPI 377300</span>
                <span className="pick-radio"/>
              </div>
            </div>
            <div className="ca-entry-foot">
              <span className="hint">맞는 회사가 없다면 직접 입력해주세요.</span>
              <button className="btn primary sm" onClick={onResult}>
                선택하고 분석 시작 <Ico.ArrowRight size={13}/>
              </button>
            </div>
          </>
        )}

        {step === "empty" && (
          <div className="ca-empty">
            <span className="ico">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <div className="body">
              <div className="ttl">정보가 제한적이에요</div>
              <div className="desc">DART에 등록된 정보가 없거나, 비상장 기업일 수 있어요. 직접 회사 정보를 입력하면 그대로 분석에 활용할게요.</div>
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setStep("search")}>다시 검색</button>
                <button className="btn primary sm">직접 입력하기</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div style={{display:"flex", justifyContent:"center", gap:8}}>
        <button className="btn ghost sm" onClick={() => setStep(step === "empty" ? "candidates" : "empty")}>
          (데모) {step === "empty" ? "후보 보기" : "정보 부족 케이스 보기"}
        </button>
      </div>
    </div>
  );
}
Object.assign(window, { CompanyAnalysisEntry });
