'use client'

import { DayCard } from '../../../components/day-card.jsx'
import MonthPagination from './MonthPagination'
import { useRealtimeMonthSchedule } from '../../hooks/useRealtimeMonthSchedule'
import { useSearchParams } from 'next/navigation'

export default function HomeClient({
  initialDays = [],
  initialHotelBookings = [],
  initialBreakfastConfigs = [],
  monthName,
  prevMonthUrl,
  nextMonthUrl,
  canGoNext,
  isCurrentMonth
}) {
  const searchParams = useSearchParams()
  const monthParam = searchParams?.get('month') || null

  // Use real-time hook to get live updates
  const {
    days,
    hotelBookings,
    breakfastConfigs,
    isConnected
  } = useRealtimeMonthSchedule(
    monthParam,
    initialDays,
    initialHotelBookings,
    initialBreakfastConfigs
  )

  return (
    <>
      {/* Month Pagination */}
      <MonthPagination 
        monthName={monthName}
        prevMonthUrl={prevMonthUrl}
        nextMonthUrl={nextMonthUrl}
        canGoNext={canGoNext}
        isCurrentMonth={isCurrentMonth}
      />
      
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
        {days?.map((day) => {
          const dateStr = day.dateISO.split('T')[0]
          // Filter bookings active on this day
          const dayBookings = (hotelBookings || []).filter(booking => {
            return dateStr >= booking.checkInDate && dateStr < booking.checkOutDate
          })
          // Filter breakfast configs for this day
          const dayBreakfastConfigs = (breakfastConfigs || []).filter(config => config.breakfastDate === dateStr)
          
          return (
            <DayCard
              key={day.id}
              day={day}
              entries={day.entries}
              hotelBookings={dayBookings}
              breakfastConfigs={dayBreakfastConfigs}
            />
          )
        })}
      </div>
      
      {days?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">No days found for this month</p>
        </div>
      )}
    </>
  )
}

