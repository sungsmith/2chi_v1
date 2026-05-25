/* =========================================================
   2chi · Web UI Kit — 지원 현황 cluster (Applications)
   sidebar: 캘린더 / 칸반 대시보드 / 히스토리
========================================================= */

const AP_NAV = [
  { id: "calendar", label: "캘린더" },
  { id: "kanban",   label: "대시보드", pill: "7", pillTitle: "전형 진행중 지원 수 (합격·불합격·휴지통 제외)" },
  { id: "history",  label: "히스토리" },
];

function ApSideNav({ active, onSelect }) {
  return (
    <aside className="side-nav">
      <div className="crumb">지원 현황</div>
      {AP_NAV.map(it => (
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

const STAGE_LEGEND = (
  <section className="stage-legend">
    <span className="item"><span className="dot doc"/>서류</span>
    <span className="item"><span className="dot code"/>코딩테스트</span>
    <span className="item"><span className="dot int1"/>1차면접</span>
    <span className="item"><span className="dot int2"/>2차면접</span>
    <span className="item"><span className="dot exec"/>임원면접</span>
    <span className="item"><span className="dot ok"/>합격</span>
    <span className="item"><span className="dot fail"/>불합격</span>
  </section>
);

/* ============================================================
   캘린더 (월 view default)
============================================================ */
const CAL_EVENTS = {
  8:  [{ stage: "doc",  time: "23:59", title: "쿠팡 서류마감" }],
  10: [
    { stage: "int1", time: "14:00", title: "(주)테크컴퍼니 1차" },
    { stage: "code", time: "10:00", title: "네이버 코딩" },
  ],
  11: [{ stage: "code", time: "10:00", title: "네이버 코딩" }],
  12: [{ stage: "doc",  time: "23:59", title: "카카오 서류마감" }],
  14: [{ stage: "exec", time: "16:00", title: "토스 임원면접" }],
  17: [{ stage: "int2", time: "11:00", title: "토스 2차" }],
  19: [{ stage: "doc",  time: "23:59", title: "당근 서류마감" }],
  22: [
    { stage: "int1", time: "15:00", title: "쿠팡 1차" },
    { stage: "int1", time: "10:00", title: "라인 1차" },
    { stage: "code", time: "13:00", title: "배민 코딩" },
  ],
  27: [{ stage: "int2", time: "14:00", title: "(주)테크 2차" }],
  31: [{ stage: "doc",  time: "23:59", title: "(주)테크 서류마감" }],
};

function CalendarView() {
  const [view, setView] = useState("month");
  const [openEvt, setOpenEvt] = useState(null);
  const dows = ["일", "월", "화", "수", "목", "금", "토"];

  const fireEvent = (evt) => setOpenEvt(evt);

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>캘린더</h1>
          <div className="sub">전형 단계별 색상으로 일정을 한눈에 확인하세요.</div>
        </div>
        <div className="actions">
          <button className="btn secondary sm"><Ico.Plus size={12}/> 일정 추가</button>
        </div>
      </section>

      {STAGE_LEGEND}

      <section className="cal-card">
        <div className="cal-toolbar">
          <span className="month">
            {view === "year"  && "2026년"}
            {view === "month" && "2026년 5월"}
            {view === "week"  && "2026년 5월 10일 — 16일"}
            {view === "day"   && "2026년 5월 12일 (화)"}
            <span className="today">오늘 5월 12일</span>
          </span>
          <div className="nav">
            <button aria-label="이전"><Ico.ArrowLeft size={12}/></button>
            <button aria-label="다음"><Ico.ArrowRight size={12}/></button>
          </div>
          <div className="right">
            <button className="btn ghost sm"><Ico.Refresh size={12}/> 오늘</button>
            <div className="seg">
              <button className={view === "year"  ? "active" : ""} onClick={() => setView("year")}>연</button>
              <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>월</button>
              <button className={view === "week"  ? "active" : ""} onClick={() => setView("week")}>주</button>
              <button className={view === "day"   ? "active" : ""} onClick={() => setView("day")}>일</button>
            </div>
          </div>
        </div>

        {view === "month" && <CalendarMonth dows={dows} onOpenEvt={fireEvent}/>}
        {view === "year"  && <CalendarYear/>}
        {view === "week"  && <CalendarWeek onOpenEvt={fireEvent}/>}
        {view === "day"   && <CalendarDay onOpenEvt={fireEvent}/>}
      </section>

      {openEvt && <EventDetailModal evt={openEvt} onClose={() => setOpenEvt(null)}/>}
    </>
  );
}

function EventDetailModal({ evt, onClose }) {
  const stageLabels = { doc: "서류", code: "코딩테스트", int1: "1차면접", int2: "2차면접", exec: "임원면접" };
  return (
    <div className="cal-evt-modal-backdrop" onClick={onClose}>
      <div className="cal-evt-modal" onClick={e => e.stopPropagation()}>
        <header className="head">
          <span className={"stage-badge " + evt.stage}>
            <span className="dot"/>{stageLabels[evt.stage] || evt.stage}
          </span>
          <div className="title-block">
            <h3 className="ttl">{evt.title}</h3>
            <div className="meta">
              <span className="co">{evt.company || "(주)테크컴퍼니"}</span>
              <span className="sep"/>
              <span>{evt.dateLabel || "2026.05.12 (화)"}</span>
              <span className="sep"/>
              <span>{evt.time}</span>
            </div>
          </div>
          <button className="close" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </header>

        <div className="body">
          <div className="field-row">
            <span className="k"><Ico.Calendar size={12}/> 일정</span>
            <span className="v">{evt.dateLabel || "2026.05.12 (화)"} · {evt.time}</span>
          </div>
          <div className="field-row">
            <span className="k"><Ico.Building size={12}/> 회사</span>
            <span className="v">{evt.company || "(주)테크컴퍼니"} · {evt.position || "백엔드 (경력 2~5년)"}</span>
          </div>
          <div className="field-row">
            <span className="k"><Ico.Layers size={12}/> 전형</span>
            <span className="v">{stageLabels[evt.stage] || evt.stage} · {evt.method || "온라인 (Google Meet)"}</span>
          </div>
          <div className="field-row">
            <span className="k"><Ico.Link size={12}/> 연결</span>
            <span className="v">
              <a className="link" href="#">자소서 보기 <Ico.ArrowRight size={11}/></a>
              <span style={{margin:"0 6px",color:"var(--color-text-disabled)"}}>·</span>
              <a className="link" href="#">채용공고 보기 <Ico.ArrowRight size={11}/></a>
            </span>
          </div>
          <div className="note">
            <span className="note-ttl">메모</span>
            PRAR 답변 한 번 더 점검. 결제·정산 도메인 경험을 가장 위로 배치. 면접관은 백엔드 리드 1명 + 팀장 1명 예정.
          </div>
        </div>

        <footer className="foot">
          <div className="left">
            <button className="btn-danger">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-1px",marginRight:3}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              삭제
            </button>
          </div>
          <div className="right">
            <button className="btn secondary sm">결과 입력</button>
            <button className="btn primary sm"><Ico.Edit size={12}/> 편집</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CalendarMonth({ dows, onOpenEvt }) {
  const totalCells = 42;
  const monthStartDow = 5;
  const monthDays = 31;
  const prevMonthDays = 30;
  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayInMonth = i - monthStartDow + 1;
    if (dayInMonth < 1) cells.push({ num: prevMonthDays + dayInMonth, mute: true, dow: i % 7 });
    else if (dayInMonth > monthDays) cells.push({ num: dayInMonth - monthDays, mute: true, dow: i % 7 });
    else cells.push({ num: dayInMonth, mute: false, dow: i % 7, today: dayInMonth === 12 });
  }
  return (
    <div className="cal-grid">
      {dows.map((d, i) => <div key={d} className={"cal-dow" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>{d}</div>)}
      {cells.map((c, i) => {
        const events = !c.mute ? CAL_EVENTS[c.num] : null;
        return (
          <div key={i} className={"cal-day" + (c.mute ? " mute" : "") + (c.today ? " today" : "")}>
            <span className={"num" + (c.dow === 0 ? " sun" : c.dow === 6 ? " sat" : "")}>{c.num}</span>
            {events && events.slice(0, 2).map((e, idx) => (
              <div
                key={idx}
                className={"cal-evt " + e.stage}
                onClick={() => onOpenEvt && onOpenEvt({ ...e, dateLabel: `2026.05.${String(c.num).padStart(2,"0")}` })}
              >
                <span className="time">{e.time}</span>
                <span>{e.title}</span>
              </div>
            ))}
            {events && events.length > 2 && (
              <div className="cal-evt more">+ {events.length - 2}건 더보기</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----- 연 view ----- */
function CalendarYear() {
  const monthInfo = [
    { name: "1월",  start: 4, days: 31, prev: 31, hasToday: false, evts: [12, 25] },
    { name: "2월",  start: 0, days: 28, prev: 31, hasToday: false, evts: [9, 14, 22] },
    { name: "3월",  start: 0, days: 31, prev: 28, hasToday: false, evts: [3, 17, 28] },
    { name: "4월",  start: 3, days: 30, prev: 31, hasToday: false, evts: [4, 12, 18, 25] },
    { name: "5월",  start: 5, days: 31, prev: 30, hasToday: true,  today: 12, evts: [8, 10, 11, 12, 14, 17, 19, 22, 27, 31], busy: [22] },
    { name: "6월",  start: 1, days: 30, prev: 31, hasToday: false, evts: [3, 15, 26] },
    { name: "7월",  start: 3, days: 31, prev: 30, hasToday: false, evts: [10, 18] },
    { name: "8월",  start: 6, days: 31, prev: 31, hasToday: false, evts: [4, 19, 24] },
    { name: "9월",  start: 2, days: 30, prev: 31, hasToday: false, evts: [7, 14, 22] },
    { name: "10월", start: 4, days: 31, prev: 30, hasToday: false, evts: [2, 16, 24] },
    { name: "11월", start: 0, days: 30, prev: 31, hasToday: false, evts: [5, 19] },
    { name: "12월", start: 2, days: 31, prev: 30, hasToday: false, evts: [10, 18, 24] },
  ];
  const dowsShort = ["일","월","화","수","목","금","토"];
  return (
    <div className="cal-year">
      {monthInfo.map((m, idx) => {
        const cells = [];
        for (let i = 0; i < 42; i++) {
          const d = i - m.start + 1;
          if (d < 1)         cells.push({ num: m.prev + d, mute: true });
          else if (d > m.days) cells.push({ num: d - m.days, mute: true });
          else                cells.push({ num: d, mute: false, today: m.hasToday && d === m.today, evt: m.evts.includes(d), busy: m.busy && m.busy.includes(d) });
        }
        return (
          <div key={idx} className={"cal-yr-month" + (m.hasToday ? " current" : "")}>
            <div className="nm">
              <span>{m.name}</span>
              <span className="cnt">{m.evts.length}건</span>
            </div>
            <div className="cal-yr-grid">
              {dowsShort.map((d, i) => (
                <span key={d} className={"dow" + (i === 0 ? " sun" : "")}>{d}</span>
              ))}
              {cells.map((c, i) => (
                <span key={i} className={"d" + (c.mute ? " mute" : "") + (c.today ? " today" : "") + (c.evt ? " has-evt" : "") + (c.busy ? " busy" : "")}>
                  {c.num}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----- 주 view ----- */
function CalendarWeek({ onOpenEvt }) {
  const dows = ["일","월","화","수","목","금","토"];
  const dates = [10, 11, 12, 13, 14, 15, 16];
  // Each event: dow (0-6), startHour (decimal), durationH, stage, title, time-label
  const events = [
    { dow: 1, start: 10,    dur: 2,   stage: "code", title: "네이버 코딩테스트",     time: "10:00 – 12:00" },
    { dow: 2, start: 14,    dur: 1.5, stage: "int1", title: "(주)테크컴퍼니 1차",    time: "14:00 – 15:30" },
    { dow: 3, start: 23.98, dur: 0.5, stage: "doc",  title: "카카오 서류마감",       time: "23:59" },
    { dow: 5, start: 16,    dur: 1.5, stage: "exec", title: "토스 임원면접",         time: "16:00 – 17:30" },
    { dow: 1, start: 18.5,  dur: 1,   stage: "int2", title: "사전 면접 스터디",       time: "18:30 – 19:30" },
  ];
  const dayStart = 9;
  const hours = Array.from({ length: 14 }, (_, i) => dayStart + i); // 9 → 22
  const cellHeight = 48; // px per hour
  return (
    <div className="cal-week">
      <div className="cal-week-head">
        <div className="corner"/>
        {dows.map((d, i) => (
          <div key={d} className={"col-h" + (i === 0 ? " sun" : i === 6 ? " sat" : "") + (i === 2 ? " today" : "")}>
            <span className="dow">{d}</span>
            <span className="dd">{dates[i]}</span>
          </div>
        ))}
      </div>
      <div className="cal-week-grid">
        <div className="time-col">
          {hours.map(h => <div key={h} className="time-cell">{String(h).padStart(2,"0")}:00</div>)}
        </div>
        {dows.map((d, i) => (
          <div key={i} className={"cal-week-day" + (i === 2 ? " today" : "")} style={{ height: hours.length * cellHeight }}>
            {events.filter(e => e.dow === i).map((e, idx) => {
              const top = (e.start - dayStart) * cellHeight;
              const height = Math.max(28, e.dur * cellHeight - 4);
              return (
                <div
                  key={idx}
                  className={"evt " + e.stage}
                  style={{ top, height }}
                  onClick={() => onOpenEvt && onOpenEvt({ ...e, dateLabel: `2026.05.${10 + e.dow} (${["일","월","화","수","목","금","토"][e.dow]})` })}
                >
                  <span className="time">{e.time}</span>
                  <span className="ttl">{e.title}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----- 일 view ----- */
function CalendarDay({ onOpenEvt }) {
  // 5/12 (수) — 오늘
  const events = [
    { start: 10,   dur: 1,   stage: "doc",  title: "카카오 자소서 마무리 작성", meta: "혼자 작업 · 매칭률 72%", time: "10:00 – 11:00" },
    { start: 14,   dur: 1.5, stage: "int1", title: "(주)테크컴퍼니 1차 면접 준비", meta: "PRAR 답변 정리 · 모의 면접 30분 포함", time: "14:00 – 15:30" },
    { start: 19,   dur: 1.5, stage: "code", title: "네이버 코딩테스트 모의 풀이", meta: "실전 대비 · 알고리즘 2문항", time: "19:00 – 20:30" },
    { start: 23.5, dur: 0.5, stage: "doc",  title: "카카오 서류 제출 마감", meta: "23:59까지 제출", time: "23:59" },
  ];
  const dayStart = 9;
  const hours = Array.from({ length: 16 }, (_, i) => dayStart + i); // 9 → 24
  const cellHeight = 48;
  return (
    <div className="cal-day-view">
      <div className="cal-day-main">
        <div className="cal-day-head">
          <span className="dd">12</span>
          <span className="nm">2026년 5월 화요일</span>
          <span className="badge">오늘 · 일정 4건</span>
        </div>
        <div className="cal-day-grid">
          <div className="time-col">
            {hours.map(h => <div key={h} className="time-cell">{String(h % 24).padStart(2,"0")}:00</div>)}
          </div>
          <div className="cal-day-track" style={{ height: hours.length * cellHeight }}>
            {events.map((e, idx) => {
              const top = (e.start - dayStart) * cellHeight;
              const height = Math.max(60, e.dur * cellHeight - 6);
              return (
                <div
                  key={idx}
                  className={"evt " + e.stage}
                  style={{ top, height }}
                  onClick={() => onOpenEvt && onOpenEvt({ ...e, dateLabel: "2026.05.12 (화)" })}
                >
                  <span className="time">{e.time}</span>
                  <span className="ttl">{e.title}</span>
                  <span className="meta">{e.meta}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="cal-day-rail">
        <span className="ttl">오늘의 요약</span>
        <div className="summary">
          <div className="row"><span className="k">일정</span><span className="v">4건</span></div>
          <div className="row"><span className="k">중요 마감</span><span className="v" style={{color:"var(--color-pink-500)"}}>1건</span></div>
          <div className="row"><span className="k">면접 준비</span><span className="v">1.5시간</span></div>
          <div className="row"><span className="k">자소서 작성</span><span className="v">1시간</span></div>
        </div>
        <span className="ttl">체크리스트</span>
        <div className="checklist">
          <div className="check-item on"><span className="box"><Ico.Check size={10}/></span><span className="label">아침 09:00 — 일정 검토</span></div>
          <div className="check-item on"><span className="box"><Ico.Check size={10}/></span><span className="label">카카오 공고 키워드 재확인</span></div>
          <div className="check-item"><span className="box"/><span className="label">PRAR 답변 한 번 더 읽기</span></div>
          <div className="check-item"><span className="box"/><span className="label">코딩테스트 알고리즘 워밍업</span></div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   칸반 대시보드
============================================================ */
const KAN_COLS = [
  { id: "doc",  label: "서류",      count: 3, items: [
    { co: "(주)테크컴퍼니", pos: "백엔드 (경력 2~5년)", dday: "D-19", added: "5일 전" },
    { co: "쿠팡",          pos: "백엔드 (라스트마일)", dday: "D-14", added: "1주 전" },
    { co: "당근",          pos: "Server Engineer · 결제", dday: "D-7", soon: true, added: "오늘" },
  ]},
  { id: "code", label: "코딩테스트", count: 1, items: [
    { co: "네이버", pos: "백엔드 신입 / 주니어", dday: "D-3", soon: true, added: "내일 10:00" },
  ]},
  { id: "int1", label: "1차면접",    count: 2, items: [
    { co: "(주)테크컴퍼니", pos: "백엔드 (경력 2~5년)", dday: "D-2", soon: true, added: "5/10 14:00" },
    { co: "라인",          pos: "Server Engineer",  dday: "D-12", added: "5/22 10:00" },
  ]},
  { id: "int2", label: "2차면접",    count: 1, items: [
    { co: "토스", pos: "Server Engineer", dday: "D-7", soon: true, added: "5/17 11:00" },
  ]},
  { id: "exec", label: "임원면접",   count: 1, items: [
    { co: "토스", pos: "Server Engineer", dday: "D-4", soon: true, added: "5/14 16:00" },
  ]},
];

function KanbanView() {
  return (
    <>
      <section className="ap-head">
        <div>
          <h1>지원 대시보드</h1>
          <div className="sub">전형 단계별로 진행 중인 지원을 한눈에. 카드를 드래그해 단계를 이동할 수 있어요.</div>
        </div>
        <div className="actions">
          <button className="btn secondary sm"><Ico.Plus size={12}/> 지원 추가</button>
        </div>
      </section>

      {STAGE_LEGEND}

      <div className="kanban">
        {KAN_COLS.map(col => (
          <div key={col.id} className="kanban-col">
            <div className="kanban-col-head">
              <span className="nm"><span className={"dot " + col.id}/>{col.label}</span>
              <span className="count">{col.count}</span>
            </div>
            {col.items.map((it, i) => (
              <article key={i} className="kan-card">
                <div className="row1">
                  <span className="co">{it.co}</span>
                  <span className={"dday-pill" + (it.soon ? "" : " cool")}>{it.dday}</span>
                </div>
                <div className="pos">{it.pos}</div>
                <div className="meta"><span>{it.added}</span></div>
              </article>
            ))}
            <button className="kan-add"><Ico.Plus size={11}/>지원 추가</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   히스토리 (변경 로그)
============================================================ */
function HistoryRow({ time, icon, iconTone, msg, actor }) {
  return (
    <div className="history-row">
      <span className="time">{time}</span>
      <span className={"icon " + (iconTone || "")}>{icon}</span>
      <div className="body">
        <div className="msg">{msg}</div>
      </div>
      <span className="actor">{actor}</span>
    </div>
  );
}

function HistoryView() {
  return (
    <>
      <section className="ap-head">
        <div>
          <h1>히스토리</h1>
          <div className="sub">지원 일정 · 전형 단계 · 결과의 모든 변경 로그를 시간 역순으로 보여드려요.</div>
        </div>
        <div className="actions">
          <button className="btn ghost sm"><Ico.Search size={12}/> 검색</button>
          <button className="btn secondary sm"><Ico.Download size={12}/> 내보내기</button>
        </div>
      </section>

      <section className="history">
        <div className="history-day">2026.05.12 (수) · 오늘<span className="count">3</span></div>
        <HistoryRow
          time="17:32"
          icon={<Ico.Check size={14}/>}
          iconTone="ok"
          msg={<><b>(주)테크컴퍼니 · 백엔드</b><span className="stage-from">서류</span><Ico.ArrowRight size={11}/><span className="stage-to">1차면접</span>로 변경됐어요.</>}
          actor="시스템 · 면접 일정 등록"
        />
        <HistoryRow
          time="14:08"
          icon={<Ico.FileEdit size={14}/>}
          msg={<><b>카카오 X 결제·정산 백엔드</b> 자소서가 저장됐어요. 3건 표현이 검토 대상으로 표시됨.</>}
          actor="김소미"
        />
        <HistoryRow
          time="09:01"
          icon={<Ico.Bell size={14}/>}
          iconTone="warn"
          msg={<><b>카카오 백엔드 (Saas 팀)</b> 서류 마감이 <span className="stage-to">D-3</span>으로 가까워졌어요.</>}
          actor="시스템 · 알림"
        />

        <div className="history-day">2026.05.11 (화)<span className="count">2</span></div>
        <HistoryRow
          time="20:14"
          icon={<Ico.Sparkle size={14}/>}
          iconTone="ok"
          msg={<><b>네이버 신입 백엔드</b> AI 초안 생성 완료 — 매칭률 <b>81%</b>로 측정됐어요.</>}
          actor="AI · 자소서 초안"
        />
        <HistoryRow
          time="11:42"
          icon={<Ico.Plus size={14}/>}
          msg={<><b>쿠팡 백엔드 (라스트마일)</b> 공고를 등록했어요. 자소서 매칭률 70%.</>}
          actor="김소미"
        />

        <div className="history-day">2026.05.09 (일)<span className="count">1</span></div>
        <HistoryRow
          time="22:01"
          icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>}
          iconTone="fail"
          msg={<><b>당근 Server Engineer · 결제</b>가 <span className="stage-from">1차면접</span><Ico.ArrowRight size={11}/><span className="stage-to">불합격</span>으로 변경됐어요.</>}
          actor="김소미 · 결과 입력"
        />
      </section>
    </>
  );
}

/* ============================================================
   ROUTER
============================================================ */
function ApplicationsScreen() {
  const [active, setActive] = useState("calendar");
  return (
    <div className="ap-shell">
      <ApSideNav active={active} onSelect={setActive}/>
      <div className="ap-main">
        {active === "calendar" && <CalendarView/>}
        {active === "kanban"   && <KanbanView/>}
        {active === "history"  && <HistoryView/>}
      </div>
    </div>
  );
}

Object.assign(window, { ApplicationsScreen });
