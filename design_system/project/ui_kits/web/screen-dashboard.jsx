/* =========================================================
   2chi · Web UI Kit — Dashboard screen
========================================================= */

const SCHEDULE = [
  { stage: "1차면접",    stageCls: "int1", company: "(주)테크컴퍼니", role: "백엔드 (경력 2~5년)",  m: "MAY", d: "10", wd: "MON", time: "14:00", dday: "D-2",  soon: true },
  { stage: "코딩테스트", stageCls: "code", company: "네이버",         role: "백엔드 신입 / 주니어", m: "MAY", d: "11", wd: "TUE", time: "10:00", dday: "D-3" },
  { stage: "서류마감",   stageCls: "doc",  company: "카카오",         role: "백엔드 (Saas 팀)",     m: "MAY", d: "12", wd: "WED", time: "23:59", dday: "오늘" },
  { stage: "임원면접",   stageCls: "exec", company: "토스",           role: "Server Engineer",      m: "MAY", d: "14", wd: "FRI", time: "16:00", dday: "D-6" },
];

const GAPS = [
  { nm: "Kafka / MSA 운영 경험",        sub: "결제·정산 도메인 공고에서 자주 언급",   hit: "5건" },
  { nm: "대용량 트래픽 처리 (TPS 5K+)", sub: "관련 프로젝트 정량 결과 보완 추천",     hit: "4건" },
  { nm: "관측성(Observability) 도구",   sub: "Datadog · Grafana · OpenTelemetry",     hit: "3건" },
];

function DashboardScreen({ onNavigate, completedOnb }) {
  return (
    <div className="kit-amb">
      <main className="kit-main">
        {/* Greeting */}
        <section className="greet">
          <div className="greet-text">
            <h1>
              {completedOnb ? "다시 만나서 반가워요" : "안녕하세요"}, 소미님
              <span className="wave" role="img" aria-label="hi">👋</span>
            </h1>
            <p className="line2">
              오늘도 이취가 다가오는 일정과 작성 흐름을 같이 정리해드릴게요.
              내 이력과 지원 현황을 기준으로, 이번 주에 챙기면 좋을 준비를 모아뒀어요.
            </p>
            <div className="greet-tags">
              <span className="greet-tag"><span className="sw"/>백엔드</span>
              <span className="greet-tag mint"><span className="sw"/>중고신입 (2년차)</span>
              <span className="greet-tag lav"><span className="sw"/>이직 준비 중</span>
            </div>
          </div>
          <aside className="greet-aside memo-paper">
            <span className="tape mint" style={{top:"-10px", left:"50%", transform:"translateX(-50%) rotate(-4deg)"}}></span>
            <small>오늘의 한 줄</small>
            <div className="memo-copy">
              이번 주는 1차 면접 두 곳,<br/>차근히 준비해봐요.
            </div>
          </aside>
        </section>

        {/* KPIs */}
        <section className="kpi-grid">
          <article className="kpi tone-mint">
            <div className="kpi-head"><span className="lbl">내 작성 이력 완성도</span><span className="ico"><Ico.Layers size={16}/></span></div>
            <div className="kpi-value"><span className="num">72</span><span className="unit">%</span></div>
            <div className="kpi-foot">
              <div className="bar-row mint"><span className="nm">이력서</span><span className="track"><span style={{width:"90%"}}/></span><span className="pct">90</span></div>
              <div className="bar-row"><span className="nm">경력 기술</span><span className="track"><span style={{width:"70%"}}/></span><span className="pct">70</span></div>
              <div className="bar-row peach"><span className="nm">포트폴리오</span><span className="track"><span style={{width:"55%"}}/></span><span className="pct">55</span></div>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-head"><span className="lbl">자소서 작성 수</span><span className="ico"><Ico.FileEdit size={16}/></span></div>
            <div className="kpi-value"><span className="num">14</span><span className="unit">건</span></div>
            <div className="kpi-foot">
              <div className="mini-stats">
                <div className="mini"><span className="k">이번 달</span><span className="v">5<em>건</em></span></div>
                <div className="mini"><span className="k">마스터</span><span className="v">6<em>개</em></span></div>
                <div className="mini"><span className="k">변형본</span><span className="v">14<em>개</em></span></div>
              </div>
            </div>
          </article>

          <article className="kpi tone-lav">
            <div className="kpi-head"><span className="lbl">진행 중인 지원</span><span className="ico"><Ico.Briefcase size={16}/></span></div>
            <div className="kpi-value"><span className="num">7</span><span className="unit">건</span></div>
            <div className="kpi-foot">
              <div className="stage-row">
                <span className="stage doc">서류 <span className="n">3</span></span>
                <span className="stage code">코테 <span className="n">1</span></span>
                <span className="stage int1">1차면접 <span className="n">2</span></span>
                <span className="stage int2">2차면접 <span className="n">1</span></span>
              </div>
            </div>
          </article>
        </section>

        {/* Upcoming + Matching */}
        <section className="dual-grid">
          <section className="panel">
            <div className="panel-head">
              <h2 className="title"><span className="ico"><Ico.Calendar size={16}/></span>다가오는 일정</h2>
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

          <section className="panel">
            <div className="panel-head">
              <h2 className="title lav"><span className="ico"><Ico.Target size={16}/></span>매칭 분석</h2>
              <a className="more" href="#">자세히 <Ico.ArrowRight/></a>
            </div>
            <div className="match-top">
              <div className="match-ring" style={{"--p": 68}}>
                <span><span className="v">68%</span><span className="lbl">매칭률</span></span>
              </div>
              <div className="meta">
                <span className="k">희망 포지션 · 백엔드</span>
                <span className="t">JD 평균 매칭률</span>
                <span className="sub">최근 등록한 채용공고 8건을 기준으로, 이력과 키워드 매칭을 비교했어요.</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span className="badge lav dot">부족 역량 TOP 3</span>
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
          </section>
        </section>

        {/* Shortcuts */}
        <section className="shortcuts">
          <div className="lead">
            <span className="k">SHORTCUTS</span>
            <span className="t">다음 한 걸음, 어디부터 할까요?</span>
          </div>
          <div className="shortcuts-grid">
            <a className="shortcut primary" href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate("cl"); }}>
              <span className="ico"><Ico.Sparkle size={16}/></span>
              <div className="body"><span className="nm">자소서 작성</span><span className="sub">AI 초안 → 수정</span></div>
            </a>
            <a className="shortcut tone-1" href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate("posting"); }}>
              <span className="ico"><Ico.Plus size={16}/></span>
              <div className="body"><span className="nm">채용공고 등록</span><span className="sub">URL · 직접 작성</span></div>
            </a>
            <a className="shortcut tone-2" href="#">
              <span className="ico"><Ico.Building size={16}/></span>
              <div className="body"><span className="nm">기업분석 시작</span><span className="sub">컬처 · 도메인</span></div>
            </a>
            <a className="shortcut tone-3" href="#">
              <span className="ico"><Ico.Calendar size={16}/></span>
              <div className="body"><span className="nm">캘린더 보기</span><span className="sub">월·주·일 일정</span></div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
