"use client";

import { MascotCloud } from "@/components/ui/mascot-cloud";
import { GREETING_TAGS } from "@/lib/mock/dashboard";

type Props = {
  nickname: string;
  showTags: boolean;
  todayQuote?: string;
};

function formatGreetingDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${year} · ${month} · ${day} ${weekday} · 오늘의 준비 현황`;
}

export function Greeting({ nickname, showTags, todayQuote }: Props) {
  const dateLabel = formatGreetingDate(new Date());

  return (
    <section className="greet">
      <div className="greet-text">
        <div className="greet-meta" suppressHydrationWarning>
          {dateLabel}
        </div>
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
