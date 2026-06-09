export type PortfolioLinkKind = "GITHUB" | "BLOG" | "NOTION" | "OTHER";

export type PortfolioLink = {
  id: number;
  kind: PortfolioLinkKind;
  title: string;
  url: string;
  orderIndex: number;
};

export type PortfolioLinkRequest = {
  kind: PortfolioLinkKind;
  title: string;
  url: string;
};
