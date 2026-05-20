export type Metric =
  | { k: string; before: string; after: string }
  | { k: string; delta: string; dir: "up" | "down" };

export type Prar = {
  problem: string | null;
  rootCause: string | null;
  approach: string | null;
  result: string | null;
};

export type Project = {
  id: number;
  careerHistoryId: number | null;
  title: string;
  periodStart: string | null; // ISO date (YYYY-MM-DD) or null
  periodEnd: string | null;
  role: string | null;
  techStack: string[];
  structureType: "PRAR"; // v1: PRAR only
  prar: Prar;
  metrics: Metric[];
  orderIndex: number;
};

export type Career = {
  id: number;
  company: string;
  position: string | null;
  startDate: string; // NOT NULL in BE
  endDate: string | null;
  isCurrent: boolean;
  summary: string | null;
  orderIndex: number;
  projects: Project[];
};

export type CareerCreateRequest = {
  company: string;
  position?: string;
  startDate: string;
  endDate?: string | null;
};

export type ProjectCreateRequest = {
  title: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  role?: string | null;
};

export type ProjectPatchRequest = {
  title?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  role?: string | null;
  prar?: Partial<Prar>;
  techStack?: string[];
  metrics?: Metric[];
};
