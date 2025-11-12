/**
 * Shared utilities for day management and date calculations
 * All dates are calculated in Brussels timezone (Europe/Brussels)
 */

/**
 * Get Brussels date components (year, month, day) from a Date object
 * @param {Date} date - Date object (defaults to now)
 * @returns {{year: number, month: number, day: number}}
 */
export function getBrusselsYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = Number(parts.find((p) => p.type === 'year').value)
  const m = Number(parts.find((p) => p.type === 'month').value)
  const d = Number(parts.find((p) => p.type === 'day').value)
  return { year: y, month: m, day: d }
}

/**
 * Create a UTC Date object from year, month, day components
 * @param {{year: number, month: number, day: number}} ymd
 * @returns {Date}
 */
export function dateFromYmdUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * Add days to a date
 * @param {Date} date
 * @param {number} n - Number of days to add (can be negative)
 * @returns {Date}
 */
export function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

/**
 * Get weekday name in Brussels timezone
 * @param {Date} date
 * @returns {string}
 */
export function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'long' }).format(date)
}

/**
 * Get today's date in Brussels timezone as UTC Date object
 * @returns {Date}
 */
export function getTodayBrusselsUtc() {
  const todayYmd = getBrusselsYmd(new Date())
  return dateFromYmdUtc(todayYmd)
}

/**
 * Get date range for default calendar view (today + next 13 days = 14 days total)
 * @deprecated Use getMonthDateRange() instead for month-based pagination
 * @returns {Date[]} Array of 14 Date objects
 */
export function getDefaultDateRange() {
  const todayUtc = getTodayBrusselsUtc()
  return Array.from({ length: 14 }, (_, i) => addDays(todayUtc, i))
}

/**
 * Get date range for a month starting from the given date
 * @param {Date} startDate - First day of the month (will be normalized to first day of month in Brussels timezone)
 * @returns {{startDate: Date, endDate: Date, dates: Date[]}} Object with start/end dates and array of all dates in the month
 */
export function getMonthDateRange(startDate) {
  const start = new Date(startDate)
  const brusselsYmd = getBrusselsYmd(start)
  
  // Get first day of the month
  const firstDay = dateFromYmdUtc({ year: brusselsYmd.year, month: brusselsYmd.month, day: 1 })
  
  // Get first day of next month
  let nextMonth = brusselsYmd.month + 1
  let nextYear = brusselsYmd.year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const firstDayNextMonth = dateFromYmdUtc({ year: nextYear, month: nextMonth, day: 1 })
  
  // Last day of the month is one day before first day of next month
  const lastDay = addDays(firstDayNextMonth, -1)
  
  // Generate all dates in the month
  const dates = []
  let current = new Date(firstDay)
  while (current <= lastDay) {
    dates.push(new Date(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  
  return {
    startDate: firstDay,
    endDate: lastDay,
    dates
  }
}

/**
 * Check if a date is within 1 year from today (in Brussels timezone)
 * @param {Date} date
 * @returns {boolean}
 */
export function isDateWithinOneYear(date) {
  const todayUtc = getTodayBrusselsUtc()
  const oneYearFromToday = addDays(todayUtc, 365)
  return date >= todayUtc && date <= oneYearFromToday
}

/**
 * Check if a date is in the past (before today in Brussels timezone)
 * @param {Date} date
 * @returns {boolean}
 */
export function isPastDate(date) {
  const todayUtc = getTodayBrusselsUtc()
  return date < todayUtc
}

/**
 * Format date as YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
export function formatYmd(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse YYYY-MM-DD string to UTC Date object
 * @param {string} ymd
 * @returns {Date}
 */
export function parseYmd(ymd) {
  const [y, m, d] = ymd.split('-').map((n) => Number(n))
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

