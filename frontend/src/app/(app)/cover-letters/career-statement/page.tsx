import { CareerStatementContent } from "@/components/cover-letters/career-statement-content";
import { POSTINGS_FOR_PICKER_MOCK, CAREER_STATEMENT_RESULT_MOCK } from "@/lib/mock/cover-letters";

export default function CoverLettersCareerStatementPage() {
  return <CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />;
}
