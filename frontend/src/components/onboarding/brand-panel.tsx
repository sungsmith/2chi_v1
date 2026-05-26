export function BrandPanel() {
  return (
    <aside className="onb-left">
      <div className="onb-logo">
        <img src="/logo.svg" alt="이취 (2chi)" />
      </div>

      <div className="onb-headline">
        <div className="onb-eyebrow">welcome · 환영합니다</div>
        <h1>
          매번 다시 쓰지 않는<br />
          자소서, <span className="accent">한곳에서</span><br />
          정리되는 지원 흐름.
        </h1>
        <p className="lead">
          몇 가지만 알려주시면,<br />
          자소서와 지원 관리를 더 정확하게 도와드릴 수 있어요.
        </p>

        <div className="onb-tip">
          <span className="mascot-cloud wave" aria-hidden="true" />
          <div className="tip-body">
            <h4>4단계, 약 1분이면 끝나요</h4>
            <p>
              지금 답하지 않아도 괜찮아요. 언제든 <b>내 정보</b>에서 다시 다듬을 수 있어요.
            </p>
          </div>
        </div>
      </div>

      <div className="onb-foot-meta">v1 · 2026 Q2 · PC WEB FIRST</div>
    </aside>
  );
}
