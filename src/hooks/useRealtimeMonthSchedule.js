'use client'

import { useEffect, useState, useCallback } from 'react'
import supabaseClient from '../lib/supabase-client'
import { getMonthDateRange, dateFromYmdUtc, getTodayBrusselsUtc, addDays } from '../lib/day-utils'

/**
 * Hook for real-time schedule updates on month view
 * @param {string} monthParam - Month in YYYY-MM format (optional, from searchParams)
 * @param {Array} initialDays - Initial days data
 * @param {Array} initialHotelBookings - Initial hotel bookings data
 * @param {Array} initialBreakfastConfigs - Initial breakfast configs data
 * @returns {Object} Updated data and connection status
 */
export function useRealtimeMonthSchedule(
  monthParam,
  initialDays = [],
  initialHotelBookings = [],
  initialBreakfastConfigs = []
) {
  const [days, setDays] = useState(initialDays)
  const [hotelBookings, setHotelBookings] = useState(initialHotelBookings)
  const [breakfastConfigs, setBreakfastConfigs] = useState(initialBreakfastConfigs)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  // Calculate date range for the month
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null, startDateStr: '', endDateStr: '' })

  useEffect(() => {
    const todayUtc = getTodayBrusselsUtc()
    let monthStartDate = todayUtc
    
    if (monthParam) {
      try {
        const [year, month] = monthParam.split('-').map(Number)
        if (year && month && month >= 1 && month <= 12) {
          monthStartDate = dateFromYmdUtc({ year, month, day: 1 })
        }
      } catch (e) {
        // Invalid month param, use today
        monthStartDate = todayUtc
      }
    }

    const monthRange = getMonthDateRange(monthStartDate)
    const startDate = monthRange.startDate < todayUtc ? todayUtc : monthRange.startDate
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = monthRange.endDate.toISOString().split('T')[0]

    setDateRange({
      startDate,
      endDate: monthRange.endDate,
      startDateStr,
      endDateStr
    })
  }, [monthParam])

  // Update state when initial props change
  useEffect(() => {
    setDays(initialDays)
    setHotelBookings(initialHotelBookings)
    setBreakfastConfigs(initialBreakfastConfigs)
  }, [monthParam, initialDays, initialHotelBookings, initialBreakfastConfigs])

  useEffect(() => {
    if (!dateRange.startDateStr || !dateRange.endDateStr) {
      console.log('Month schedule hook: waiting for date range', dateRange)
      return
    }

    console.log('Month schedule hook: Setting up subscriptions for month:', monthParam, 'range:', dateRange)
    const subscriptions = []

    // Subscribe to Day changes
    const dayChannel = supabaseClient
      .channel(`month-days-${monthParam || 'current'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Day'
        },
        async (payload) => {
          try {
            const day = payload.new || payload.old
            if (!day) return

            const dayDateStr = day.dateISO.split('T')[0]
            const isInRange = dayDateStr >= dateRange.startDateStr && dayDateStr <= dateRange.endDateStr

            if (payload.eventType === 'DELETE') {
              setDays(prev => prev.filter(d => d.id !== payload.old.id))
            } else {
              // Fetch updated day with entries
              const { data: updatedDay, error } = await supabaseClient
                .from('Day')
                .select('*, entries:Entry(*)')
                .eq('id', day.id)
                .single()

              if (error) {
                console.error('Error fetching day:', error)
                return
              }

              if (updatedDay && isInRange) {
                setDays(prev => {
                  const existing = prev.findIndex(d => d.id === updatedDay.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = updatedDay
                    return updated.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
                  }
                  return [...prev, updatedDay].sort((a, b) => a.dateISO.localeCompare(b.dateISO))
                })
              } else if (!isInRange) {
              // Day moved out of range, remove it
              setDays(prev => prev.filter(d => d.id !== day.id))
            }
          }
          } catch (err) {
            console.error('Error processing day change:', err)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionError(err?.message || 'Connection error')
        }
      })

    subscriptions.push(dayChannel)

    // Subscribe to Entry changes
    const entryChannel = supabaseClient
      .channel(`month-entries-${monthParam || 'current'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Entry'
        },
        async (payload) => {
          try {
            console.log('Entry change received:', payload.eventType, payload)
            const entry = payload.new || payload.old
            if (!entry) {
              console.warn('Entry change payload missing entry data')
              return
            }

            // Fetch the day for this entry to check if it's in range
            const { data: day, error: dayError } = await supabaseClient
              .from('Day')
              .select('id, dateISO')
              .eq('id', entry.dayId)
              .single()

            if (dayError || !day) {
              console.error('Error fetching day for entry:', dayError)
              return
            }

            const dayDateStr = day.dateISO.split('T')[0]
            const isInRange = dayDateStr >= dateRange.startDateStr && dayDateStr <= dateRange.endDateStr
            console.log('Entry change - day in range:', isInRange, dayDateStr, dateRange)

            if (payload.eventType === 'DELETE') {
              // Only remove if the day is in range
              if (isInRange) {
                setDays(prev => prev.map(d => {
                  if (d.id === entry.dayId) {
                    return {
                      ...d,
                      entries: (d.entries || []).filter(e => e.id !== entry.id)
                    }
                  }
                  return d
                }))
              }
            } else if (isInRange) {
              // Fetch updated entry
              const { data: updatedEntry, error: entryError } = await supabaseClient
                .from('Entry')
                .select('*, venueType:VenueType(*), poc:PointOfContact(*)')
                .eq('id', entry.id)
                .single()

              if (entryError) {
                console.error('Error fetching entry:', entryError)
                return
              }

              if (updatedEntry) {
                setDays(prev => {
                  // Check if the day exists in the array
                  const dayIndex = prev.findIndex(d => d.id === entry.dayId)
                  
                  if (dayIndex >= 0) {
                    // Day exists, update its entries
                    return prev.map(d => {
                      if (d.id === entry.dayId) {
                        const existing = (d.entries || []).findIndex(e => e.id === updatedEntry.id)
                        if (existing >= 0) {
                          const updatedEntries = [...(d.entries || [])]
                          updatedEntries[existing] = updatedEntry
                          return { ...d, entries: updatedEntries }
                        }
                        return { ...d, entries: [...(d.entries || []), updatedEntry] }
                      }
                      return d
                    })
                  } else {
                    // Day doesn't exist, fetch it and add it
                    return [...prev, {
                      id: day.id,
                      dateISO: day.dateISO,
                      entries: [updatedEntry]
                    }].sort((a, b) => a.dateISO.localeCompare(b.dateISO))
                  }
                })
              }
          }
          } catch (err) {
            console.error('Error processing entry change:', err)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Entry channel status:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to entry changes for month')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Entry channel error:', err)
          setConnectionError(err?.message || 'Connection error')
        }
      })

    subscriptions.push(entryChannel)

    // Subscribe to HotelBooking changes
    const hotelChannel = supabaseClient
      .channel(`month-hotel-${monthParam || 'current'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'HotelBooking'
        },
        async (payload) => {
          try {
            const booking = payload.new || payload.old
            if (!booking) return

            // Check if booking overlaps with month range
            const overlaps = booking.checkInDate < addDays(dateRange.endDate, 1).toISOString().split('T')[0] &&
                            booking.checkOutDate > dateRange.startDateStr

            if (payload.eventType === 'DELETE') {
              setHotelBookings(prev => prev.filter(b => b.id !== payload.old.id))
            } else if (overlaps) {
              // Fetch updated booking
              const { data: updatedBooking, error } = await supabaseClient
                .from('HotelBooking')
                .select('*')
                .eq('id', booking.id)
                .single()

              if (error) {
                console.error('Error fetching hotel booking:', error)
                return
              }

              if (updatedBooking) {
                setHotelBookings(prev => {
                  const existing = prev.findIndex(b => b.id === updatedBooking.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = updatedBooking
                    return updated.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
                  }
                  return [...prev, updatedBooking].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
                })
              }
          } else {
            // Booking no longer overlaps, remove it
            setHotelBookings(prev => prev.filter(b => b.id !== booking.id))
          }
          } catch (err) {
            console.error('Error processing hotel booking change:', err)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          setConnectionError(err?.message || 'Connection error')
        }
      })

    subscriptions.push(hotelChannel)

    // Subscribe to BreakfastConfiguration changes
    const breakfastChannel = supabaseClient
      .channel(`month-breakfast-${monthParam || 'current'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'BreakfastConfiguration'
        },
        async (payload) => {
          try {
            const config = payload.new || payload.old
            if (!config) return

            const isInRange = config.breakfastDate >= dateRange.startDateStr && 
                             config.breakfastDate <= dateRange.endDateStr

            if (payload.eventType === 'DELETE') {
              setBreakfastConfigs(prev => prev.filter(c => c.id !== payload.old.id))
            } else if (isInRange) {
              // Fetch updated config
              const { data: updatedConfig, error } = await supabaseClient
                .from('BreakfastConfiguration')
                .select('*')
                .eq('id', config.id)
                .single()

              if (error) {
                console.error('Error fetching breakfast config:', error)
                return
              }

              if (updatedConfig) {
                setBreakfastConfigs(prev => {
                  const existing = prev.findIndex(c => c.id === updatedConfig.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = updatedConfig
                    return updated
                  }
                  return [...prev, updatedConfig]
                })
              }
          } else {
            // Config moved out of range, remove it
            setBreakfastConfigs(prev => prev.filter(c => c.id !== config.id))
          }
          } catch (err) {
            console.error('Error processing breakfast config change:', err)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          setConnectionError(err?.message || 'Connection error')
        }
      })

    subscriptions.push(breakfastChannel)

    // Cleanup function
    return () => {
      subscriptions.forEach(channel => {
        supabaseClient.removeChannel(channel).catch(err => {
          console.error('Error removing channel:', err)
        })
      })
      setIsConnected(false)
      setConnectionError(null)
    }
  }, [monthParam, dateRange.startDateStr, dateRange.endDateStr, dateRange.startDate, dateRange.endDate])

  return {
    days,
    hotelBookings,
    breakfastConfigs,
    isConnected,
    connectionError
  }
}

