"use client"

import { Building, LandPlot, Calendar, ChevronDown, Coffee, Users } from 'lucide-react'

export function DayPageSkeleton() {
  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
      <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-8 sm:hidden animate-pulse" />

      <div className="space-y-8">
        {/* Summary Card skeleton - matches DaySummaryCard structure */}
        <div className="mb-8 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-lg">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Breakfast card skeleton */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mb-1 animate-pulse" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            {/* Reservations card skeleton */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mb-1 animate-pulse" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Hotel Bookings Section skeleton - collapsed state for non-admin */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <Building className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          {/* Section is collapsed, so no content shown */}
        </section>

        {/* Golf Section skeleton - collapsed state for non-admin */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <LandPlot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          {/* Section is collapsed, so no content shown */}
        </section>

        {/* Events Section skeleton - collapsed state for non-admin */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          {/* Section is collapsed, so no content shown */}
        </section>
      </div>
    </div>
  )
}
