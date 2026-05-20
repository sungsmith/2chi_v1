"use client";

import { useAuth } from "@/contexts/auth-context";
import { HomeBanner } from "@/components/home/home-banner";
import { Greeting } from "./greeting";
import { KpiCompleteness } from "./kpi-completeness";
import { KpiCoverLetters } from "./kpi-cover-letters";
import { KpiInProgress } from "./kpi-in-progress";
import { UpcomingPanel } from "./upcoming-panel";
import { TodayQuote } from "./today-quote";
import { Shortcuts } from "./shortcuts";
import {
  KPI_COMPLETENESS_MOCK,
  KPI_COVER_LETTERS_MOCK,
  KPI_IN_PROGRESS_MOCK,
  UPCOMING_MOCK,
} from "@/lib/mock/dashboard";

export function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="dash-main">
      <HomeBanner />
      <Greeting nickname={user.nickname} showTags={user.onboardingCompleted} />
      <div className="kpi-grid">
        <KpiCompleteness data={KPI_COMPLETENESS_MOCK} />
        <KpiCoverLetters data={KPI_COVER_LETTERS_MOCK} />
        <KpiInProgress data={KPI_IN_PROGRESS_MOCK} />
      </div>
      <div className="dual-grid">
        <UpcomingPanel items={UPCOMING_MOCK} />
        <TodayQuote />
      </div>
      <Shortcuts />
    </div>
  );
}
