import supabase from "../lib/supabase";
import { Heading } from "../../components/heading.jsx";
import { DayCard } from "../../components/day-card.jsx";
import { AdminIndicator } from "../../components/admin-indicator.jsx";
import { Logo } from "../../components/logo.jsx";
import { ensureDefaultDateRange } from "./actions/days";
import { getTodayBrusselsUtc } from "../lib/day-utils";

// Avoid build-time prerender hitting the database on Vercel
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Ensure default date range exists (today + next 13 days)
  await ensureDefaultDateRange();

  // Get today's date in Brussels timezone for filtering
  const todayUtc = getTodayBrusselsUtc();

  // Query days, filtering out past days and ordering by date
  const { data: days } = await supabase
    .from('Day')
    .select('*, entries:Entry(*)')
    .gte('dateISO', todayUtc.toISOString())
    .order('dateISO', { ascending: true });

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <Logo size="xl" />
        <AdminIndicator />
      </div>
      
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {days?.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            entries={day.entries}
          />
        ))}
      </div>
      
      {days?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">No days found</p>
        </div>
      )}
    </div>
  );
}
