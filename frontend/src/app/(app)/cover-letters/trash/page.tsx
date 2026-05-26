import { TrashContent } from "@/components/cover-letters/trash-content";
import { TRASH_MOCK } from "@/lib/mock/cover-letters";

export default function CoverLettersTrashPage() {
  return <TrashContent data={TRASH_MOCK} />;
}
