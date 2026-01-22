"use client"

import { useState } from 'react'
import { Coffee, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { BreakfastConfiguration, HotelBooking, Entry } from '@/types/supabase'

type BreakfastConfigWithRelations = BreakfastConfiguration & {
  hotelBooking?: HotelBooking;
}

type EntryWithRelations = Entry & {
  venueType?: unknown;
  poc?: unknown;
}

type DaySummaryCardProps = {
  breakfastConfigs: BreakfastConfigWithRelations[];
  reservationEntries: EntryWithRelations[];
  totalBreakfastGuests: number;
  totalReservationGuests: number;
}

// Format table breakdown for display
const formatTableBreakdown = (breakdown: unknown): string => {
  if (!breakdown) return ''
  if (Array.isArray(breakdown)) {
    return breakdown.join('+')
  }
  if (typeof breakdown === 'string') {
    try {
      const parsed = JSON.parse(breakdown)
      if (Array.isArray(parsed)) {
        return parsed.join('+')
      }
    } catch {
      return breakdown
    }
  }
  return ''
}

export function DaySummaryCard({
  breakfastConfigs,
  reservationEntries,
  totalBreakfastGuests,
  totalReservationGuests
}: DaySummaryCardProps) {
  const [breakfastPopoverOpen, setBreakfastPopoverOpen] = useState(false)
  const [reservationPopoverOpen, setReservationPopoverOpen] = useState(false)

  return (
    <div className="mb-8 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Today&apos;s Summary
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Breakfast Summary */}
        <Popover open={breakfastPopoverOpen} onOpenChange={setBreakfastPopoverOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="text-left bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Breakfasts
                  </span>
                </div>
                {breakfastConfigs.length > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    {breakfastPopoverOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-1">
                {totalBreakfastGuests}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {totalBreakfastGuests === 1 ? 'guest' : 'guests'}
                {breakfastConfigs.length > 0 && (
                  <span className="ml-1">
                    • {breakfastConfigs.length} {breakfastConfigs.length === 1 ? 'booking' : 'bookings'}
                  </span>
                )}
              </div>
            </button>
          </PopoverTrigger>
          {breakfastConfigs.length > 0 && (
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Breakfast Details
                </h3>
                {breakfastConfigs.map((config) => {
                  const breakdown = formatTableBreakdown(config.tableBreakdown)
                  return (
                    <div
                      key={config.id}
                      className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            {config.hotelBooking?.guestName || 'Unnamed Guest'}
                          </div>
                          {config.hotelBooking?.roomNumber && (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                              Room: {config.hotelBooking.roomNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-amber-700 dark:text-amber-300">
                            {config.totalGuests || 0}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {config.totalGuests === 1 ? 'guest' : 'guests'}
                          </div>
                        </div>
                      </div>
                      {breakdown && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                          Tables: {breakdown}
                        </div>
                      )}
                      {config.startTime && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Time: {config.startTime}
                        </div>
                      )}
                      {config.notes && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                          {config.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          )}
        </Popover>

        {/* Reservation Summary */}
        <Popover open={reservationPopoverOpen} onOpenChange={setReservationPopoverOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="text-left bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Reservations
                  </span>
                </div>
                {reservationEntries.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    {reservationPopoverOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                {totalReservationGuests}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {totalReservationGuests === 1 ? 'guest' : 'guests'}
                {reservationEntries.length > 0 && (
                  <span className="ml-1">
                    • {reservationEntries.length} {reservationEntries.length === 1 ? 'reservation' : 'reservations'}
                  </span>
                )}
              </div>
            </button>
          </PopoverTrigger>
          {reservationEntries.length > 0 && (
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Reservation Details
                </h3>
                {reservationEntries.map((entry) => {
                  const timeRange = entry.startTime && entry.endTime
                    ? `${entry.startTime} - ${entry.endTime}`
                    : entry.startTime
                    ? `From ${entry.startTime}`
                    : entry.endTime
                    ? `Until ${entry.endTime}`
                    : null

                  return (
                    <div
                      key={entry.id}
                      className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            {entry.guestName || 'Unnamed Guest'}
                          </div>
                          {entry.phoneNumber && (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                              Phone: {entry.phoneNumber}
                            </div>
                          )}
                          {entry.email && (
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              Email: {entry.email}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-purple-700 dark:text-purple-300">
                            {entry.guestCount || 0}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {entry.guestCount === 1 ? 'guest' : 'guests'}
                          </div>
                        </div>
                      </div>
                      {timeRange && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                          Time: {timeRange}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                          {entry.notes}
                        </div>
                      )}
                      {entry.isTourOperator && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                          Tour Operator
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  )
}
