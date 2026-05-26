"use client";

import { MascotCloud } from "@/components/ui/mascot-cloud";
import { GREETING_TAGS } from "@/lib/mock/dashboard";

type Props = {
  nickname: string;
  showTags: boolean;
  todayQuote?: string;
};

export function Greeting({ nickname, showTags, todayQuote }: Props) {
  return (
    <section className="greet">
      <div className="greet-text">
        <h1>
          안녕하세요, {nickname}님
          <span className="wave" role="img" aria-label="hi">
            👋
          </span>
        </h1>
        <p className="line2">
          오늘도 이취가 다가오는 일정과 작성 흐름을 같이 정리해드릴게요. 내 이력과 지원 현황을 기준으로, 이번 주에 챙기면 좋을 준비를 모아뒀어요.
        </p>
        {showTags && (
          <div className="greet-tags">
            {GREETING_TAGS.map((t) => (
              <span key={t.label} className={`greet-tag${t.tone ? ` ${t.tone}` : ""}`}>
                <span className="swatch" />
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {todayQuote && (
        <aside className="greet-aside memo-paper">
          <span
            className="tape mint"
            style={{ top: "-10px", left: "50%", transform: "translateX(-50%) rotate(-4deg)" }}
          />
          <MascotCloud size="md" expression="wave" />
          <small>오늘의 한 줄</small>
          <div className="memo-copy">
            {todayQuote.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}
