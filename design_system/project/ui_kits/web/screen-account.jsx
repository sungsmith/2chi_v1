/* =========================================================
   2chi · Web UI Kit — 계정 + 시스템 cluster
   - login / signup: centered single-card forms
   - 마이페이지: sidebar with 5 sub-items
   - 알림 센터: list view
========================================================= */

const MP_NAV = [
  { id: "account",  label: "계정 정보" },
  { id: "social",   label: "소셜 연결" },
  { id: "noti-set", label: "알림 설정" },
  { id: "noti",     label: "알림 센터", pill: "3", pillTitle: "읽지 않은 알림 수" },
  { id: "danger",   label: "회원 탈퇴" },
];

const AUTH_TABS = [
  { id: "login",  label: "로그인" },
  { id: "signup", label: "회원가입" },
];

/* ============================================================
   비밀번호 재설정 (3-step)
============================================================ */
function ResetPasswordView({ onBackToLogin }) {
  const [step, setStep] = useState(1);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <img src="../../assets/logo.svg" alt="이취 (2chi)"/>
        </div>

        <div className="auth-stepper">
          <span className={"dot" + (step > 1 ? " done" : " active")}>{step > 1 ? <Ico.Check size={10}/> : "1"}</span>
          <span className={"lbl" + (step === 1 ? " active" : "")}>이메일 확인</span>
          <span className="sep"/>
          <span className={"dot" + (step > 2 ? " done" : step === 2 ? " active" : "")}>{step > 2 ? <Ico.Check size={10}/> : "2"}</span>
          <span className={"lbl" + (step === 2 ? " active" : "")}>메일 확인</span>
          <span className="sep"/>
          <span className={"dot" + (step === 3 ? " active" : "")}>3</span>
          <span className={"lbl" + (step === 3 ? " active" : "")}>새 비밀번호</span>
        </div>

        {step === 1 && (
          <>
            <div className="brand" style={{gap:8}}>
              <h1 style={{margin:0}}>비밀번호 재설정</h1>
              <p className="sub">가입할 때 사용한 이메일을 입력해주세요. 재설정 링크를 보내드릴게요.</p>
            </div>
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="field">
                <label className="lbl">이메일</label>
                <input className="input" type="email" defaultValue="somi.kim@example.com" autoFocus/>
              </div>
              <button type="submit" className="primary-btn">재설정 링크 보내기</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-empty">
              <span className="mascot-cloud lg happy" aria-hidden/>
              <h2>메일함을 확인해주세요</h2>
              <p>아래 이메일로 재설정 링크를 보냈어요.<br/>링크는 <b>1시간</b> 동안 유효해요.</p>
              <span className="email-pill"><Ico.Bell size={12}/> somi.kim@example.com</span>
            </div>
            <button className="primary-btn" onClick={() => setStep(3)}>
              메일 링크 클릭한 척하기 (데모)
            </button>
            <div className="auth-foot">
              메일이 안 왔나요?
              <a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>다시 보내기</a>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="brand" style={{gap:8}}>
              <h1 style={{margin:0}}>새 비밀번호 설정</h1>
              <p className="sub">새 비밀번호로 다시 로그인할게요.</p>
            </div>
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onBackToLogin && onBackToLogin(); }}>
              <div className="field">
                <label className="lbl">새 비밀번호</label>
                <input className="input" type="password" placeholder="••••••••" autoFocus/>
                <span className="helper">8자 이상, 영문/숫자/특수문자 중 2종 이상</span>
              </div>
              <div className="field">
                <label className="lbl">새 비밀번호 확인</label>
                <input className="input" type="password" placeholder="••••••••"/>
              </div>
              <button type="submit" className="primary-btn">비밀번호 변경 완료</button>
            </form>
          </>
        )}

        {step !== 3 && (
          <div className="auth-foot">
            기억나셨나요?
            <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin && onBackToLogin(); }}>로그인으로</a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   이메일 인증 대기 (회원가입 직후)
