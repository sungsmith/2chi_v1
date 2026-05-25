/* =========================================================
   2chi · Web UI Kit — Onboarding screen
   4-step flow with split-screen brand panel + form panel.
========================================================= */

const STEPS = [
  { num: 1, label: "준비 단계" },
  { num: 2, label: "경력 연차" },
  { num: 3, label: "희망 직무" },
  { num: 4, label: "둘러보기" },
];

const PURPOSES = [
  { id: "job",       title: "취업 준비 중",              desc: "첫 직장을 차분히 찾고 있어요",        Ico: () => <Ico.Briefcase size={22}/>, tone: "primary" },
  { id: "change",    title: "이직 준비 중",              desc: "더 잘 맞는 곳으로 옮기려 해요",       Ico: () => <Ico.Move size={22}/>,      tone: "mint" },
  { id: "portfolio", title: "포트폴리오·자소서 정리 중", desc: "흩어진 기록을 한 번 정리하고 싶어요", Ico: () => <Ico.Folder size={22}/>,    tone: "lavender" },
  { id: "explore",   title: "아직 방향을 찾는 중",       desc: "괜찮아요, 천천히 살펴봐도 돼요",      Ico: () => <Ico.Compass size={22}/>,   tone: "peach" },
];

const CAREERS = [
  { id: "0",  num: "신입", lbl: "0년"  },
  { id: "1",  num: "1",   lbl: "년차" },
  { id: "2",  num: "2",   lbl: "년차" },
  { id: "3",  num: "3",   lbl: "년차" },
  { id: "4",  num: "4",   lbl: "년차" },
  { id: "5",  num: "5",   lbl: "년차" },
  { id: "6",  num: "6",   lbl: "년차" },
  { id: "7+", num: "7+",  lbl: "년차 이상" },
];

const POSITIONS = [
  { id: "fe",    name: "Frontend",      desc: "웹·앱 화면 구현",     Ico: () => <Ico.Code size={20}/>,   tone: 1 },
  { id: "be",    name: "Backend",       desc: "서버·API·DB",         Ico: () => <Ico.Server size={20}/>, tone: 1 },
  { id: "infra", name: "Infra / Cloud", desc: "AWS · GCP · K8s",     Ico: () => <Ico.Cloud size={20}/>,  tone: 3 },
  { id: "ops",   name: "DevOps / 운영", desc: "CI·CD · 모니터링",    Ico: () => <Ico.Gear size={20}/>,   tone: 3 },
  { id: "uiux",  name: "UI / UX",       desc: "제품·서비스 디자인",  Ico: () => <Ico.Layout size={20}/>, tone: 2 },
  { id: "etc",   name: "기타",          desc: "그 외 직무도 OK",     Ico: () => <Ico.Dots size={20}/>,   tone: 4 },
];

