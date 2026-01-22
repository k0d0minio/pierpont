"use client"

import { Coffee, Users } from 'lucide-react'
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
  return (
    <div className="mb-6 sm:mb-8 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 shadow-lg">
      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4">
        Résumé du jour
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Breakfast Summary */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Petit-déjeuners
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300 mb-1">
            {totalBreakfastGuests}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 sm:mb-4">
            {totalBreakfastGuests === 1 ? 'invité' : 'invités'}
            {breakfastConfigs.length > 0 && (
              <span className="ml-1">
                • {breakfastConfigs.length} {breakfastConfigs.length === 1 ? 'réservation' : 'réservations'}
              </span>
            )}
          </div>
          {breakfastConfigs.length > 0 && (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-200 dark:border-amber-700">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3 flex items-center gap-2">
                <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                Détails du petit-déjeuner
              </h3>
              {breakfastConfigs.map((config) => {
                const breakdown = formatTableBreakdown(config.tableBreakdown)
                return (
                  <div
                    key={config.id}
                    className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 sm:p-3"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                          {config.hotelBooking?.guestName || 'Invité sans nom'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-semibold text-amber-700 dark:text-amber-300">
                          {config.totalGuests || 0}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {config.totalGuests === 1 ? 'invité' : 'invités'}
                        </div>
                      </div>
                    </div>
                    {breakdown && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                        Tables : {breakdown}
                      </div>
                    )}
                    {config.startTime && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Heure : {config.startTime}
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
          )}
        </div>

        {/* Reservation Summary */}
        <div className="bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Réservations
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
            {totalReservationGuests}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 sm:mb-4">
            {totalReservationGuests === 1 ? 'invité' : 'invités'}
            {reservationEntries.length > 0 && (
              <span className="ml-1">
                • {reservationEntries.length} {reservationEntries.length === 1 ? 'réservation' : 'réservations'}
              </span>
            )}
          </div>
          {reservationEntries.length > 0 && (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-purple-200 dark:border-purple-700">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                Détails de la réservation
              </h3>
              {reservationEntries.map((entry) => {
                const timeRange = entry.startTime && entry.endTime
                  ? `${entry.startTime} - ${entry.endTime}`
                  : entry.startTime
                  ? `À partir de ${entry.startTime}`
                  : entry.endTime
                  ? `Jusqu'à ${entry.endTime}`
                  : null

                return (
                  <div
                    key={entry.id}
                    className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2.5 sm:p-3"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                          {entry.guestName || 'Invité sans nom'}
                        </div>
                        {entry.phoneNumber && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 break-all">
                            Téléphone : {entry.phoneNumber}
                          </div>
                        )}
                        {entry.email && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 break-all">
                            Email : {entry.email}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-semibold text-purple-700 dark:text-purple-300">
                          {entry.guestCount || 0}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {entry.guestCount === 1 ? 'invité' : 'invités'}
                        </div>
                      </div>
                    </div>
                    {timeRange && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                        Heure : {timeRange}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                        {entry.notes}
                      </div>
                    )}
                    {entry.isTourOperator && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                        Opérateur touristique
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