============================================================ */
function VerifyEmailView({ onResend, onBackToLogin }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <img src="../../assets/logo.svg" alt="이취 (2chi)"/>
        </div>

        <div className="auth-empty">
          <span className="mascot-cloud lg wave" aria-hidden/>
          <h2>회원가입을 도와드릴게요</h2>
          <p>거의 다 됐어요. 메일함에서 인증 메일을 열고<br/><b>"이메일 인증하기"</b> 버튼을 눌러주세요.</p>
          <span className="email-pill"><Ico.Bell size={12}/> somi.kim@example.com</span>
        </div>

        <div className="auth-divider">메일이 오지 않았나요</div>
        <div className="auth-foot" style={{textAlign:"center", lineHeight:1.7}}>
          <ul style={{textAlign:"left", padding:"0 4px 0 18px", margin:0, fontSize:12.5, color:"var(--color-text-secondary)"}}>
            <li>스팸함 · 프로모션함을 확인해주세요</li>
            <li>이메일 주소를 잘못 입력했다면 다시 가입해주세요</li>
            <li>그래도 안 온다면 5분 후 다시 보내기를 눌러주세요</li>
          </ul>
        </div>

        <button className="primary-btn" onClick={onResend}>인증 메일 다시 보내기</button>

        <div className="auth-foot">
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin && onBackToLogin(); }}>다른 이메일로 가입하기</a>
        </div>
      </div>
    </div>
  );
}

