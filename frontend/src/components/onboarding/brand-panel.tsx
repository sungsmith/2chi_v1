export function BrandPanel() {
  return (
    <aside className="onb-left">
      <a className="onb-logo-mark" href="#" aria-label="이취 (2chi)">
        <img src="/logo.svg" alt="이취" style={{ height: 56, width: "auto", display: "block" }} />
      </a>

      <div className="headline">
        <div className="onb-eyebrow mono">welcome · 환영합니다</div>
        <h1>
          매번 다시 쓰지 않는<br />
          자소서, <span className="accent">한곳에서</span><br />
          정리되는 지원 흐름.
        </h1>
        <p className="lead">
          몇 가지만 알려주시면,<br />
          자소서와 지원 관리를 더 정확하게 도와드릴 수 있어요.
        </p>

        <div className="onb-tip-card">
          <span className="tape lav" />
          <div className="tip-icon">
            <span className="mascot-cloud sm">
              <span className="blush" />
            </span>
          </div>
          <div>
            <h4>4단계, 약 1분이면 끝나요</h4>
            <p>
              지금 답하지 않아도 괜찮아요. 언제든 <b>내 정보</b>에서 다시 다듬을 수 있어요.
            </p>
          </div>
        </div>
      </div>

      <div className="onb-foot-meta mono">v1 · 2026 Q2  ·  PC Web First</div>
    </aside>
  );
}
