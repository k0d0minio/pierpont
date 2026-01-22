'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { CalendarDaySidebar } from '@/components/CalendarDaySidebar'
import { getTodayBrusselsUtc, formatYmd, parseYmd, getMonthDateRange, addDays } from '@/lib/day-utils'
import type { Day, HotelBooking, BreakfastConfiguration, Entry } from '@/types/supabase'
import { Circle } from 'lucide-react'
import supabase from '@/lib/supabase'
import type { DayButtonProps } from 'react-day-picker'

type DayWithEntries = Day & {
  entries?: Entry[];
}

type HomeClientProps = {
  initialDays?: DayWithEntries[];
  initialHotelBookings?: HotelBooking[];
  initialBreakfastConfigs?: BreakfastConfiguration[];
  isCurrentMonth: boolean;
  monthStartDate: Date;
  monthEndDate: Date;
}

type DayData = {
  hotelBookings: HotelBooking[];
  breakfastConfigs: BreakfastConfiguration[];
  golfEntries: Entry[];
  eventEntries: Entry[];
  reservationEntries: Entry[];
}


export default function HomeClient({
  initialDays = [],
  initialHotelBookings = [],
  initialBreakfastConfigs = [],
  isCurrentMonth,
  monthStartDate
}: HomeClientProps) {
  const todayUtc = getTodayBrusselsUtc()
  const currentYear = todayUtc.getUTCFullYear()
  const maxYear = currentYear + 2 // Show current year and next 2 years
  
  // Default to today if in current month, otherwise first day of month
  const defaultSelectedDate = isCurrentMonth ? todayUtc : monthStartDate
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultSelectedDate)
  const [selectedDateData, setSelectedDateData] = useState<DayData | null>(null)
  const [isLoadingDayData, setIsLoadingDayData] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(monthStartDate)
  const [expandedMonthData, setExpandedMonthData] = useState<Map<string, DayData>>(new Map())

  // Create a map of date strings to day data for quick lookup (initial month)
  const initialDayDataMap = useMemo(() => {
    const map = new Map<string, DayData>()
    
    initialDays.forEach((day) => {
      const dateStr = day.dateISO.split('T')[0]
      const entries = day.entries || []
      
      const golfEntries = entries.filter(e => e.type === 'golf')
      const eventEntries = entries.filter(e => e.type === 'event')
      const reservationEntries = entries.filter(e => e.type === 'reservation')
      
      // Filter bookings active on this day
      const dayBookings = initialHotelBookings.filter(booking => {
        return dateStr >= booking.checkInDate && dateStr < booking.checkOutDate
      })
      
      // Filter breakfast configs for this day
      const dayBreakfastConfigs = initialBreakfastConfigs.filter(config => config.breakfastDate === dateStr)
      
      map.set(dateStr, {
        hotelBookings: dayBookings,
        breakfastConfigs: dayBreakfastConfigs,
        golfEntries,
        eventEntries,
        reservationEntries
      })
    })
    
    return map
  }, [initialDays, initialHotelBookings, initialBreakfastConfigs])

  // Combined map that includes both initial and expanded month data
  const dayDataMap = useMemo(() => {
    const combined = new Map(initialDayDataMap)
    expandedMonthData.forEach((value, key) => {
      combined.set(key, value)
    })
    return combined
  }, [initialDayDataMap, expandedMonthData])

  // Fetch data for the current month when it changes
  useEffect(() => {
    const fetchMonthData = async () => {
      const monthRange = getMonthDateRange(currentMonth)
      const todayUtc = getTodayBrusselsUtc()
      const startDate = monthRange.startDate < todayUtc ? todayUtc : monthRange.startDate
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = monthRange.endDate.toISOString().split('T')[0]

      try {
        // Query days for the month
        const { data: days } = await supabase
          .from('Day')
          .select('*, entries:Entry(*)')
          .gte('dateISO', startDate.toISOString())
          .lte('dateISO', monthRange.endDate.toISOString())
          .order('dateISO', { ascending: true })

        // Query hotel bookings that overlap with the month range
        const { data: hotelBookings } = await supabase
          .from('HotelBooking')
          .select('*')
          .lt('checkInDate', addDays(monthRange.endDate, 1).toISOString().split('T')[0])
          .gt('checkOutDate', startDateStr)
          .order('checkInDate', { ascending: true })

        // Query breakfast configurations for the month range
        const { data: breakfastConfigs } = await supabase
          .from('BreakfastConfiguration')
          .select('*')
          .gte('breakfastDate', startDateStr)
          .lte('breakfastDate', endDateStr)

        // Build map for this month
        const monthMap = new Map<string, DayData>()
        
        if (days) {
          days.forEach((day) => {
            const dateStr = day.dateISO.split('T')[0]
            const entries = day.entries || []
            
            const golfEntries = entries.filter((e: Entry) => e.type === 'golf')
            const eventEntries = entries.filter((e: Entry) => e.type === 'event')
            const reservationEntries = entries.filter((e: Entry) => e.type === 'reservation')
            
            // Filter bookings active on this day
            const dayBookings = (hotelBookings || []).filter(booking => {
              return dateStr >= booking.checkInDate && dateStr < booking.checkOutDate
            })
            
            // Filter breakfast configs for this day
            const dayBreakfastConfigs = (breakfastConfigs || []).filter(config => config.breakfastDate === dateStr)
            
            monthMap.set(dateStr, {
              hotelBookings: dayBookings,
              breakfastConfigs: dayBreakfastConfigs,
              golfEntries,
              eventEntries,
              reservationEntries
            })
          })
        }

        // Also check for bookings that overlap but don't have days created yet
        if (hotelBookings) {
          hotelBookings.forEach(booking => {
            const checkIn = new Date(booking.checkInDate)
            const checkOut = new Date(booking.checkOutDate)
            let currentDate = new Date(checkIn)
            
            while (currentDate < checkOut) {
              const dateStr = formatYmd(currentDate)
              if (!monthMap.has(dateStr) && currentDate >= startDate && currentDate <= monthRange.endDate) {
                monthMap.set(dateStr, {
                  hotelBookings: [booking],
                  breakfastConfigs: [],
                  golfEntries: [],
                  eventEntries: [],
                  reservationEntries: []
                })
              }
              currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
            }
          })
        }

        setExpandedMonthData(monthMap)
      } catch (error) {
        console.error('Error fetching month data:', error)
      }
    }

    fetchMonthData()
  }, [currentMonth])

  // Check if a date has items (for dot indicator)
  const dateHasItems = useMemo(() => {
    return (date: Date): boolean => {
      const dateStr = formatYmd(date)
      const data = dayDataMap.get(dateStr)
      
      if (data) {
        return (
          data.hotelBookings.length > 0 ||
          data.breakfastConfigs.length > 0 ||
          data.golfEntries.length > 0 ||
          data.eventEntries.length > 0 ||
          data.reservationEntries.length > 0
        )
      }
      
      // Fallback: check initial data (for dates outside fetched months)
      const hasOverlappingBooking = initialHotelBookings.some(booking => {
        return dateStr >= booking.checkInDate && dateStr < booking.checkOutDate
      })
      
      const hasBreakfast = initialBreakfastConfigs.some(config => config.breakfastDate === dateStr)
      
      return hasOverlappingBooking || hasBreakfast
    }
  }, [dayDataMap, initialHotelBookings, initialBreakfastConfigs])

  // Create custom DayButton component
  const CustomDayButton = useMemo(() => {
    return function DayButtonComponent(props: DayButtonProps) {
      const { children, modifiers, day, ...restProps } = props
      const hasItems = !modifiers.outside && dateHasItems(day.date)
      
      return (
        <CalendarDayButton day={day} modifiers={modifiers} {...restProps}>
          {children}
          {!modifiers.outside && hasItems && (
            <Circle className="h-2 w-2 fill-current" />
          )}
        </CalendarDayButton>
      )
    }
  }, [dateHasItems])

  // Fetch day data when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDateData(null)
      return
    }

    const dateStr = formatYmd(selectedDate)
    
    // First check if we have data in the map
    const cachedData = dayDataMap.get(dateStr)
    if (cachedData) {
      setSelectedDateData(cachedData)
      return
    }

    // Otherwise fetch from server
    setIsLoadingDayData(true)
    
    const fetchDayData = async () => {
      try {
        // Query hotel bookings that overlap with this date
        const { data: hotelBookings } = await supabase
          .from('HotelBooking')
          .select('*, breakfastConfigurations:BreakfastConfiguration(*)')
          .lte('checkInDate', dateStr)
          .gt('checkOutDate', dateStr)
          .order('checkInDate', { ascending: true })

        // Query breakfast configurations for this day
        const { data: breakfastConfigs } = await supabase
          .from('BreakfastConfiguration')
          .select('*, hotelBooking:HotelBooking(*)')
          .eq('breakfastDate', dateStr)
          .order('startTime', { ascending: true, nullsFirst: true })

        // Query entries with venue type and POC info
        const date = parseYmd(dateStr)
        const { data: day } = await supabase
          .from('Day')
          .select('*, entries:Entry(*, venueType:VenueType(*), poc:PointOfContact(*))')
          .eq('dateISO', date.toISOString())
          .single()

        const entries = (day?.entries || []) as Entry[]
        const golfEntries = entries.filter((e) => e.type === 'golf')
        const eventEntries = entries.filter((e) => e.type === 'event')
        const reservationEntries = entries.filter((e) => e.type === 'reservation')

        setSelectedDateData({
          hotelBookings: hotelBookings || [],
          breakfastConfigs: breakfastConfigs || [],
          golfEntries,
          eventEntries,
          reservationEntries
        })
      } catch (error) {
        console.error('Error fetching day data:', error)
        setSelectedDateData({
          hotelBookings: [],
          breakfastConfigs: [],
          golfEntries: [],
          eventEntries: [],
          reservationEntries: []
        })
      } finally {
        setIsLoadingDayData(false)
      }
    }

    fetchDayData()
  }, [selectedDate, dayDataMap])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleDataChange = () => {
    // Refresh data when sidebar makes changes
    if (selectedDate) {
      const dateStr = formatYmd(selectedDate)
      // Remove from cache to force refetch
      dayDataMap.delete(dateStr)
      // Trigger refetch by updating selected date
      setSelectedDate(new Date(selectedDate))
    }
  }

  return (
    <div className="flex flex-col min-h-0 w-full">
      {/* Calendar and Sidebar Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_700px] gap-4 min-h-0 lg:h-[calc(100vh-10rem)]">
        {/* Calendar Section */}
        <div className="flex items-start justify-start overflow-auto pb-4 lg:pb-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            numberOfMonths={1}
            captionLayout="dropdown"
            fromYear={currentYear}
            toYear={maxYear}
            disabled={(date) => {
              const todayUtc = getTodayBrusselsUtc()
              // Disable dates before today (but allow today)
              return date < todayUtc
            }}
            className="[--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)] lg:[--cell-size:--spacing(16)]"
            formatters={{
              formatMonthDropdown: (date) => {
                return date.toLocaleString("default", { month: "long" })
              },
            }}
            components={{
              DayButton: CustomDayButton,
            }}
          />
        </div>

        {/* Sidebar Section - Hidden on mobile, shown below calendar on tablet, side-by-side on desktop */}
        <div className="lg:block border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          {isLoadingDayData ? (
            <div className="h-full min-h-[400px] lg:min-h-0 flex items-center justify-center">
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                Loading...
              </div>
            </div>
          ) : selectedDateData ? (
            <CalendarDaySidebar
              hotelBookings={selectedDateData.hotelBookings}
              breakfastConfigs={selectedDateData.breakfastConfigs}
              golfEntries={selectedDateData.golfEntries}
              eventEntries={selectedDateData.eventEntries}
              reservationEntries={selectedDateData.reservationEntries}
              dateParam={selectedDate ? formatYmd(selectedDate) : null}
              onDataChange={handleDataChange}
            />
          ) : (
            <CalendarDaySidebar
              hotelBookings={[]}
              breakfastConfigs={[]}
              golfEntries={[]}
              eventEntries={[]}
              reservationEntries={[]}
              dateParam={null}
              onDataChange={handleDataChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
