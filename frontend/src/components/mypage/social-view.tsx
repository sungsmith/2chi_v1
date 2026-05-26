import { Check } from "@/components/ui/icons";
import type { SocialConnection } from "@/lib/mock/mypage";

interface SocialViewProps {
  connections: SocialConnection[];
}

export function SocialView({ connections }: SocialViewProps) {
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
          {connections.map((conn) => (
            <div key={conn.provider} className={`mp-social-tile${conn.connected ? " on" : ""}`}>
              <div className="head">
                <span className={`ico ${conn.provider}`}>{conn.provider[0].toUpperCase()}</span>
                <span className="nm">{conn.label}</span>
              </div>
              {conn.connected ? (
                <span className="status">
                  <Check size={11} /> 연결됨 · {conn.email}
                </span>
              ) : (
                <span className="status">연결되지 않음</span>
              )}
              <div className="actions">
                {conn.connected ? (
                  <button
                    className="btn ghost sm"
                    style={{ padding: "0 10px", height: 28 }}
                    disabled
                  >
                    해제
                  </button>
                ) : (
                  <button
                    className="btn secondary sm"
                    style={{ padding: "0 10px", height: 28 }}
                    disabled
                  >
                    연결
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
