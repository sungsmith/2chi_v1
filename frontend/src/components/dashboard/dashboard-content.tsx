"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { HomeBanner } from "@/components/home/home-banner";
import { Greeting } from "./greeting";
import { KpiCompleteness } from "./kpi-completeness";
import { KpiCoverLetters } from "./kpi-cover-letters";
import { KpiInProgress } from "./kpi-in-progress";
import { UpcomingPanel } from "./upcoming-panel";
import { MatchPanel } from "./match-panel";
import { Shortcuts } from "./shortcuts";
import { fetchProfile } from "@/lib/api/profile";
import { fetchEducations } from "@/lib/api/education";
import { fetchCareers } from "@/lib/api/career";
import { fetchVariantsGrouped } from "@/lib/api/cover-letter";
import { fetchApplications } from "@/lib/api/application";
import {
  computeCompleteness,
  computeCoverLetters,
  computeInProgress,
} from "@/lib/dashboard/aggregate";
import type {
  KpiCompletenessData,
  KpiCoverLettersData,
  KpiInProgressData,
} from "@/lib/mock/dashboard";
import { TODAY_QUOTE_MOCK } from "@/lib/mock/dashboard";

type KpiData = {
  completeness: KpiCompletenessData;
  coverLetters: KpiCoverLettersData;
  inProgress: KpiInProgressData;
};

export function DashboardContent() {
  const { user } = useAuth();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchEducations(),
      fetchCareers(),
      fetchVariantsGrouped(),
      fetchApplications(),
    ])
      .then(([profile, educations, careers, variants, apps]) => {
        setKpi({
          completeness: computeCompleteness(profile, educations, careers, variants),
          coverLetters: computeCoverLetters(variants, new Date()),
          inProgress: computeInProgress(apps),
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "대시보드 정보를 불러오지 못했어요.")
      );
  }, []);

  if (!user) return null;

  return (
    <div className="dash-main">
      <HomeBanner />
      <Greeting
        nickname={user.nickname}
        showTags={user.onboardingCompleted}
        todayQuote={TODAY_QUOTE_MOCK}
      />
      {error && (
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}
      <div className="kpi-grid">
        {kpi ? (
          <>
            <KpiCompleteness data={kpi.completeness} />
            <KpiCoverLetters data={kpi.coverLetters} />
            <KpiInProgress data={kpi.inProgress} />
          </>
        ) : (
          <>
            <div className="kpi skeleton" aria-hidden />
            <div className="kpi skeleton" aria-hidden />
            <div className="kpi skeleton" aria-hidden />
          </>
        )}
      </div>
      <div className="dual-grid">
        <UpcomingPanel />
        <MatchPanel />
      </div>
      <Shortcuts />
    </div>
  );
}
