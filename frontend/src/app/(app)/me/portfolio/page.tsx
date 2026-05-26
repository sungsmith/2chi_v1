import { PageHeader } from "@/components/me/page-header";
import { PortfolioView } from "@/components/me/portfolio-view";
import { PORTFOLIO_MOCK } from "@/lib/mock/me";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader section="portfolio" />
      <PortfolioView data={PORTFOLIO_MOCK} />
    </>
  );
}
