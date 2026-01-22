import supabase from "@/lib/supabase";
export const dynamic = 'force-dynamic'
import { AdminIndicator } from "@/components/admin-indicator";
import DayNav from "./DayNav";
import DayViewClient from "./DayViewClient";
import { DayDatePicker } from "@/components/day-date-picker";
import { ensureDayExists } from "../../actions/days";
import { parseYmd, isPastDate, getTodayBrusselsUtc, formatYmd, isDateWithinOneYear } from "@/lib/day-utils";
import { redirect } from "next/navigation";

function formatDayDisplay(date: Date): string {
  const weekday = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
  const dayNum = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

type DayPageProps = {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const resolvedParams = await params;
  const { date: dateParam } = resolvedParams; // expects YYYY-MM-DD
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
  // A booking overlaps if: checkInDate <= date <= checkOutDate
  const { data: hotelBookings } = await supabase
    .from('HotelBooking')
    .select('*, breakfastConfigurations:BreakfastConfiguration(*)')
    .lte('checkInDate', dateParam)
    .gte('checkOutDate', dateParam)
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

  const golfEntries = day?.entries?.filter((e: any) => e.type === 'golf') || [];
  const eventEntries = day?.entries?.filter((e: any) => e.type === 'event') || [];
  const reservationEntries = day?.entries?.filter((e: any) => e.type === 'reservation') || [];

  return (
    <div className="font-sans min-h-screen p-4 sm:p-6 lg:p-10">
      <AdminIndicator />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        <DayDatePicker dateParam={dateParam} />
      </div>
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
