export type PostingSource = "URL" | "MANUAL" | "SARAMIN";

export type JobPosting = {
  id: number;
  source: PostingSource;
  company: string;
  title: string;
  jobRole: string | null;
  requirements: string | null;
  preferred: string | null;
  mainTasks: string | null;
  deadline: string | null; // YYYY-MM-DD
  sourceUrl: string | null;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type JobPostingCreateRequest = {
  source: PostingSource;
  company: string;
  title: string;
  jobRole?: string | null;
  requirements?: string | null;
  preferred?: string | null;
  mainTasks?: string | null;
  deadline?: string | null;
  sourceUrl?: string | null;
};

export type JobPostingPatchRequest = Partial<{
  company: string;
  title: string;
  jobRole: string | null;
  requirements: string | null;
  preferred: string | null;
  mainTasks: string | null;
  deadline: string | null;
}>;

export type ParsedPosting = {
  company: string | null;
  title: string | null;
  jobRole: string | null;
  requirements: string | null;
  preferred: string | null;
  mainTasks: string | null;
  deadline: string | null;
  sourceUrl: string | null;
};
