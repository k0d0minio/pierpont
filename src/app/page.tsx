import supabase from "../lib/supabase";
import { AdminIndicator } from "@/components/admin-indicator";
import { getTodayBrusselsUtc, getMonthDateRange, dateFromYmdUtc, addDays, formatYmd } from "../lib/day-utils";
import { ensureDaysRange } from "./actions/days";
import { checkAuthStatus } from "./actions/auth";
import { redirect } from "next/navigation";
import HomeClient from "@/components/HomeClient";

// Avoid build-time prerender hitting the database on Vercel
export const dynamic = 'force-dynamic'

type HomeProps = {
  searchParams: Promise<{ month?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Check authentication status - redirect non-admin users to today's day view
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) {
    const todayUtc = getTodayBrusselsUtc();
    redirect(`/day/${formatYmd(todayUtc)}`);
  }
  
  const resolvedSearchParams = await searchParams;
  
  // Get today's date in Brussels timezone
  const todayUtc = getTodayBrusselsUtc();
  
  // Parse month from search params (format: YYYY-MM)
  let monthStartDate = todayUtc;
  if (resolvedSearchParams?.month) {
    try {
      const [year, month] = resolvedSearchParams.month.split('-').map(Number);
      if (year && month && month >= 1 && month <= 12) {
        monthStartDate = dateFromYmdUtc({ year, month, day: 1 });
      }
      } catch {
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
    .select('*, entries:Entry(*, venueType:VenueType(*), poc:PointOfContact(*))')
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
    .gte('checkOutDate', startDateStr)
    .order('checkInDate', { ascending: true });

  // Query breakfast configurations for the month range
  const { data: breakfastConfigs } = await supabase
    .from('BreakfastConfiguration')
    .select('*')
    .gte('breakfastDate', startDateStr)
    .lte('breakfastDate', endDateStr);

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden">
      <AdminIndicator />
      
      <div className="flex-1 min-h-0">
        <HomeClient
          initialDays={days || []}
          initialHotelBookings={hotelBookings || []}
          initialBreakfastConfigs={breakfastConfigs || []}
          isCurrentMonth={monthRange.startDate <= todayUtc && monthRange.endDate >= todayUtc}
          monthStartDate={monthRange.startDate}
          monthEndDate={monthRange.endDate}
        />
      </div>
    </div>
  );
}
