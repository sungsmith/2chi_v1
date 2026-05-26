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
    <div>
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
                <div style={{position:"relative"}}>
                  <button className="btn secondary">
                    <Ico.Download size={14}/> 다운로드 <Ico.ChevronDown size={12}/>
                  </button>
                  <div className="download-menu">
                    <button className="download-item">
                      <span className="ext">PDF</span>
                      <span className="meta"><b>제출용</b> · 폰트 포함 · 인쇄 최적화</span>
                    </button>
                    <button className="download-item">
                      <span className="ext">DOCX</span>
                      <span className="meta"><b>편집용</b> · MS Word · 외부 편집 가능</span>
                    </button>
                    <button className="download-item">
                      <span className="ext">TXT</span>
                      <span className="meta">텍스트만 · 클립보드 복사용</span>
                    </button>
                  </div>
                </div>
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
              <div className="counter">
                <button className="counter-toggle">
                  <Ico.Check size={10}/> 공백 포함
                </button>
                <span className="count-text"><b>318</b> / 500</span>
              </div>
              <div className="q-actions">
                <button className="btn ghost sm"><Ico.Refresh size={12}/> 다시 쓰기</button>
                <button className="btn secondary sm">맞춤법 검사</button>
                <button className="btn tertiary sm"><Ico.Sparkle size={12}/> 자소서 톤 맞추기</button>
              </div>
            </div>

            <div className="ai-validation">
              <div className="ai-val-head">
                <span className="ttl"><Ico.Sparkle size={12}/> AI 생성 자동 검증</span>
                <span className="stamp">2분 전 · 3건 검토 권장</span>
              </div>
              <div className="ai-val-row ok">
                <span className="ico"><Ico.Check size={11}/></span>
                <span>글자수 <b>318자</b> · 제한 500자 이내</span>
              </div>
              <div className="ai-val-row ok">
                <span className="ico"><Ico.Check size={11}/></span>
                <span>공고 핵심 키워드 <b>4 / 5</b>개 반영 (PostgreSQL, Redis, 결제·정산, 도메인)</span>
              </div>
              <div className="ai-val-row warn">
                <span className="ico">!</span>
                <span>이력에서 확인되지 않은 표현 <b>2건</b> — Kafka 기반 비동기 처리, MSA 운영 경험</span>
              </div>
            </div>

            <div className="spellcheck-banner">
              <div className="left">
                <span className="badge warning dot">맞춤법 검사 결과 · 2건</span>
                <span className="sc-detail">
                  "<b>설계 도면</b>" 표현 주위 띄어쓰기 1건 · "<b>운용</b>" → <b>운영</b> 추천 1건
                </span>
              </div>
              <div className="right">
                <button className="btn ghost sm">건너뛰기</button>
                <button className="btn primary sm">한 번에 적용</button>
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
              <div className="counter">
                <button className="counter-toggle">
                  <Ico.Check size={10}/> 공백 포함
                </button>
                <span className="count-text"><b>0</b> / 400</span>
              </div>
              <div className="q-actions">
                <button className="btn secondary sm">맞춤법 검사</button>
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
    </div>
  );
}

Object.assign(window, { CoverLetterScreen });
