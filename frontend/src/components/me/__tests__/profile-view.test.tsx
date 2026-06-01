import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileView } from "../profile-view";

// --- api mocks ---
const fetchProfileMock = vi.fn();
const updateProfileBasicMock = vi.fn();
vi.mock("@/lib/api/profile", () => ({
  fetchProfile: (...args: unknown[]) => fetchProfileMock(...args),
  updateProfileBasic: (...args: unknown[]) => updateProfileBasicMock(...args),
}));

const fetchEducationsMock = vi.fn();
const createEducationMock = vi.fn();
const updateEducationMock = vi.fn();
const deleteEducationMock = vi.fn();
vi.mock("@/lib/api/education", () => ({
  fetchEducations: (...args: unknown[]) => fetchEducationsMock(...args),
  createEducation: (...args: unknown[]) => createEducationMock(...args),
  updateEducation: (...args: unknown[]) => updateEducationMock(...args),
  deleteEducation: (...args: unknown[]) => deleteEducationMock(...args),
}));

const fetchCertificatesMock = vi.fn();
const createCertificateMock = vi.fn();
const updateCertificateMock = vi.fn();
const deleteCertificateMock = vi.fn();
vi.mock("@/lib/api/certificate", () => ({
  fetchCertificates: (...args: unknown[]) => fetchCertificatesMock(...args),
  createCertificate: (...args: unknown[]) => createCertificateMock(...args),
  updateCertificate: (...args: unknown[]) => updateCertificateMock(...args),
  deleteCertificate: (...args: unknown[]) => deleteCertificateMock(...args),
}));

const fetchExperiencesMock = vi.fn();
const createExperienceMock = vi.fn();
const updateExperienceMock = vi.fn();
const deleteExperienceMock = vi.fn();
vi.mock("@/lib/api/experience", () => ({
  fetchExperiences: (...args: unknown[]) => fetchExperiencesMock(...args),
  createExperience: (...args: unknown[]) => createExperienceMock(...args),
  updateExperience: (...args: unknown[]) => updateExperienceMock(...args),
  deleteExperience: (...args: unknown[]) => deleteExperienceMock(...args),
}));

// --- sample data ---
const sampleProfile = {
  name: "홍길동",
  birthDate: "1998-03-15",
  phone: "010-1234-5678",
  region: "서울",
  introduction: "백엔드 개발자 지망생이에요.",
  target: "BACKEND",
  careerYear: 0,
  targetJobs: [],
  onboardingCompleted: true,
};

const sampleEducation = {
  id: 1,
  level: "UNIVERSITY" as const,
  school: "한국대학교",
  major: "컴퓨터공학",
  startDate: "2018-03-01",
  endDate: "2022-02-28",
  gpa: 3.8,
  gpaMax: 4.5,
  status: "GRADUATED" as const,
  orderIndex: 0,
};

const sampleCertificate = {
  id: 2,
  name: "정보처리기사",
  issuer: "한국산업인력공단",
  acquiredAt: "2022-05-20",
  score: null,
  orderIndex: 0,
};

const sampleExperience = {
  id: 3,
  type: "INTERN" as const,
  name: "서버 인턴십",
  organization: "(주)예시기업",
  startDate: "2023-07-01",
  endDate: "2023-08-31",
  role: "백엔드",
  summary: "Spring Boot API 개발 참여",
  orderIndex: 0,
};

beforeEach(() => {
  fetchProfileMock.mockReset();
  updateProfileBasicMock.mockReset();
  fetchEducationsMock.mockReset();
  createEducationMock.mockReset();
  updateEducationMock.mockReset();
  deleteEducationMock.mockReset();
  fetchCertificatesMock.mockReset();
  createCertificateMock.mockReset();
  updateCertificateMock.mockReset();
  deleteCertificateMock.mockReset();
  fetchExperiencesMock.mockReset();
  createExperienceMock.mockReset();
  updateExperienceMock.mockReset();
  deleteExperienceMock.mockReset();
});

function setupAllMocks() {
  fetchProfileMock.mockResolvedValue(sampleProfile);
  fetchEducationsMock.mockResolvedValue([sampleEducation]);
  fetchCertificatesMock.mockResolvedValue([sampleCertificate]);
  fetchExperiencesMock.mockResolvedValue([sampleExperience]);
}

