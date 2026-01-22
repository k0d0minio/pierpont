"use server"

import supabase from "../../lib/supabase"
import {
  weekdayNameBrussels,
  addDays,
  getTodayBrusselsUtc,
} from "../../lib/day-utils"

type ActionResponse = {
  ok: boolean;
  error?: string;
  created?: number;
}

/**
 * Ensure a single day exists in the database
 * @param dateISO - ISO string of the date
 * @returns Promise with action result
 */
export async function ensureDayExists(dateISO: string): Promise<ActionResponse> {
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
  } catch (e: unknown) {
    console.error('Error ensuring day exists:', e)
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, error }
  }
}

/**
 * Ensure a range of days exists in the database
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Promise with action result and created count
 */
export async function ensureDaysRange(startDate: Date, endDate: Date): Promise<ActionResponse> {
  try {
    const days: Array<{ dateISO: string; weekday: string }> = []
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
  } catch (e: unknown) {
    console.error('Error ensuring days range:', e)
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, error }
  }
}

/**
 * Ensure default date range exists (today + next 13 days = 14 days total)
 * @deprecated This function is no longer used. Days are created on-demand when needed.
 * @returns Promise with action result and created count
 */
export async function ensureDefaultDateRange(): Promise<ActionResponse> {
  const todayUtc = getTodayBrusselsUtc()
  const endDate = addDays(todayUtc, 13) // today + 13 more days = 14 total
  return await ensureDaysRange(todayUtc, endDate)
}
