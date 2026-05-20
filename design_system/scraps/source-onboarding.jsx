/* =========================================================
   이취 2chi · Onboarding (4-step)
   - Default state: STEP 2 / 4 "경력을 알려주세요"
   - Restrained brand panel (no illustration swarm)
   - Uses tokens from /tokens.css + components from /doc.css
   ========================================================= */

const { useState, useMemo } = React;

/* ---------- Inline Lucide-style icons (2px stroke, round) ---------- */
const Ico = {
  Briefcase: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>
    </svg>
  ),
  Compass: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-2 5-5 2 2-5z"/>
    </svg>
  ),
  Folder: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  Move: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17a8 8 0 0 1 14-5.3"/><path d="M14 8h4v4"/><path d="M20 7a8 8 0 0 1-14 5.3"/><path d="M10 16H6v-4"/>
    </svg>
  ),
  Code: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Server: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><line x1="7" y1="6.5" x2="7.01" y2="6.5"/><line x1="7" y1="17.5" x2="7.01" y2="17.5"/>
    </svg>
  ),
  Cloud: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6 1.4A4 4 0 0 0 7 19z"/>
    </svg>
  ),
  Gear: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  ),
  Layout: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  Layers: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>
    </svg>
  ),
  Chart: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="m7 14 3-3 4 4 5-6"/>
    </svg>
  ),
  Dots: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2={p.dir==="left" ? "11" : "19"} y2="12"/>
      <polyline points={p.dir==="left" ? "11 6 5 12 11 18" : "13 6 19 12 13 18"}/>
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/><path d="M19 3v3M21 5h-3M5 18v3M7 21H4"/>
    </svg>
  ),
  NotebookPen: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M12 11v6M9 14h6"/>
    </svg>
  ),
  FileText: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10.5 17.5l-2 .5.5-2 5-5 1.5 1.5z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||22} height={p.size||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

/* ---------- Data ---------- */
const STEPS = [
  { num: 1, label: "준비 단계" },
  { num: 2, label: "경력 연차" },
  { num: 3, label: "희망 직무" },
  { num: 4, label: "둘러보기" },
];

const PURPOSES = [
  { id: "job",       title: "취업 준비 중",            desc: "첫 직장을 차분히 찾고 있어요",      icon: <Ico.Briefcase/>, tone: "primary" },
  { id: "change",    title: "이직 준비 중",            desc: "더 잘 맞는 곳으로 옮기려 해요",     icon: <Ico.Move/>,      tone: "mint" },
  { id: "portfolio", title: "포트폴리오·자소서 정리 중", desc: "흩어진 기록을 한 번 정리하고 싶어요", icon: <Ico.Folder/>,    tone: "lavender" },
  { id: "explore",   title: "아직 방향을 찾는 중",      desc: "괜찮아요, 천천히 살펴봐도 돼요",    icon: <Ico.Compass/>,   tone: "peach" },
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
  { id: "fe",    name: "Frontend",      desc: "웹·앱 화면 구현",        icon: <Ico.Code/>,   tone: 1 },
  { id: "be",    name: "Backend",       desc: "서버·API·DB",          icon: <Ico.Server/>, tone: 1 },
  { id: "infra", name: "Infra / Cloud", desc: "AWS · GCP · K8s",       icon: <Ico.Cloud/>,  tone: 3 },
  { id: "ops",   name: "DevOps / 운영", desc: "CI·CD · 모니터링",      icon: <Ico.Gear/>,   tone: 3 },
  { id: "uiux",  name: "UI / UX",       desc: "제품·서비스 디자인",    icon: <Ico.Layout/>, tone: 2 },
  { id: "pub",   name: "Publisher",     desc: "퍼블리싱 · 마크업",     icon: <Ico.Layers/>, tone: 2 },
  { id: "data",  name: "Data / AI",     desc: "데이터·ML·분석",        icon: <Ico.Chart/>,  tone: 4 },
  { id: "etc",   name: "기타",          desc: "그 외 직무도 괜찮아요", icon: <Ico.Dots/>,   tone: 4 },
];

const SAMPLES = [
  { kbd: "01", title: "내 경험 정리",         desc: "프로젝트·성과를 PRAR 구조로 차곡차곡", icon: <Ico.NotebookPen/>, tone: 1 },
  { kbd: "02", title: "자소서 초안 생성",     desc: "정리된 경험으로 마스터 자소서 한 벌",  icon: <Ico.FileText/>,    tone: 2 },
  { kbd: "03", title: "채용공고별 맞춤 수정", desc: "공고 키워드에 맞춰 변형본을 만들어요", icon: <Ico.Edit/>,        tone: 3 },
  { kbd: "04", title: "지원 일정 관리",       desc: "서류·코테·면접까지 한 흐름으로",       icon: <Ico.Calendar/>,    tone: 4 },
];

/* ---------- Logo ---------- */
function Logo({ height = 52 }) {
  return (
    <a className="onb-logo-mark" href="#" aria-label="이취 (2chi)">
      <img src="../assets/logo.svg" alt="이취" style={{ height, width: "auto", display: "block" }}/>
    </a>
  );
}

/* ---------- Stepper ---------- */
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

/* ---------- Scene wrapper ---------- */
function Scene({ eyebrow, title, sub, children, sceneKey }) {
  return (
    <div className="onb-scene entering" key={sceneKey}>
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p className="sub">{sub}</p>
      {children}
    </div>
  );
}

/* ---------- Step 1: Purpose ---------- */
function Step1({ selected, onSelect }) {
  return (
    <Scene
      sceneKey="step-1"
      eyebrow="STEP 1 / 4"
      title="지금 어떤 준비를 하고 있나요?"
      sub="처음이라도 괜찮아요. 이취가 준비 흐름을 같이 정리해드릴게요."
    >
      <div className="onb-choice-grid cols-2">
        {PURPOSES.map(p => (
          <button
            key={p.id}
            className={`onb-choice ${selected === p.id ? "selected" : ""}`}
            onClick={() => onSelect(p.id)}
            type="button"
          >
            <div className="icon-wrap" data-tone={p.tone}>{p.icon}</div>
            <div>
              <div className="title">{p.title}</div>
              <div className="desc">{p.desc}</div>
            </div>
            <span className="check"><Ico.Check size={12}/></span>
          </button>
        ))}
      </div>
    </Scene>
  );
}

/* ---------- Step 2: Career ---------- */
function Step2({ selected, onSelect }) {
  return (
    <Scene
      sceneKey="step-2"
      eyebrow="STEP 2 / 4"
      title="경력을 알려주세요"
      sub="맞춤 자소서 흐름과 추천 공고 범위를 정하는 데 사용돼요. 나중에 언제든 바꿀 수 있어요."
    >
      <div className="career-grid">
        {CAREERS.map(c => (
          <button
            key={c.id}
            type="button"
            className={`career-chip ${selected === c.id ? "selected" : ""}`}
            onClick={() => onSelect(c.id)}
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
    </Scene>
  );
}

/* ---------- Step 3: Positions (multi) ---------- */
function Step3({ selected, onToggle }) {
  return (
    <Scene
      sceneKey="step-3"
      eyebrow="STEP 3 / 4"
      title="어떤 직무를 준비하고 있나요?"
      sub="여러 개 선택해도 괜찮아요. 선택한 직무를 기준으로 자소서, 기업분석, 채용공고가 맞춤화돼요."
    >
      <div className="position-grid">
        {POSITIONS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`position-card tone-${p.tone} ${selected.has(p.id) ? "selected" : ""}`}
            onClick={() => onToggle(p.id)}
          >
            <div className="ico">{p.icon}</div>
            <div>
              <div className="name">{p.name}</div>
              <div className="desc">{p.desc}</div>
            </div>
            <span className="check"><Ico.Check size={11}/></span>
          </button>
        ))}
      </div>
      <div className="position-foot">
        <span className="badge info dot">선택됨</span>
        <span className="count">{selected.size}개 직무</span>
      </div>
    </Scene>
  );
}

/* ---------- Step 4: Sample preview ---------- */
function Step4({ purpose, career, positions }) {
  const careerLabel = CAREERS.find(c => c.id === career);
  const positionLabel = [...positions].map(id => POSITIONS.find(p => p.id === id)?.name).filter(Boolean).join(" · ");
  const purposeLabel = PURPOSES.find(p => p.id === purpose)?.title;

  return (
    <Scene
      sceneKey="step-4"
      eyebrow="STEP 4 / 4"
      title="내 경험을 한 번 정리하면,"
      sub="모든 취업 준비가 조금 더 가벼워져요. 알려주신 정보로 이런 흐름이 자동으로 연결돼요."
    >
      <div className="recap">
        <div className="recap-row"><span className="recap-k">준비</span><b>{purposeLabel || "—"}</b></div>
        <div className="recap-divider"/>
        <div className="recap-row"><span className="recap-k">경력</span><b>{careerLabel ? `${careerLabel.num} ${careerLabel.lbl}` : "—"}</b></div>
        <div className="recap-divider"/>
        <div className="recap-row"><span className="recap-k">직무</span><b>{positionLabel || "—"}</b></div>
      </div>

      <div className="sample-grid">
        {SAMPLES.map((s, i) => (
          <div className={`sample-card tone-${s.tone}`} key={s.kbd}>
            <div className="kbd mono">{s.kbd}</div>
            <div className="sample-ico">{s.icon}</div>
            <div className="sample-title">{s.title}</div>
            <div className="sample-desc">{s.desc}</div>
            {i < SAMPLES.length - 1 && <div className="sample-arrow" aria-hidden>→</div>}
          </div>
        ))}
      </div>
    </Scene>
  );
}

/* ---------- App ---------- */
function App() {
  const [current, setCurrent] = useState(1); // 0=Step1, 1=Step2 (default per brief)
  const [purpose, setPurpose] = useState("change");
  const [career, setCareer] = useState("3");
  const [positions, setPositions] = useState(new Set(["be", "infra"]));
  const [welcome, setWelcome] = useState(false);

  const canNext = useMemo(() => {
    if (current === 0) return !!purpose;
    if (current === 1) return !!career;
    if (current === 2) return positions.size > 0;
    return true;
  }, [current, purpose, career, positions]);

  const togglePos = (id) => {
    setPositions(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleNext = () => {
    if (current < STEPS.length - 1) setCurrent(c => c + 1);
    else setWelcome(true);
  };
  const handlePrev = () => setCurrent(c => Math.max(0, c - 1));
  const handleSkip = () => {
    if (current < STEPS.length - 1) setCurrent(c => c + 1);
    else setWelcome(true);
  };

  return (
    <div className="onb-stage">
      {/* LEFT BRAND PANEL */}
      <aside className="onb-left">
        <Logo height={56}/>

        <div className="headline">
          <div className="onb-eyebrow mono">welcome · 환영합니다</div>
          <h1>
            매번 다시 쓰지 않는<br/>
            자소서, <span className="accent">한곳에서</span><br/>
            정리되는 지원 흐름.
          </h1>
          <p className="lead">
            몇 가지만 알려주시면,<br/>
            자소서와 지원 관리를 더 정확하게 도와드릴 수 있어요.
          </p>

          <div className="onb-tip-card">
            <span className="tape lav"/>
            <div className="tip-icon">
              <span className="mascot-cloud sm"><span className="blush"/></span>
            </div>
            <div>
              <h4>4단계, 약 1분이면 끝나요</h4>
              <p>지금 답하지 않아도 괜찮아요. 언제든 <b>내 정보</b>에서 다시 다듬을 수 있어요.</p>
            </div>
          </div>
        </div>

        <div className="onb-foot-meta mono">
          v1 · 2026 Q2 &nbsp;·&nbsp; PC Web First
        </div>
      </aside>

      {/* RIGHT FORM PANEL */}
      <section className="onb-right">
        <Stepper current={current}/>

        {current === 0 && <Step1 selected={purpose} onSelect={setPurpose}/>}
        {current === 1 && <Step2 selected={career} onSelect={setCareer}/>}
        {current === 2 && <Step3 selected={positions} onToggle={togglePos}/>}
        {current === 3 && <Step4 purpose={purpose} career={career} positions={positions}/>}

        <div className="onb-footer">
          <button className="btn ghost" onClick={handlePrev} disabled={current === 0}>
            <Ico.Arrow dir="left"/> 이전
          </button>
          <div className="onb-footer-right">
            <button className="btn ghost skip" onClick={handleSkip}>
              나중에 할게요
            </button>
            {current === STEPS.length - 1 ? (
              <button className="btn primary" onClick={handleNext}>
                시작하기 <Ico.Arrow dir="right"/>
              </button>
            ) : (
              <button className="btn primary" onClick={handleNext} disabled={!canNext}>
                다음 <Ico.Arrow dir="right"/>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Welcome Modal */}
      {welcome && (
        <div className="onb-welcome" onClick={() => setWelcome(false)}>
          <div className="card" onClick={e => e.stopPropagation()}>
            <span className="mascot-cloud lg"><span className="blush"/></span>
            <h3>준비 다 됐어요!</h3>
            <p>이제 김소미님의 흐름에 맞춰<br/>자소서·기업분석·지원 일정을 함께 정리해드릴게요.</p>
            <div className="summary">
              <div className="row"><b>준비</b><span>{PURPOSES.find(p => p.id === purpose)?.title || "—"}</span></div>
              <div className="row"><b>경력</b><span>{(() => { const c = CAREERS.find(c => c.id === career); return c ? `${c.num} ${c.lbl}` : "—"; })()}</span></div>
              <div className="row"><b>직무</b><span>{[...positions].map(id => POSITIONS.find(p => p.id === id)?.name).filter(Boolean).join(" · ") || "—"}</span></div>
            </div>
            <button className="btn primary lg" style={{ width: "100%" }} onClick={() => setWelcome(false)}>대시보드로 이동</button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