describe("ProfileView", () => {
  it("renders all 4 section headings", async () => {
    setupAllMocks();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("기본정보")).toBeInTheDocument());
    expect(screen.getByText("학력")).toBeInTheDocument();
    expect(screen.getByText("자격증")).toBeInTheDocument();
    expect(screen.getByText(/경험.*대외활동/)).toBeInTheDocument();
  });

  it("renders basic info from real data", async () => {
    setupAllMocks();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByDisplayValue("홍길동")).toBeInTheDocument());
    expect(screen.getByDisplayValue("010-1234-5678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("서울")).toBeInTheDocument();
  });

  it("renders education entry", async () => {
    setupAllMocks();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("한국대학교")).toBeInTheDocument());
    // major is rendered as a sibling span — getByText with exact:false works on partial
    expect(screen.getByText(/컴퓨터공학/)).toBeInTheDocument();
  });

  it("renders certificate entry", async () => {
    setupAllMocks();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("정보처리기사")).toBeInTheDocument());
    // issuer is concatenated with date in a single text node via JSX expression
    expect(screen.getByText(/한국산업인력공단/)).toBeInTheDocument();
  });

  it("renders experience entry", async () => {
    setupAllMocks();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("서버 인턴십")).toBeInTheDocument());
    // organization is a sibling span — use regex
    expect(screen.getByText(/예시기업/)).toBeInTheDocument();
  });

  it("shows empty state when education list is empty", async () => {
    fetchProfileMock.mockResolvedValue(sampleProfile);
    fetchEducationsMock.mockResolvedValue([]);
    fetchCertificatesMock.mockResolvedValue([]);
    fetchExperiencesMock.mockResolvedValue([]);
    render(<ProfileView />);
    await waitFor(() =>
      expect(screen.getByText(/아직 등록된 학력이 없어요/)).toBeInTheDocument()
    );
  });

  it("adding a 학력 entry calls createEducation", async () => {
    setupAllMocks();
    createEducationMock.mockResolvedValue({
      ...sampleEducation,
      id: 99,
      school: "서울대학교",
    });
    const user = userEvent.setup();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("학력")).toBeInTheDocument());

    // click 추가 button for 학력 section
    const addButtons = screen.getAllByRole("button", { name: /추가/ });
    const eduAddBtn = addButtons.find((b) => b.closest("[data-section='education']"));
    expect(eduAddBtn).toBeDefined();
    await user.click(eduAddBtn!);

    // fill in required fields
    const schoolInput = await screen.findByLabelText(/학교명/);
    await user.type(schoolInput, "서울대학교");

    // submit
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createEducationMock).toHaveBeenCalledWith(
        expect.objectContaining({ school: "서울대학교" })
      );
    });
  });

  it("deleting an education entry calls deleteEducation", async () => {
    setupAllMocks();
    deleteEducationMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("한국대학교")).toBeInTheDocument());

    // Scope to the education section to avoid positional fragility
    const eduSection = screen.getByTestId("section-education");
    const deleteBtn = within(eduSection).getByRole("button", { name: /삭제/ });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(deleteEducationMock).toHaveBeenCalledWith(1);
    });
  });

  it("basic-info save calls updateProfileBasic", async () => {
    setupAllMocks();
    updateProfileBasicMock.mockResolvedValue({ ...sampleProfile, name: "홍길동" });
    const user = userEvent.setup();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByDisplayValue("홍길동")).toBeInTheDocument());

    // Click the save button for basic info — exact match avoids hitting section save buttons
    const saveBtn = screen.getByRole("button", { name: "기본정보 저장" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(updateProfileBasicMock).toHaveBeenCalled();
    });
  });

  it("editing a 학력 entry calls updateEducation and updates the row", async () => {
    setupAllMocks();
    const updatedEdu = {
      ...sampleEducation,
      school: "서울과기대",
      major: "소프트웨어공학",
    };
    updateEducationMock.mockResolvedValue(updatedEdu);
    const user = userEvent.setup();
    render(<ProfileView />);
    await waitFor(() => expect(screen.getByText("한국대학교")).toBeInTheDocument());

    // Click the 편집 button in the education section
    const eduSection = screen.getByTestId("section-education");
    const editBtn = within(eduSection).getByRole("button", { name: /편집/ });
    await user.click(editBtn);

    // The edit form should appear pre-filled with the existing school name
    const schoolInput = await screen.findByDisplayValue("한국대학교");

    // Change the school name
    await user.clear(schoolInput);
    await user.type(schoolInput, "서울과기대");

    // Submit the edit form
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(updateEducationMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ school: "서울과기대" })
      );
    });

    // Row should now display the updated school name
    await waitFor(() => {
      expect(screen.getByText("서울과기대")).toBeInTheDocument();
    });
  });
});
