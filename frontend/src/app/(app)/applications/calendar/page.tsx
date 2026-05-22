import { CalendarContent } from "@/components/applications/calendar-content";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <CalendarContent month={sp.month} />;
}
