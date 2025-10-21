"use client"

import clsx from 'clsx'
import { Badge } from './badge'
import { Link } from './link'

// Helper functions for date formatting
function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
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

export function DayCard({ day, entries }) {
  const dateObj = new Date(day.dateISO)
  
  // Process entries by type
  const pdjGroups = entries?.filter(e => e.type === 'breakfast') || []
  const hotelEntries = entries?.filter(e => e.type === 'hotel') || []
  const golfEntries = entries?.filter(e => e.type === 'golf') || []
  const eventEntries = entries?.filter(e => e.type === 'event') || []
  
  // Calculate summaries
  const pdj = summarizePDJ(pdjGroups)
  const hotel = sumSizes(hotelEntries)
  const golfTitle = golfEntries?.[0]?.title || ""
  const eventTitle = eventEntries?.[0]?.title || ""
  
  return (
    <Link 
      href={`/day/${formatYmd(dateObj)}`}
      className="group block"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 hover:-translate-y-1">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              {formatDayDisplay(dateObj)}
            </h3>
            <div className="flex items-center gap-2">
              {golfTitle && <Badge color="emerald" className="text-xs">Golf</Badge>}
              {eventTitle && <Badge color="sky" className="text-xs">Events</Badge>}
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Breakfast</span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {pdj.total > 0 ? pdj.total : "—"}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Hotel Guests</span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {hotel > 0 ? hotel : "—"}
            </span>
          </div>
        </div>

      </div>
    </Link>
  )
}

// Helper functions (moved from main page)
function summarizePDJ(pdjGroups) {
  if (!pdjGroups || pdjGroups.length === 0) return { pattern: "—", total: 0, ambiguous: false }
  const sizes = pdjGroups.map((g) => g.size).filter((n) => Number.isFinite(n))
  const pattern = sizes.length ? sizes.join("+") : "—"
  const total = sizes.reduce((a, b) => a + b, 0)
  const ambiguous = pdjGroups.some((g) => g.isAmbiguous)
  return { pattern, total, ambiguous }
}

function sumSizes(entries) {
  if (!entries || entries.length === 0) return 0
  return entries
    .map((e) => e.size)
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0)
}
