import supabase from "../lib/supabase";
import { Heading } from "../../components/heading.jsx";
import { DayCard } from "../../components/day-card.jsx";
import { AdminIndicator } from "../../components/admin-indicator.jsx";
import { Logo } from "../../components/logo.jsx";

// Avoid build-time prerender hitting the database on Vercel
export const dynamic = 'force-dynamic'

function getBrusselsYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year").value);
  const m = Number(parts.find((p) => p.type === "month").value);
  const d = Number(parts.find((p) => p.type === "day").value);
  return { year: y, month: m, day: d };
}

function dateFromYmdUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
}

function weekdayNumberBrussels(date) {
  const name = weekdayNameBrussels(date);
  const map = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  return map[name];
}

function getWeekRangeForBrussels(date = new Date()) {
  const ymd = getBrusselsYmd(date);
  const today = dateFromYmdUtc(ymd);
  const dow = weekdayNumberBrussels(today);
  const monday = addDays(today, -(dow - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function formatDayDisplay(date) {
  const weekday = weekdayNameBrussels(date);
  const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

function formatYmd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


export default async function Home() {
  const { data: days } = await supabase
    .from('Day')
    .select('*, entries:Entry(*)')
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
