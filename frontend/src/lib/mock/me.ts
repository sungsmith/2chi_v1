export type ProfileBasic = {
  name: string;
  email: string;
  phone: string;
  position: string;
  experienceYears: string;
};

export type ProfileEducation = {
  school: string;
  major: string;
  period: string;
  status: string;
};

export type ProfileCert = {
  name: string;
  issuer: string;
  date: string;
};

export type ProfileExperience = {
  title: string;
  org: string;
  period: string;
  description: string;
};

export type ProfileResumeNote = {
  filename: string;
  updatedAt: string;
};

export type ProfileSnapshot = {
  basic: ProfileBasic;
  educations: ProfileEducation[];
  certs: ProfileCert[];
  experiences: ProfileExperience[];
  resume: ProfileResumeNote | null;
};

export const PROFILE_MOCK: ProfileSnapshot = {
  basic: {
    name: "김소미",
    email: "somi.kim@example.com",
    phone: "010-0000-0000",
    position: "백엔드",
    experienceYears: "중고신입 (2년차)",
  },
  educations: [
    { school: "OO대학교", major: "컴퓨터공학", period: "2018.03 — 2022.02", status: "졸업" },
  ],
  certs: [
    { name: "정보처리기사", issuer: "한국산업인력공단", date: "2022.05" },
    { name: "SQLD",         issuer: "한국데이터산업진흥원", date: "2022.08" },
  ],
  experiences: [
    { title: "백엔드 스터디 리딩", org: "사내 동호회", period: "2024.03 — 진행중", description: "Spring · Kafka 학습 모임 운영 (격주, 12회 진행)" },
  ],
  resume: { filename: "kim-somi-resume-v3.pdf", updatedAt: "2026-05-10" },
};
