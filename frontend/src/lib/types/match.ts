export type MatchGap = { keyword: string; hitCount: number };

export type DashboardMatch = {
  percent: number;
  postingCount: number;
  gaps: MatchGap[];
};

export type PostingMatch = { postingId: number; percent: number };