function Stepper({ current }) {
  return (
    <div className="onb-stepper">
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div key={s.num} className={`onb-step-pill ${state}`}>
            <div className="bar"/>
            <div className="meta">
              <span className="num">{i < current ? <Ico.Check size={10}/> : s.num}</span>
              <span>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OnboardingScreen({ onComplete }) {
  const [current, setCurrent]   = useState(1);
  const [purpose, setPurpose]   = useState("change");
  const [career, setCareer]     = useState("3");
  const [positions, setPos]     = useState(new Set(["be", "infra"]));
  const [welcome, setWelcome]   = useState(false);

  const canNext = (() => {
    if (current === 0) return !!purpose;
    if (current === 1) return !!career;
    if (current === 2) return positions.size > 0;
    return true;
  })();

  const togglePos = (id) => {
    setPos(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleNext = () => {
    if (current < STEPS.length - 1) setCurrent(c => c + 1);
    else setWelcome(true);
  };

  return (
    <div className="onb-stage">
      <aside className="onb-left">
        <div className="onb-logo">
          <img src="../../assets/logo.svg" alt="이취 (2chi)"/>
        </div>

        <div className="onb-headline">
          <div className="onb-eyebrow">welcome · 환영합니다</div>
          <h1>
            매번 다시 쓰지 않는<br/>
            자소서, <span className="accent">한곳에서</span><br/>
            정리되는 지원 흐름.
          </h1>
          <p className="lead">
            몇 가지만 알려주시면,<br/>
            자소서와 지원 관리를 더 정확하게 도와드릴 수 있어요.
          </p>

          <div className="onb-tip">
            <span className="mascot-cloud wave" aria-hidden="true"/>
            <div className="tip-body">
              <h4>4단계, 약 1분이면 끝나요</h4>
              <p>지금 답하지 않아도 괜찮아요. 언제든 <b>내 정보</b>에서 다시 다듬을 수 있어요.</p>
            </div>
          </div>
        </div>

        <div className="onb-foot-meta">v1 · 2026 Q2 · PC WEB FIRST</div>
      </aside>

      <section className="onb-right">
        <Stepper current={current}/>

        {current === 0 && (
          <div className="onb-scene">
            <div className="eyebrow">STEP 1 / 4</div>
            <h2>지금 어떤 준비를 하고 있나요?</h2>
            <p className="sub">처음이라도 괜찮아요. 이취가 준비 흐름을 같이 정리해드릴게요.</p>
            <div className="onb-choice-grid">
              {PURPOSES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  data-tone={p.tone}
                  className={"onb-choice" + (purpose === p.id ? " selected" : "")}
                  onClick={() => setPurpose(p.id)}
                >
                  <span className="icon-wrap"><p.Ico/></span>
                  <span>
                    <span className="title">{p.title}</span>
                    <span className="desc">{p.desc}</span>
                  </span>
                  <span className="check"><Ico.Check size={12}/></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {current === 1 && (
          <div className="onb-scene">
            <div className="eyebrow">STEP 2 / 4</div>
            <h2>경력을 알려주세요</h2>
            <p className="sub">맞춤 자소서 흐름과 추천 공고 범위를 정하는 데 사용돼요. 나중에 언제든 바꿀 수 있어요.</p>
            <div className="career-grid">
              {CAREERS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={"career-chip" + (career === c.id ? " selected" : "")}
                  onClick={() => setCareer(c.id)}
                >
                  <div className="num">{c.num}</div>
                  <div className="lbl">{c.lbl}</div>
                </button>
              ))}
            </div>
            <div className="career-note">
              <Ico.Sparkle size={14}/>
              <span>경력을 선택하면, 신입 / 주니어 / 시니어에 맞는 자소서 톤이 자동으로 조정돼요.</span>
            </div>
          </div>
        )}

        {current === 2 && (
          <div className="onb-scene">
            <div className="eyebrow">STEP 3 / 4</div>
            <h2>어떤 직무를 준비하고 있나요?</h2>
            <p className="sub">여러 개 선택해도 괜찮아요. 선택한 직무를 기준으로 자소서, 기업분석, 채용공고가 맞춤화돼요.</p>
            <div className="position-grid">
              {POSITIONS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`position-card tone-${p.tone}` + (positions.has(p.id) ? " selected" : "")}
                  onClick={() => togglePos(p.id)}
                >
                  <span className="ico"><p.Ico/></span>
                  <span>
                    <span className="name">{p.name}</span>
                    <span className="desc">{p.desc}</span>
                  </span>
                  <span className="check"><Ico.Check size={11}/></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {current === 3 && (
          <div className="onb-scene">
            <div className="eyebrow">STEP 4 / 4</div>
            <h2>내 경험을 한 번 정리하면,</h2>
            <p className="sub">모든 취업 준비가 조금 더 가벼워져요. 알려주신 정보로 이런 흐름이 자동으로 연결돼요.</p>
            <div className="position-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="position-card tone-1"><span className="ico"><Ico.FileEdit size={20}/></span><span><span className="name">내 경험 정리</span><span className="desc">PRAR로 차곡차곡</span></span><span/></div>
              <div className="position-card tone-2"><span className="ico"><Ico.Sparkle size={20}/></span><span><span className="name">자소서 초안 생성</span><span className="desc">마스터 자소서 한 벌</span></span><span/></div>
              <div className="position-card tone-3"><span className="ico"><Ico.Edit size={20}/></span><span><span className="name">공고별 맞춤 수정</span><span className="desc">키워드별 변형본</span></span><span/></div>
              <div className="position-card tone-4"><span className="ico"><Ico.Calendar size={20}/></span><span><span className="name">지원 일정 관리</span><span className="desc">서류 → 면접까지</span></span><span/></div>
            </div>
          </div>
        )}

        <div className="onb-footer">
          <button className="btn ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
            <Ico.ArrowLeft/> 이전
          </button>
          <div className="onb-footer-right">
            <button className="btn ghost skip" onClick={handleNext}>나중에 할게요</button>
            <button className="btn primary" onClick={handleNext} disabled={!canNext}>
              {current === STEPS.length - 1 ? "시작하기" : "다음"}
              <Ico.ArrowRight/>
            </button>
          </div>
        </div>
      </section>

      {welcome && (
        <div className="onb-welcome" onClick={() => { setWelcome(false); onComplete && onComplete(); }}>
          <div className="card" onClick={e => e.stopPropagation()}>
            <span className="mascot-cloud lg happy"/>
            <h3>준비 다 됐어요!</h3>
            <p>이제 김소미님의 흐름에 맞춰<br/>자소서·기업분석·지원 일정을 함께 정리해드릴게요.</p>
            <div className="summary">
              <div className="row"><b>준비</b><span>{PURPOSES.find(p => p.id === purpose)?.title}</span></div>
              <div className="row"><b>경력</b><span>{(() => { const c = CAREERS.find(x => x.id === career); return c ? `${c.num} ${c.lbl}` : "—"; })()}</span></div>
              <div className="row"><b>직무</b><span>{[...positions].map(id => POSITIONS.find(p => p.id === id)?.name).join(" · ")}</span></div>
            </div>
            <button className="btn primary lg" style={{ width: "100%" }} onClick={() => { setWelcome(false); onComplete && onComplete(); }}>
              대시보드로 이동 <Ico.ArrowRight/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { OnboardingScreen });
