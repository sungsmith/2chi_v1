/* =========================================================
   2chi · Web UI Kit — Error routes (404 / 500)
   Full-viewport centered card with mascot + actions.
========================================================= */

function ErrorScreen({ code = 404, onHome }) {
  if (code === 500) {
    return (
      <div className="err-shell">
        <div className="err-card">
          <span className="mascot-cloud lg think" aria-hidden/>
          <span className="code err">500 · 잠시 연결이 끊겼어요</span>
          <h2>잠시 후 다시 시도해주세요</h2>
          <p>서버 응답이 지연되고 있어요. 작성 중이던 자소서는 임시 저장되어 있어요.</p>
          <div className="actions">
            <button className="btn ghost sm">상태 페이지</button>
            <button className="btn primary sm" onClick={() => location.reload()}>
              <Ico.Refresh size={12}/> 다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="err-shell">
      <div className="err-card">
        <span className="mascot-cloud lg sleep" aria-hidden/>
        <span className="code">404 · NOT FOUND</span>
        <h2>이 페이지는 더 이상 찾을 수 없어요</h2>
        <p>주소가 바뀌었거나, 삭제됐을 수 있어요. 대시보드에서 다시 시작해보세요.</p>
        <div className="actions">
          <button className="btn ghost sm" onClick={() => history.back()}>뒤로</button>
          <button className="btn primary sm" onClick={onHome}>대시보드로</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ErrorScreen });
