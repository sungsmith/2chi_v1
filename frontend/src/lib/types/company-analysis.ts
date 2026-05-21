export type AnalysisOverview = {
  businessArea: string;
  mainProducts: string[];
  revenue: string | null;
  employees: number | null;
  location: string | null;
  sourceUrl: string | null;
};

export type AnalysisSummary = {
  overview: AnalysisOverview;
  talent_profile: string[];
  action_points: string[];
};

export type CompanyAnalysis = {
  id: number;
  company: string;
  summaryJson: string;
  sourceUrls: string[];
  generatedAt: string;
  generatedBy: string;
  expiresInDays: number;
};

export type CompanyAnalysisSummaryResponse = {
  id: number;
  company: string;
  generatedAt: string;
  expiresInDays: number;
};

export type AnalysisCreateRequest = {
  company: string;
  urls: string[];
};

export type ByCompanyResponse = {
  id: number | null;
  company: string;
};
