type Section = "profile" | "career" | "portfolio";

type Props = { section: Section };

const ME_TITLES: Record<Section, { eyebrow: string; title: string; sub: string }> = {
  profile:   { eyebrow: "ME · PROFILE",            title: "내 정보",     sub: "자소서·이력서 헤더와 채용공고 매칭에 쓰이는 정보예요. 한 번 정리해두면 모든 화면이 자동으로 채워집니다." },
  career:    { eyebrow: "ME · CAREER · PROJECTS",  title: "경력기술",    sub: "프로젝트 경험을 한 번 구조화해두면, 자소서·면접 답변·기업별 매칭 분석에 그대로 다시 쓸 수 있어요." },
  portfolio: { eyebrow: "ME · PORTFOLIO",          title: "포트폴리오",  sub: "외부 링크 또는 파일을 한곳에 모아두는 곳이에요. 자소서 헤더에 같이 보내져요." },
};

export function PageHeader({ section }: Props) {
  const t = ME_TITLES[section];
  return (
    <header className="page-head">
      <div className="eyebrow">{t.eyebrow}</div>
      <h1 className="title">{t.title}</h1>
      <p className="sub">{t.sub}</p>
    </header>
  );
}
