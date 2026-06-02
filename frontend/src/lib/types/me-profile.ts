// ---- Enums (BE string values) ----

export type EducationLevel = "HIGH_SCHOOL" | "UNIVERSITY" | "GRADUATE";
export type EducationStatus = "GRADUATED" | "ATTENDING" | "LEAVE" | "DROP";
export type ExperienceType =
  | "INTERN"
  | "CLUB"
  | "CONTEST"
  | "VOLUNTEER"
  | "SIDE_PROJECT"
  | "OTHER";

export const EDUCATION_LEVEL_LABEL: Record<EducationLevel, string> = {
  HIGH_SCHOOL: "고등학교",
  UNIVERSITY: "대학교",
  GRADUATE: "대학원",
};

export const EDUCATION_STATUS_LABEL: Record<EducationStatus, string> = {
  GRADUATED: "졸업",
  ATTENDING: "재학 중",
  LEAVE: "휴학",
  DROP: "중퇴",
};

export const EXPERIENCE_TYPE_LABEL: Record<ExperienceType, string> = {
  INTERN: "인턴",
  CLUB: "동아리",
  CONTEST: "공모전",
  VOLUNTEER: "봉사",
  SIDE_PROJECT: "사이드 프로젝트",
  OTHER: "기타",
};

// ---- Response types (match BE JSON field names) ----

export type Education = {
  id: number;
  level: EducationLevel;
  school: string;
  major: string | null;
  startDate: string | null; // ISO date
  endDate: string | null;
  gpa: number | null; // BigDecimal → JSON number
  gpaMax: number | null;
  status: EducationStatus;
  orderIndex: number;
};

export type Certificate = {
  id: number;
  name: string;
  issuer: string | null;
  acquiredAt: string | null; // ISO date
  score: string | null;
  orderIndex: number;
};

export type Experience = {
  id: number;
  type: ExperienceType;
  name: string;
  organization: string | null;
  startDate: string | null;
  endDate: string | null;
  role: string | null;
  summary: string | null;
  orderIndex: number;
};

export type ProfileBasic = {
  name: string | null;
  birthDate: string | null;
  phone: string | null;
  region: string | null;
  introduction: string | null;
  target: string | null;
  careerYear: number | null;
  targetJobs: string[];
  onboardingCompleted: boolean;
};

// ---- Request types ----

export type EducationRequest = {
  level: EducationLevel;
  school: string;
  major?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  gpa?: number | null;
  gpaMax?: number | null;
  status: EducationStatus;
};

export type CertificateRequest = {
  name: string;
  issuer?: string | null;
  acquiredAt?: string | null;
  score?: string | null;
};

export type ExperienceRequest = {
  type: ExperienceType;
  name: string;
  organization?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  role?: string | null;
  summary?: string | null;
};

export type ProfileBasicUpdateRequest = {
  name?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  region?: string | null;
  introduction?: string | null;
};
