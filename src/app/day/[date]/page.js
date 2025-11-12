import supabase from "../../../lib/supabase";
export const dynamic = 'force-dynamic'
import { Heading } from "../../../../components/heading.jsx";
import { AdminIndicator } from "../../../../components/admin-indicator.jsx";
import DayNav from "./DayNav.jsx";
import DayViewClient from "./DayViewClient.jsx";
import { ensureDayExists } from "../../actions/days";
import { parseYmd, isPastDate, getTodayBrusselsUtc, formatYmd, isDateWithinOneYear } from "../../../lib/day-utils";
import { redirect } from "next/navigation";

function formatDayDisplay(date) {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
  const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function DayPage({ params }) {
  const { date: dateParam } = await params; // expects YYYY-MM-DD
  const date = parseYmd(dateParam);
  const todayUtc = getTodayBrusselsUtc();

  // If the requested date is in the past, redirect to today
  if (isPastDate(date)) {
    redirect(`/day/${formatYmd(todayUtc)}`);
  }

  // If the requested date is beyond 1 year, redirect to today
  if (!isDateWithinOneYear(date)) {
    redirect(`/day/${formatYmd(todayUtc)}`);
  }

  // Ensure the requested day exists in the database
  await ensureDayExists(date.toISOString());

  // Query hotel bookings that overlap with this date
  // A booking overlaps if: checkInDate <= date < checkOutDate
  const { data: hotelBookings } = await supabase
    .from('HotelBooking')
    .select('*, breakfastConfigurations:BreakfastConfiguration(*)')
    .lte('checkInDate', dateParam)
    .gt('checkOutDate', dateParam)
    .order('checkInDate', { ascending: true });

  // Query breakfast configurations for this day
  const { data: breakfastConfigs } = await supabase
    .from('BreakfastConfiguration')
    .select('*, hotelBooking:HotelBooking(*)')
    .eq('breakfastDate', dateParam)
    .order('startTime', { ascending: true, nullsFirst: true });

  // Query other entry types (golf, event, reservation) with venue type and POC info
  const { data: day } = await supabase
    .from('Day')
    .select('*, entries:Entry(*, venueType:VenueType(*), poc:PointOfContact(*))')
    .eq('dateISO', date.toISOString())
    .single();

  const golfEntries = day?.entries?.filter(e => e.type === 'golf') || [];
  const eventEntries = day?.entries?.filter(e => e.type === 'event') || [];
  const reservationEntries = day?.entries?.filter(e => e.type === 'reservation') || [];

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-6">
        <DayNav dateParam={dateParam} />
        <AdminIndicator />
      </div>
      <Heading level={1} className="mb-2 text-xl sm:text-2xl">{formatDayDisplay(date)}</Heading>
      <div className="text-sm text-zinc-500 mb-8 sm:hidden">Swipe left/right to navigate</div>
      
      <DayViewClient
        hotelBookings={hotelBookings || []}
        breakfastConfigs={breakfastConfigs || []}
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