function MyPageSideNav({ active, onSelect }) {
  return (
    <aside className="side-nav">
      <div className="crumb">마이페이지</div>
      {MP_NAV.map(it => (
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
   로그인 / 회원가입
============================================================ */
function AuthView({ mode = "login", onSwitch, onAuthed }) {
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreed, setAgreed] = useState({ tos: false, privacy: false, age: false, marketing: false });
  const toggleAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreed({ tos: next, privacy: next, age: next, marketing: next });
  };

  if (mode === "login") {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand">
            <img src="../../assets/logo.svg" alt="이취 (2chi)"/>
            <div>
              <h1>다시 만나서 반가워요</h1>
              <p className="sub">이메일로 로그인하거나 소셜 계정으로 빠르게 들어오세요.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onAuthed && onAuthed(); }}>
            <div className="field">
              <label className="lbl">이메일</label>
              <input className="input" type="email" defaultValue="somi.kim@example.com"/>
            </div>
            <div className="field">
              <label className="lbl">비밀번호</label>
              <input className="input" type="password" defaultValue="************"/>
            </div>
            <div className="row">
              <span className="check on">
                <span className="box"><Ico.Check size={10}/></span>
                로그인 상태 유지
              </span>
              <a className="link" href="#" onClick={(e) => { e.preventDefault(); onSwitch && onSwitch("reset"); }}>비밀번호 재설정</a>
            </div>
            <button type="submit" className="primary-btn">로그인</button>
          </form>

          <div className="auth-divider">소셜 로그인</div>
          <div className="auth-social">
            <button><span className="ico kakao">K</span>카카오로 로그인</button>
            <button><span className="ico naver">N</span>네이버로 로그인</button>
            <button><span className="ico google">G</span>Google로 로그인</button>
          </div>

          <div className="auth-foot">
            아직 이취 회원이 아니신가요?
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitch && onSwitch("signup"); }}>회원가입</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <img src="../../assets/logo.svg" alt="이취 (2chi)"/>
          <div>
            <h1>한 번에 정리되는 지원 흐름,<br/>지금 시작해요</h1>
            <p className="sub">이메일로 가입하거나 소셜 계정으로 1초 만에 시작할 수 있어요.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onAuthed && onAuthed(); }}>
          <div className="field">
            <label className="lbl">이메일</label>
            <input className="input" type="email" placeholder="hello@2chi.app"/>
            <span className="helper">로그인에 사용되는 이메일</span>
          </div>
          <div className="field">
            <label className="lbl">비밀번호</label>
            <input className="input" type="password" placeholder="••••••••"/>
            <span className="helper">8자 이상, 영문/숫자/특수문자 중 2종 이상</span>
          </div>
          <div className="field">
            <label className="lbl">닉네임</label>
            <input className="input" placeholder="2~20자, 한/영/숫자"/>
          </div>

          <div className="auth-terms">
            <div className="all" onClick={toggleAll}>
              <span className={"box" + (agreeAll ? " on" : "")} style={{display:"inline-grid",placeItems:"center"}}>
                {agreeAll && <Ico.Check size={10}/>}
              </span>
              전체 동의
            </div>
            <div className={"item" + (agreed.tos ? " on" : "")} onClick={() => setAgreed(p => ({...p, tos:!p.tos}))}>
              <span className="box">{agreed.tos && <Ico.Check size={9}/>}</span>
              <span className="req">[필수]</span>
              서비스 이용약관
              <a className="view" href="#">보기</a>
            </div>
            <div className={"item" + (agreed.privacy ? " on" : "")} onClick={() => setAgreed(p => ({...p, privacy:!p.privacy}))}>
              <span className="box">{agreed.privacy && <Ico.Check size={9}/>}</span>
              <span className="req">[필수]</span>
              개인정보 수집·이용 동의
              <a className="view" href="#">보기</a>
            </div>
            <div className={"item" + (agreed.age ? " on" : "")} onClick={() => setAgreed(p => ({...p, age:!p.age}))}>
              <span className="box">{agreed.age && <Ico.Check size={9}/>}</span>
              <span className="req">[필수]</span>
              만 14세 이상 확인
            </div>
            <div className={"item" + (agreed.marketing ? " on" : "")} onClick={() => setAgreed(p => ({...p, marketing:!p.marketing}))}>
              <span className="box">{agreed.marketing && <Ico.Check size={9}/>}</span>
              <span className="opt">[선택]</span>
              마케팅 정보 수신 동의
            </div>
          </div>

          <button type="submit" className="primary-btn">회원가입</button>
        </form>

        <div className="auth-divider">간편 가입</div>
        <div className="auth-social">
          <button><span className="ico kakao">K</span>카카오로 시작</button>
          <button><span className="ico naver">N</span>네이버로 시작</button>
          <button><span className="ico google">G</span>Google로 시작</button>
        </div>

        <div className="auth-foot">
          이미 회원이신가요?
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitch && onSwitch("login"); }}>로그인</a>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   마이페이지 — 계정 정보
============================================================ */
function AccountView() {
  return (
    <>
      <section className="mp-head">
        <h1>계정 정보</h1>
        <div className="sub">이메일·닉네임·비밀번호 같은 계정 자체 정보를 관리해요.</div>
      </section>
      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">기본 정보</span>
          <span className="sec-sub">소셜 가입 계정은 비밀번호 변경이 불가해요</span>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">이메일</span>
            <span className="desc"><b>somi.kim@example.com</b> · 이메일 인증 완료</span>
          </div>
          <button className="btn ghost sm">변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">닉네임</span>
            <span className="desc"><b>소미</b> · UI · 자소서 · 알림에서 사용</span>
          </div>
          <button className="btn ghost sm"><Ico.Edit size={12}/> 편집</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">비밀번호</span>
            <span className="desc">마지막 변경 <b>3개월 전</b> · 90일마다 변경을 권장해요</span>
          </div>
          <button className="btn secondary sm">비밀번호 변경</button>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">2단계 인증</span>
            <span className="desc">로그인 시 이메일로 인증 코드를 한 번 더 확인해요. <b>v2 준비 중</b></span>
          </div>
          <span className="value-pill">곧 출시</span>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   마이페이지 — 소셜 연결
============================================================ */
function SocialView() {
  return (
    <>
      <section className="mp-head">
        <h1>소셜 연결</h1>
        <div className="sub">연결된 계정으로 1초 만에 로그인할 수 있어요. 언제든 해제할 수 있어요.</div>
      </section>
      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">연결된 계정</span>
        </div>
        <div className="mp-social">
          <div className="mp-social-tile on">
            <div className="head"><span className="ico kakao">K</span><span className="nm">카카오</span></div>
            <span className="status"><Ico.Check size={11}/> 연결됨 · somi.k</span>
            <div className="actions">
              <button className="btn ghost sm" style={{padding:"0 10px", height:28}}>해제</button>
            </div>
          </div>
          <div className="mp-social-tile">
            <div className="head"><span className="ico naver">N</span><span className="nm">네이버</span></div>
            <span className="status">연결되지 않음</span>
            <div className="actions">
              <button className="btn secondary sm" style={{padding:"0 10px", height:28}}>연결</button>
            </div>
          </div>
          <div className="mp-social-tile">
            <div className="head"><span className="ico google">G</span><span className="nm">Google</span></div>
            <span className="status">연결되지 않음</span>
            <div className="actions">
              <button className="btn secondary sm" style={{padding:"0 10px", height:28}}>연결</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   마이페이지 — 알림 설정
============================================================ */
function NotiSettingsRow({ nm, desc, defOn = true, locked = false }) {
  const [on, setOn] = useState(defOn);
  return (
    <div className="mp-row">
      <div className="body">
        <span className="nm">{nm}</span>
        <span className="desc">{desc}</span>
      </div>
      {locked
        ? <span className="value-pill" title="계정 보안 알림은 끌 수 없어요">강제 ON</span>
        : <span className={"switch" + (on ? " on" : "")} onClick={() => setOn(o => !o)}/>}
    </div>
  );
}

function NotiSettingsView() {
  return (
    <>
      <section className="mp-head">
        <h1>알림 설정</h1>
        <div className="sub">받고 싶은 알림 채널과 카테고리를 카테고리별로 정리할 수 있어요.</div>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">전형 일정 · 마감</span>
          <span className="sec-sub">채용공고와 면접 일정 관련 알림</span>
        </div>
        <NotiSettingsRow nm="채용공고 마감 D-3" desc="마감 3일 전 09:00에 받기" defOn={true}/>
        <NotiSettingsRow nm="채용공고 마감 D-1" desc="마감 1일 전 09:00에 받기" defOn={true}/>
        <NotiSettingsRow nm="면접·일정 D-1"     desc="등록한 일정 하루 전 09:00에 받기" defOn={true}/>
        <NotiSettingsRow nm="자소서 저장 후 미제출 7일" desc="저장하고 제출하지 않은 자소서가 있을 때" defOn={false}/>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">제품 안내</span>
        </div>
        <NotiSettingsRow nm="주간 요약" desc="이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)" defOn={false}/>
        <NotiSettingsRow nm="신기능 안내" desc="새로 추가된 기능·업데이트 소식" defOn={true}/>
        <NotiSettingsRow nm="이벤트 · 프로모션" desc="할인·이벤트 안내" defOn={false}/>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">계정 보안</span>
          <span className="sec-sub">중요 안내라 끌 수 없어요</span>
        </div>
        <NotiSettingsRow nm="회원가입 인증"     desc="가입 직후 이메일 인증 코드 발송" locked/>
        <NotiSettingsRow nm="비밀번호 재설정"   desc="비밀번호 재설정 요청 시 발송" locked/>
        <NotiSettingsRow nm="새 기기 로그인 감지" desc="등록되지 않은 기기에서 로그인 시 안내" locked/>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">알림 채널</span>
          <span className="sec-sub">받고 싶은 채널을 골라주세요</span>
        </div>
        <NotiSettingsRow nm="이메일 알림" desc="가장 안정적인 채널 · 발송 후 30일간 보관" defOn={true}/>
        <NotiSettingsRow nm="웹푸시 알림" desc="브라우저 알림 권한이 필요해요" defOn={true}/>
      </section>
    </>
  );
}

/* ============================================================
   알림 센터
============================================================ */
function NotiCenterView() {
  return (
    <>
      <section className="mp-head" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <h1>알림 센터</h1>
          <div className="sub">최근 30일간 받은 알림이에요. 읽지 않은 알림은 페리윙클로 표시돼요.</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="btn ghost sm"><Ico.Check size={12}/> 모두 읽음</button>
          <button className="btn secondary sm">알림 설정</button>
        </div>
      </section>

      <section className="noti-shell">
        <div className="noti-day">오늘 · 2026.05.12 (화)</div>
        <div className="noti-row unread">
          <span className="ico pink"><Ico.Bell size={14}/></span>
          <div className="body">
            <span className="ttl">카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요</span>
            <span className="desc">D-day · 매칭률 72% · 자소서 작성중</span>
          </div>
          <span className="time">09:00</span>
          <span className="unread-dot"/>
        </div>
        <div className="noti-row unread">
          <span className="ico mint"><Ico.Check size={14}/></span>
          <div className="body">
            <span className="ttl">(주)테크컴퍼니 1차면접 일정이 등록됐어요</span>
            <span className="desc">D-2 · 5/14 14:00 · 온라인</span>
          </div>
          <span className="time">17:32</span>
          <span className="unread-dot"/>
        </div>
        <div className="noti-row unread">
          <span className="ico"><Ico.Sparkle size={14}/></span>
          <div className="body">
            <span className="ttl">AI가 카카오 공고 매칭 결과를 정리했어요</span>
            <span className="desc">매칭률 72% · 부족 키워드 3건 · Kafka · MSA · TPS 5K+</span>
          </div>
          <span className="time">14:08</span>
          <span className="unread-dot"/>
        </div>

        <div className="noti-day">2026.05.11 (월)</div>
        <div className="noti-row">
          <span className="ico mint"><Ico.FileEdit size={14}/></span>
          <div className="body">
            <span className="ttl">네이버 신입 백엔드 자소서가 저장됐어요</span>
            <span className="desc">매칭률 81% · 검토 표시 3건</span>
          </div>
          <span className="time">20:14</span>
          <span className="unread-dot"/>
        </div>
        <div className="noti-row">
          <span className="ico warn"><Ico.Bell size={14}/></span>
          <div className="body">
            <span className="ttl">쿠팡 백엔드 (라스트마일) 마감 D-3</span>
            <span className="desc">자소서를 아직 작성하지 않았어요</span>
          </div>
          <span className="time">09:00</span>
          <span className="unread-dot"/>
        </div>

        <div className="noti-day">2026.05.09 (토)</div>
        <div className="noti-row">
          <span className="ico"><Ico.Plus size={14}/></span>
          <div className="body">
            <span className="ttl">기업분석 — 카카오 분석이 완료됐어요</span>
            <span className="desc">DART · 뉴스 · 인재상 · 활용 포인트 3건</span>
          </div>
          <span className="time">22:01</span>
          <span className="unread-dot"/>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   회원 탈퇴
============================================================ */
function DangerView() {
  return (
    <>
      <section className="mp-head">
        <h1>회원 탈퇴</h1>
        <div className="sub">탈퇴 후 30일간 유예 기간이 있어요. 그 안에 다시 로그인하면 복구할 수 있어요.</div>
      </section>

      <section className="mp-section">
        <div className="sec-head">
          <span className="sec-title">데이터 내보내기</span>
          <span className="sec-sub">탈퇴 전에 백업을 권장해요</span>
        </div>
        <div className="mp-row">
          <div className="body">
            <span className="nm">내 정보·자소서·경력기술 일괄 다운로드</span>
            <span className="desc">JSON + PDF로 묶어 보내드려요. 처리에는 최대 24시간 걸려요.</span>
          </div>
          <button className="btn secondary sm"><Ico.Download size={12}/> 데이터 요청</button>
        </div>
      </section>

      <section className="mp-danger">
        <span className="danger-ttl">회원 탈퇴</span>
        <div className="danger-row">
          <div>
            <div className="desc"><b>탈퇴 시 영구 삭제되는 데이터</b></div>
            <div className="desc">· 회원 정보 (이메일, 닉네임, 연결된 소셜 계정)</div>
            <div className="desc">· 자소서 · 경력기술 · 포트폴리오 링크</div>
            <div className="desc">· 지원 일정 · 히스토리 로그 · 알림 기록</div>
            <div className="desc">30일간 휴면 상태로 유예 후 영구 삭제됩니다.</div>
          </div>
          <button className="btn danger">회원 탈퇴</button>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   ROUTER
============================================================ */
function AccountScreen({ initialView = "mypage", onAuthed }) {
  // view: 'login' | 'signup' | 'reset' | 'verify' | 'mypage'
  const [view, setView] = useState(initialView);
  const [mp, setMp] = useState("account");

  if (view === "login" || view === "signup") {
    return (
      <AuthView
        mode={view}
        onSwitch={(m) => {
          if (m === "reset")  setView("reset");
          else if (m === "verify") setView("verify");
          else setView(m);
        }}
        onAuthed={() => {
          if (view === "signup") setView("verify");
          else { setView("mypage"); onAuthed && onAuthed(); }
        }}
      />
    );
  }
  if (view === "reset") {
    return <ResetPasswordView onBackToLogin={() => setView("login")}/>;
  }
  if (view === "verify") {
    return (
      <VerifyEmailView
        onResend={() => {}}
        onBackToLogin={() => setView("login")}
      />
    );
  }

  return (
    <div className="mp-shell">
      <MyPageSideNav active={mp} onSelect={setMp}/>
      <main className="mp-main">
        {mp === "account"  && <AccountView/>}
        {mp === "social"   && <SocialView/>}
        {mp === "noti-set" && <NotiSettingsView/>}
        {mp === "noti"     && <NotiCenterView/>}
        {mp === "danger"   && <DangerView/>}
      </main>
    </div>
  );
}

Object.assign(window, { AccountScreen });
