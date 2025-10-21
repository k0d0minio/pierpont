import supabase from "../../../lib/supabase";
export const dynamic = 'force-dynamic'
import { Heading } from "../../../../components/heading.jsx";
import DayNav from "./DayNav.jsx";
import DayViewClient from "./DayViewClient.jsx";

function formatDayDisplay(date) {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
  const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

export default async function DayPage({ params }) {
  const { date: dateParam } = await params; // expects YYYY-MM-DD
  const [y, m, d] = dateParam.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const { data: day } = await supabase
    .from('Day')
    .select('*, entries:Entry(*)')
    .eq('dateISO', date.toISOString())
    .single();

  // Filter entries by type
  const pdjGroups = day?.entries?.filter(e => e.type === 'breakfast') || [];
  const hotelEntries = day?.entries?.filter(e => e.type === 'hotel') || [];
  const golfEntries = day?.entries?.filter(e => e.type === 'golf') || [];
  const eventEntries = day?.entries?.filter(e => e.type === 'event') || [];
  const reservationEntries = day?.entries?.filter(e => e.type === 'reservation') || [];

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="mb-6">
        <DayNav dateParam={dateParam} />
      </div>
      <Heading level={1} className="mb-2 text-xl sm:text-2xl">{formatDayDisplay(date)}</Heading>
      <div className="text-sm text-zinc-500 mb-8 sm:hidden">Swipe left/right to navigate</div>
      
      <DayViewClient
        pdjGroups={pdjGroups}
        hotelEntries={hotelEntries}
        golfEntries={golfEntries}
        eventEntries={eventEntries}
        reservationEntries={reservationEntries}
        dateParam={dateParam}
      />
    </div>
  );
}

export function generateStaticParams() {
  return []
}

