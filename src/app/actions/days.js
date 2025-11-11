"use server"

import supabase from "../../lib/supabase"
import {
  getBrusselsYmd,
  dateFromYmdUtc,
  weekdayNameBrussels,
  addDays,
  getTodayBrusselsUtc,
} from "../../lib/day-utils"

/**
 * Ensure a single day exists in the database
 * @param {string} dateISO - ISO string of the date
 * @returns {{ok: boolean, error?: string}}
 */
export async function ensureDayExists(dateISO) {
  try {
    const date = new Date(dateISO)
    const weekday = weekdayNameBrussels(date)

    const { error } = await supabase
      .from('Day')
      .upsert({
        dateISO: date.toISOString(),
        weekday
      }, { onConflict: 'dateISO' })

    if (error) {
      console.error('Failed to ensure day exists:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (e) {
    console.error('Error ensuring day exists:', e)
    return { ok: false, error: e?.message || 'Unknown error' }
  }
}

/**
 * Ensure a range of days exists in the database
 * @param {Date} startDate - Start date (inclusive)
 * @param {Date} endDate - End date (inclusive)
 * @returns {{ok: boolean, error?: string, created?: number}}
 */
export async function ensureDaysRange(startDate, endDate) {
  try {
    const days = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    // Generate all days in the range
    while (current <= end) {
      const weekday = weekdayNameBrussels(current)
      days.push({
        dateISO: new Date(current).toISOString(),
        weekday
      })
      current.setUTCDate(current.getUTCDate() + 1)
    }

    // Upsert all days at once
    const { error } = await supabase
      .from('Day')
      .upsert(days, { onConflict: 'dateISO' })

    if (error) {
      console.error('Failed to ensure days range:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, created: days.length }
  } catch (e) {
    console.error('Error ensuring days range:', e)
    return { ok: false, error: e?.message || 'Unknown error' }
  }
}

/**
 * Ensure default date range exists (today + next 13 days = 14 days total)
 * @returns {{ok: boolean, error?: string, created?: number}}
 */
export async function ensureDefaultDateRange() {
  const todayUtc = getTodayBrusselsUtc()
  const endDate = addDays(todayUtc, 13) // today + 13 more days = 14 total
  return await ensureDaysRange(todayUtc, endDate)
}

