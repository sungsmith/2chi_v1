/* =========================================================
   2chi · Web UI Kit — 채용공고 등록 (Posting capture)
   URL paste → auto-parse → fill basic fields
========================================================= */

const POST_TABS = [
  { id: "url",    nm: "URL 붙여넣기",  sub: "사람인 · 원티드 · 잡코리아", Ico: () => <Ico.Link size={16}/>, active: true },
  { id: "manual", nm: "직접 작성",     sub: "회사명·공고 본문 직접 입력", Ico: () => <Ico.Edit size={16}/> },
  { id: "search", nm: "검색",          sub: "공고 검색으로 한 번에",      Ico: () => <Ico.Search size={16}/>, locked: true },
];

function PostingNewScreen({ embedded = false }) {
  const Wrapper = embedded ? React.Fragment : (p) => <main className="pst-grid">{p.children}</main>;
  const wrapperProps = embedded ? {} : {};
  return (
    <Wrapper {...wrapperProps}>
      {!embedded && (
        <aside className="side-nav">
          <div className="crumb">기업</div>
          <button type="button" className="nav-item active">
            <span>채용공고</span>
            <span className="pill">8</span>
          </button>
          <button type="button" className="nav-item">
            <span>기업분석</span>
          </button>
        </aside>
      )}

      <div className="pst-main">
        <header className="pst-head">
          <h1>채용공고 등록</h1>
          <p className="sub">공고를 한 번 등록해두면 자소서 작성·일정 관리·기업분석에 그대로 연결돼요.</p>
        </header>

          <div className="mode-tabs">
            {POST_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                className={"mode-tab " + (t.active ? "active " : "") + (t.locked ? "locked" : "")}
              >
                <span className="ico">{t.locked ? <Ico.Lock size={14}/> : <t.Ico/>}</span>
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

          <section className="fc-section">
            <div className="sec-head">
              <span className="sec-title"><span className="num">01</span>채용공고 URL</span>
              <span className="meta">SARAMIN · 자동 인식</span>
            </div>
            <div className="url-row">
              <label className="url-field">
                <span className="lico"><Ico.Link size={18}/></span>
                <input type="url" defaultValue="https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=49210384"/>
                <span className="src-pill">사람인</span>
              </label>
              <button className="btn-parse"><Ico.Sparkle size={14}/> 공고 불러오기</button>
            </div>

            <div className="help-info">
              <span className="hi-ico">i</span>
              <span>파싱에 성공하면 <b>회사명 · 공고 제목 · 주요 업무 · 자격 요건 · 우대 사항</b>이 자동으로 채워져요. 파싱이 어려운 채용 페이지는 <b>직접 작성</b> 탭에서 본문을 그대로 붙여 넣을 수 있어요.</span>
              <a className="hi-link" href="#">직접 작성으로 전환 <Ico.ArrowRight/></a>
            </div>

            <div className="parsed-banner" role="status">
              <span className="pb-ico"><Ico.Check size={16}/></span>
              <div className="pb-body">
                <span className="ttl">공고 정보를 자동으로 정리했어요.</span>
                <span className="sub">
                  8개 항목 채움<span className="dot"/>2개 항목은 비어 있어 보완을 권장해요
                  <span className="dot"/><span style={{fontFamily: "var(--font-family-mono)"}}>parsed · 03초 전</span>
                </span>
              </div>
              <button className="btn ghost sm"><Ico.Refresh size={12}/> 다시 파싱</button>
            </div>
          </section>

          <section className="fc-section">
            <div className="sec-head">
              <span className="sec-title"><span className="num">02</span>기본 정보</span>
              <span className="meta">자동 채움 · 수정 가능</span>
            </div>
            <div className="grid-2c">
              <div className="fld">
                <label className="lbl">회사명<span className="req">*</span><span className="pre">자동 입력</span></label>
                <input className="fld-input" defaultValue="(주)테크컴퍼니"/>
              </div>
              <div className="fld">
                <label className="lbl">공고 제목<span className="req">*</span><span className="pre">자동 입력</span></label>
                <input className="fld-input" defaultValue="백엔드 개발자 (경력 2~5년)"/>
              </div>
              <div className="fld">
                <label className="lbl">직무<span className="opt">OPTIONAL</span></label>
                <input className="fld-input" defaultValue="백엔드 · 결제·정산 도메인"/>
              </div>
              <div className="fld">
                <label className="lbl">마감일<span className="pre">자동 입력</span></label>
                <input className="fld-input" defaultValue="2026-05-31 (금)"/>
                <span className="fld-helper">오늘 기준 D-19 · 캘린더에 마감 일정으로 추가됩니다.</span>
              </div>
            </div>
          </section>

          <section className="fc-section">
            <div className="sec-head">
              <span className="sec-title"><span className="num">03</span>주요 업무 · 자격 요건</span>
              <span className="meta">자소서 자동 매칭에 사용</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
              <div className="fld">
                <label className="lbl">주요 업무<span className="pre">자동 입력</span></label>
                <textarea className="textarea" defaultValue={"- 결제·정산 도메인 백엔드 서비스 개발 운영\n- 대용량 트래픽 처리 및 성능 개선\n- 신규 결제 채널 연동 및 안정화"} style={{minHeight:"120px"}}/>
              </div>
              <div className="fld">
                <label className="lbl">자격 요건<span className="pre">자동 입력</span></label>
                <textarea className="textarea" defaultValue={"- Java / Spring Boot 2년 이상 운영 경험\n- RDBMS · NoSQL 활용 경험 (PostgreSQL, Redis 우대)\n- Docker, K8s 기반 배포 경험"} style={{minHeight:"120px"}}/>
              </div>
            </div>
          </section>

          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",padding:"4px 2px 24px"}}>
            <button className="btn ghost">취소</button>
            <button className="btn secondary"><Ico.Save size={14}/> 초안 저장</button>
            <button className="btn primary">공고 등록하고 자소서 쓰러 가기 <Ico.ArrowRight/></button>
          </div>
        </div>
    </Wrapper>
  );
}

Object.assign(window, { PostingNewScreen });
