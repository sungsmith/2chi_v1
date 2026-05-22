import { CalendarContent } from "@/components/applications/calendar-content";

export const metadata = {
  title: "캘린더 · 2chi",
};

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <CalendarContent month={sp.month} />;
}
