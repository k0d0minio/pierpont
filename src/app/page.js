import supabase from "../lib/supabase";
import { Heading } from "../../components/heading.jsx";
import { AdminIndicator } from "../../components/admin-indicator.jsx";
import { Logo } from "../../components/logo.jsx";
import { getTodayBrusselsUtc, getMonthDateRange, parseYmd, formatYmd, getBrusselsYmd, dateFromYmdUtc, addDays } from "../lib/day-utils";
import { ensureDaysRange } from "./actions/days";
import HomeClient from "./components/HomeClient";

// Avoid build-time prerender hitting the database on Vercel
export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }) {
  // Get today's date in Brussels timezone
  const todayUtc = getTodayBrusselsUtc();
  
  // Parse month from search params (format: YYYY-MM)
  let monthStartDate = todayUtc;
  if (searchParams?.month) {
    try {
      const [year, month] = searchParams.month.split('-').map(Number);
      if (year && month && month >= 1 && month <= 12) {
        monthStartDate = dateFromYmdUtc({ year, month, day: 1 });
      }
    } catch (e) {
      // Invalid month param, use today
      monthStartDate = todayUtc;
    }
  }

  // Get month date range
  const monthRange = getMonthDateRange(monthStartDate);
  
  // Ensure all days in the month exist (on-demand creation)
  // Only create days from today onwards, not past days
  const startDate = monthRange.startDate < todayUtc ? todayUtc : monthRange.startDate;
  await ensureDaysRange(startDate, monthRange.endDate);

  // Query days for the month, filtering out past days
  const { data: days } = await supabase
    .from('Day')
    .select('*, entries:Entry(*)')
    .gte('dateISO', startDate.toISOString())
    .lte('dateISO', monthRange.endDate.toISOString())
    .order('dateISO', { ascending: true });

  // Query hotel bookings that overlap with the month range
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = monthRange.endDate.toISOString().split('T')[0];
  const { data: hotelBookings } = await supabase
    .from('HotelBooking')
    .select('*')
    .lt('checkInDate', addDays(monthRange.endDate, 1).toISOString().split('T')[0])
    .gt('checkOutDate', startDateStr)
    .order('checkInDate', { ascending: true });

  // Query breakfast configurations for the month range
  const { data: breakfastConfigs } = await supabase
    .from('BreakfastConfiguration')
    .select('*')
    .gte('breakfastDate', startDateStr)
    .lte('breakfastDate', endDateStr);

  // Format month name for display
  const monthName = new Intl.DateTimeFormat('en-GB', { 
    timeZone: 'Europe/Brussels', 
    month: 'long', 
    year: 'numeric' 
  }).format(monthRange.startDate);

  // Calculate previous and next month URLs
  const brusselsYmd = getBrusselsYmd(monthRange.startDate);
  let prevMonth = brusselsYmd.month - 1;
  let prevYear = brusselsYmd.year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  let nextMonth = brusselsYmd.month + 1;
  let nextYear = brusselsYmd.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  const prevMonthUrl = `/?month=${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const nextMonthUrl = `/?month=${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  
  // Check if next month is beyond 1 year limit
  const oneYearFromToday = dateFromYmdUtc(getBrusselsYmd(addDays(todayUtc, 365)));
  const nextMonthDate = dateFromYmdUtc({ year: nextYear, month: nextMonth, day: 1 });
  const canGoNext = nextMonthDate <= oneYearFromToday;

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <Logo size="xl" />
        <AdminIndicator />
      </div>
      
      <HomeClient
        initialDays={days || []}
        initialHotelBookings={hotelBookings || []}
        initialBreakfastConfigs={breakfastConfigs || []}
        monthName={monthName}
        prevMonthUrl={prevMonthUrl}
        nextMonthUrl={nextMonthUrl}
        canGoNext={canGoNext}
        isCurrentMonth={monthRange.startDate <= todayUtc && monthRange.endDate >= todayUtc}
      />
    </div>
  );
}
