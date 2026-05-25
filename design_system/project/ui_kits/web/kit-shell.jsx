/* =========================================================
   2chi · Web UI Kit — top nav + app shell
========================================================= */

const { useState, useEffect, useRef } = React;

const NAV_MENUS = [
  { id: "home", label: "대시보드" },
  { id: "me",   label: "내 정보" },
  { id: "apps", label: "지원 현황" },
  { id: "job",  label: "이직 / 취업" },
  { id: "co",   label: "기업" },
];

const NOTI_PREVIEW = [
  { tone: "pink", icon: "bell",   ttl: "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요",
    desc: "D-day · 매칭률 72%", time: "09:00", unread: true },
  { tone: "mint", icon: "check",  ttl: "(주)테크컴퍼니 1차면접 일정이 등록됐어요",
    desc: "D-2 · 5/14 14:00 · 온라인", time: "17:32", unread: true },
  { tone: "lav",  icon: "sparkle", ttl: "AI가 카카오 공고 매칭 결과를 정리했어요",
    desc: "매칭률 72% · 부족 키워드 3건", time: "14:08", unread: true },
  { tone: "mint", icon: "edit",   ttl: "네이버 신입 백엔드 자소서가 저장됐어요",
    desc: "매칭률 81% · 검토 표시 3건", time: "어제", unread: false },
];

function useClickAway(ref, onAway) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onAway();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onAway]);
}

function NotiDropdown({ onClose, onOpenCenter }) {
  const renderIcon = (k) => {
    if (k === "bell")    return <Ico.Bell size={14}/>;
    if (k === "check")   return <Ico.Check size={14}/>;
    if (k === "sparkle") return <Ico.Sparkle size={14}/>;
    if (k === "edit")    return <Ico.FileEdit size={14}/>;
    return <Ico.Bell size={14}/>;
  };
  return (
    <div className="nav-dropdown noti-dropdown" onClick={e => e.stopPropagation()}>
      <div className="dropdown-head">
        <span className="ttl">알림 <span className="badge">3</span></span>
        <button className="link-btn">모두 읽음</button>
      </div>
      <div className="noti-mini-list">
        {NOTI_PREVIEW.map((n, i) => (
          <button
            key={i}
            type="button"
            className={"noti-mini" + (n.unread ? " unread" : "")}
            onClick={() => { onOpenCenter && onOpenCenter(); onClose(); }}
          >
            <span className={"ico " + n.tone}>{renderIcon(n.icon)}</span>
            <span className="body">
              <span className="ttl">{n.ttl}</span>
              <span className="desc">{n.desc}</span>
            </span>
            <span className="time">{n.time}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="dropdown-foot"
        onClick={() => { onOpenCenter && onOpenCenter(); onClose(); }}
      >
        알림 센터 전체 보기 <Ico.ArrowRight size={11}/>
      </button>
    </div>
  );
}

function ProfileDropdown({ onClose, onNavigate }) {
  return (
    <div className="nav-dropdown profile-dropdown" onClick={e => e.stopPropagation()}>
      <div className="profile-card">
        <span className="avatar lg">소</span>
        <div className="profile-info">
          <div className="nm">김소미</div>
          <div className="email">somi.kim@example.com</div>
          <div className="tags">
            <span className="tag">백엔드</span>
            <span className="tag">중고신입 2년차</span>
          </div>
        </div>
      </div>
      <div className="dropdown-section">
        <button
          type="button"
          className="dropdown-item"
          onClick={() => { onNavigate && onNavigate("mypage"); onClose(); }}
        >
          <span className="ico"><Ico.Gear size={14}/></span>
          <span>계정 정보</span>
          <span className="r"><Ico.ChevronRight size={12}/></span>
        </button>
        <button
          type="button"
          className="dropdown-item"
          onClick={() => { onNavigate && onNavigate("me"); onClose(); }}
        >
          <span className="ico"><Ico.FileEdit size={14}/></span>
          <span>내 정보 · 경력기술</span>
          <span className="r"><Ico.ChevronRight size={12}/></span>
        </button>
        <button type="button" className="dropdown-item">
          <span className="ico"><Ico.Bell size={14}/></span>
          <span>알림 설정</span>
          <span className="r"><Ico.ChevronRight size={12}/></span>
        </button>
      </div>
      <div className="dropdown-section">
        <button type="button" className="dropdown-item">
          <span className="ico"><Ico.Sparkle size={14}/></span>
          <span>플랜 · 결제</span>
          <span className="value-pill">v2</span>
        </button>
      </div>
      <div className="dropdown-section">
        <button type="button" className="dropdown-item danger">
          <span className="ico">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
}

function TopNav({ current = "home", onNavigate }) {
  const [openMenu, setOpenMenu] = useState(null); // 'noti' | 'profile' | null
  const navRef = useRef(null);
  useClickAway(navRef, () => setOpenMenu(null));

  return (
    <header className="kit-nav">
      <div className="kit-nav-inner" ref={navRef}>
        <a className="kit-brand" href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate("home"); }} aria-label="이취 (2chi)">
          <img src="../../assets/logo.svg" alt="이취"/>
        </a>
        <nav className="kit-menus">
          {NAV_MENUS.map(m => (
            <a
              key={m.id}
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate && onNavigate(m.id); }}
              className={current === m.id ? "active" : ""}
            >{m.label}</a>
          ))}
        </nav>
        <div className="kit-nav-right">
          <button className="kit-icon-btn" aria-label="검색"><Ico.Search/></button>

          <div className="nav-anchor">
            <button
              className={"kit-icon-btn" + (openMenu === "noti" ? " open" : "")}
              aria-label="알림 3개"
              aria-expanded={openMenu === "noti"}
              onClick={() => setOpenMenu(openMenu === "noti" ? null : "noti")}
            >
              <Ico.Bell/>
              <span className="dot">3</span>
            </button>
            {openMenu === "noti" && (
              <NotiDropdown
                onClose={() => setOpenMenu(null)}
                onOpenCenter={() => onNavigate && onNavigate("mypage")}
              />
            )}
          </div>

          <div className="nav-anchor">
            <div
              className={"kit-profile" + (openMenu === "profile" ? " open" : "")}
              role="button"
              tabIndex={0}
              aria-expanded={openMenu === "profile"}
              onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
            >
              <span className="avatar">소</span>
              <span className="nm">김소미</span>
              <span className="caret"><Ico.ChevronDown/></span>
            </div>
            {openMenu === "profile" && (
              <ProfileDropdown
                onClose={() => setOpenMenu(null)}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { TopNav, NAV_MENUS });
