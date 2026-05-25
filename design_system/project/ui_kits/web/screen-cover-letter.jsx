/* =========================================================
   2chi · Web UI Kit — 자소서 작성 (Cover-letter editor)
   2-pane layout · main editor + side analysis panel
========================================================= */

const DRAFT_PARAGRAPH = (
  <>
    저는 <span className="kw-confirmed">PostgreSQL</span> 운영 경험을 바탕으로 결제 시스템의
    안정성을 끌어올리고 싶습니다. 사이드 프로젝트로 운영하던 식권 정산 API에서
    <span className="kw-confirmed">Redis</span> 캐시 적중률을 23% → 71%까지 끌어올린 경험이 있고,
    이를 통해 평균 응답 속도를 <span className="kw-confirmed">340ms → 110ms</span>로 줄였습니다.
    {" "}이 과정에서 <span className="kw-highlight">Kafka 기반의 비동기 처리</span>와
    {" "}<span className="kw-highlight">MSA 운영 경험</span>을 추가로 다지고 싶다는 갈증을 느꼈고,
    공고에서 강조하시는 <span className="kw-confirmed">결제·정산 도메인</span>에서 이 갈증을
    함께 해결해 나가고 싶습니다.
  </>
);

function CoverLetterScreen() {
  return (
    <main className="kit-main">
      <div className="cl-shell">
        {/* MAIN */}
        <div className="cl-main">
          <header className="cl-head">
            <div className="crumb">
              <span>이직 / 취업</span><span>›</span><span>자소서</span><span>›</span>
              <b>(주)테크컴퍼니 · 백엔드 (경력 2~5년)</b>
            </div>
            <div className="row">
              <div>
                <h1>카카오 X 결제·정산 백엔드</h1>
                <div className="sub">공고 매칭률 <b>72%</b> · 마지막 저장 03분 전 · 자동 저장 켜짐</div>
              </div>
              <div className="pills">
                <button className="btn secondary"><Ico.Save size={14}/> 임시저장</button>
                <button className="btn secondary"><Ico.Download size={14}/> PDF</button>
                <button className="btn ai">AI 초안 다시 만들기</button>
              </div>
            </div>
          </header>

          <article className="cl-q">
            <div className="q-head">
              <span className="q-title">Q1. 지원 동기를 자유롭게 작성해주세요.</span>
              <span className="badge lav dot">AI 초안 · 검토 필요</span>
            </div>
            <div className="q-prompt">
              회사의 사업 영역, 본인의 경험, 그리고 입사 후 기여하고 싶은 방향을 자연스럽게 연결해주세요.
              500자 이내, 띄어쓰기 포함.
            </div>
            <div className="editor" contentEditable suppressContentEditableWarning>
              {DRAFT_PARAGRAPH}
            </div>
            <div className="q-foot">
              <div className="counter">글자수 <b>318</b> / 500 (공백 포함)</div>
              <div className="q-actions">
                <button className="btn ghost sm"><Ico.Refresh size={12}/> 다시 쓰기</button>
                <button className="btn tertiary sm"><Ico.Sparkle size={12}/> 자소서 톤 맞추기</button>
              </div>
            </div>
          </article>

          <article className="cl-q">
            <div className="q-head">
              <span className="q-title">Q2. 본인의 강점과 약점을 작성해주세요.</span>
              <span className="badge dot">초안 없음</span>
            </div>
            <div className="q-prompt">
              지원 직무에 직접 활용 가능한 강점, 그리고 보완하고자 노력 중인 약점을 함께 작성해주세요. 400자 이내.
            </div>
            <div className="editor" contentEditable suppressContentEditableWarning>
              <span style={{color:"var(--color-text-muted)"}}>
                여기에 직접 작성하거나, 우측 ‘AI 초안 만들기’ 버튼으로 시작해보세요.
              </span>
            </div>
            <div className="q-foot">
              <div className="counter">글자수 <b>0</b> / 400</div>
              <div className="q-actions">
                <button className="btn ai sm">AI 초안 만들기</button>
              </div>
            </div>
          </article>
        </div>

        {/* SIDE */}
        <aside className="cl-side">
          <section className="panel">
            <div className="panel-head"><h3>연결된 공고</h3></div>
            <div className="cl-meta-row"><span className="k">회사</span><span className="v">(주)테크컴퍼니</span></div>
            <div className="cl-meta-row"><span className="k">포지션</span><span className="v">백엔드 (경력 2~5년)</span></div>
            <div className="cl-meta-row"><span className="k">마감</span><span className="v" style={{color:"var(--color-pink-500)"}}>D-19 · 2026.05.31</span></div>
            <div className="cl-meta-row"><span className="k">매칭률</span><span className="v" style={{color:"var(--color-primary-700)"}}>72%</span></div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3 style={{color:"var(--color-mint-700)"}}>매칭된 키워드 · 12</h3></div>
            <div className="cl-kw-list">
              <span className="chip-keyword match">PostgreSQL</span>
              <span className="chip-keyword match">Redis</span>
              <span className="chip-keyword match">Spring Boot</span>
              <span className="chip-keyword match">결제 도메인</span>
              <span className="chip-keyword match">Docker</span>
              <span className="chip-keyword match">JPA</span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3 style={{color:"var(--color-peach-400)"}}>보완할 키워드 · 4</h3></div>
            <div className="cl-kw-list">
              <span className="chip-keyword gap">Kafka</span>
              <span className="chip-keyword gap">MSA 운영</span>
              <span className="chip-keyword gap">Datadog</span>
              <span className="chip-keyword gap">TPS 5K+</span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3 style={{color:"var(--color-yellow-400)"}}>검토 필요 · 3건</h3></div>
            <div className="cl-flag-list">
              <div className="cl-flag">
                <span>"<b>Kafka 기반의 비동기 처리</b>" 표현은 내 이력에서 직접 확인되지 않았어요. 검토해주세요.</span>
              </div>
              <div className="cl-flag">
                <span>"<b>MSA 운영 경험</b>" 표현도 보완할 경험에 가까워요. 직접 확인된 표현으로 바꿔보시겠어요?</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

Object.assign(window, { CoverLetterScreen });
