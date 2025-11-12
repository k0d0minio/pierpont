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

export function DayCard({ day, entries, hotelBookings = [], breakfastConfigs = [] }) {
  const dateObj = new Date(day.dateISO)
  
  // Process entries by type (for golf, events, etc.)
  const golfEntries = entries?.filter(e => e.type === 'golf') || []
  const eventEntries = entries?.filter(e => e.type === 'event') || []
  
  // Calculate summaries from new hotel booking structure
  const totalBreakfastGuests = breakfastConfigs.reduce((sum, config) => sum + (config.totalGuests || 0), 0)
  const totalHotelGuests = hotelBookings.reduce((sum, booking) => sum + (booking.guestCount || 0), 0)
  
  // Format breakfast breakdown pattern
  const formatBreakfastPattern = () => {
    if (breakfastConfigs.length === 0) return null
    const patterns = breakfastConfigs
      .map(config => {
        if (!config.tableBreakdown) return null
        let breakdown = config.tableBreakdown
        if (typeof breakdown === 'string') {
          try {
            breakdown = JSON.parse(breakdown)
          } catch {
            return breakdown
          }
        }
        if (Array.isArray(breakdown)) {
          return breakdown.join('+')
        }
        return null
      })
      .filter(Boolean)
    return patterns.length > 0 ? patterns.join(', ') : null
  }
  
  const breakfastPattern = formatBreakfastPattern()
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
              {totalBreakfastGuests > 0 ? (
                <>
                  {totalBreakfastGuests}
                  {breakfastPattern && (
                    <span className="text-zinc-500 dark:text-zinc-400 ml-1">({breakfastPattern})</span>
                  )}
                </>
              ) : "—"}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Hotel Guests</span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {totalHotelGuests > 0 ? totalHotelGuests : "—"}
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
  const sizes = pdjGroups.map((g) => g.guestCount).filter((n) => Number.isFinite(n))
  const pattern = sizes.length ? sizes.join("+") : "—"
  const total = sizes.reduce((a, b) => a + b, 0)
  const ambiguous = pdjGroups.some((g) => g.isAmbiguous)
  return { pattern, total, ambiguous }
}

function sumSizes(entries) {
  if (!entries || entries.length === 0) return 0
  return entries
    .map((e) => e.guestCount)
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0)
}
