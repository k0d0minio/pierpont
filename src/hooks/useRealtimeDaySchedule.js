'use client'

import { useEffect, useState, useCallback } from 'react'
import supabaseClient from '../lib/supabase-client'
import { parseYmd } from '../lib/day-utils'

/**
 * Hook for real-time schedule updates on a single day view
 * @param {string} dateParam - Date in YYYY-MM-DD format
 * @param {Array} initialHotelBookings - Initial hotel bookings data
 * @param {Array} initialBreakfastConfigs - Initial breakfast configs data
 * @param {Array} initialGolfEntries - Initial golf entries
 * @param {Array} initialEventEntries - Initial event entries
 * @param {Array} initialReservationEntries - Initial reservation entries
 * @returns {Object} Updated data and connection status
 */
export function useRealtimeDaySchedule(
  dateParam,
  initialHotelBookings = [],
  initialBreakfastConfigs = [],
  initialGolfEntries = [],
  initialEventEntries = [],
  initialReservationEntries = []
) {
  const [hotelBookings, setHotelBookings] = useState(initialHotelBookings)
  const [breakfastConfigs, setBreakfastConfigs] = useState(initialBreakfastConfigs)
  const [golfEntries, setGolfEntries] = useState(initialGolfEntries)
  const [eventEntries, setEventEntries] = useState(initialEventEntries)
  const [reservationEntries, setReservationEntries] = useState(initialReservationEntries)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  // Update state when initial props change (e.g., navigation)
  useEffect(() => {
    setHotelBookings(initialHotelBookings)
    setBreakfastConfigs(initialBreakfastConfigs)
    setGolfEntries(initialGolfEntries)
    setEventEntries(initialEventEntries)
    setReservationEntries(initialReservationEntries)
  }, [dateParam, initialHotelBookings, initialBreakfastConfigs, initialGolfEntries, initialEventEntries, initialReservationEntries])

  // Fetch day ID for filtering entries
  const [dayId, setDayId] = useState(null)

  useEffect(() => {
    const fetchDayId = async () => {
      try {
        const date = parseYmd(dateParam)
        const { data, error } = await supabaseClient
          .from('Day')
          .select('id')
          .eq('dateISO', date.toISOString())
          .single()
        
        if (error) {
          console.error('Error fetching day ID:', error)
          setConnectionError(error.message)
          return
        }
        
        if (data) {
          setDayId(data.id)
          setConnectionError(null)
        }
      } catch (err) {
        console.error('Error in fetchDayId:', err)
        setConnectionError(err.message)
      }
    }
    
    if (dateParam) {
      fetchDayId()
    }
  }, [dateParam])

  useEffect(() => {
    if (!dateParam || !dayId) {
      console.log('Day schedule hook: waiting for dateParam or dayId', { dateParam, dayId })
      return
    }

    console.log('Day schedule hook: Setting up subscriptions for day:', dateParam, 'dayId:', dayId)
    const subscriptions = []

    // Subscribe to Entry changes for this day
    const entryChannel = supabaseClient
      .channel(`day-entries-${dateParam}-${dayId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Entry',
          filter: `dayId=eq.${dayId}`
        },
        async (payload) => {
          try {
            console.log('Day entry change received:', payload.eventType, payload)
            // Fetch updated entry with relations
            if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id
              const deletedType = payload.old?.type
              
              console.log('Processing DELETE event:', { deletedId, deletedType, payload })
              
              if (!deletedId) {
                console.error('DELETE event missing id in payload.old:', payload)
                return
              }
              
              // Remove deleted entry from the appropriate array based on type
              if (deletedType === 'golf') {
                console.log('Removing golf entry:', deletedId)
                setGolfEntries(prev => {
                  const filtered = prev.filter(e => e.id !== deletedId)
                  console.log('Golf entries after delete:', filtered.length, 'was:', prev.length)
                  return filtered
                })
              } else if (deletedType === 'event') {
                console.log('Removing event entry:', deletedId)
                setEventEntries(prev => {
                  const filtered = prev.filter(e => e.id !== deletedId)
                  console.log('Event entries after delete:', filtered.length, 'was:', prev.length)
                  return filtered
                })
              } else if (deletedType === 'reservation') {
                console.log('Removing reservation entry:', deletedId)
                setReservationEntries(prev => {
                  const filtered = prev.filter(e => e.id !== deletedId)
                  console.log('Reservation entries after delete:', filtered.length, 'was:', prev.length)
                  return filtered
                })
              } else {
                console.warn('Unknown entry type for DELETE, removing from all arrays:', deletedType)
                // Fallback: remove from all arrays if type is unknown
                setGolfEntries(prev => prev.filter(e => e.id !== deletedId))
                setEventEntries(prev => prev.filter(e => e.id !== deletedId))
                setReservationEntries(prev => prev.filter(e => e.id !== deletedId))
              }
            } else {
              // Fetch updated/inserted entry with relations
              const { data: entry, error } = await supabaseClient
                .from('Entry')
                .select('*, venueType:VenueType(*), poc:PointOfContact(*)')
                .eq('id', payload.new.id)
                .single()

              if (error) {
                console.error('Error fetching entry:', error)
                return
              }

              if (entry) {
                if (entry.type === 'golf') {
                  setGolfEntries(prev => {
                    const existing = prev.findIndex(e => e.id === entry.id)
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = entry
                      return updated
                    }
                    return [...prev, entry]
                  })
                } else if (entry.type === 'event') {
                  setEventEntries(prev => {
                    const existing = prev.findIndex(e => e.id === entry.id)
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = entry
                      return updated
                    }
                    return [...prev, entry]
                  })
                } else if (entry.type === 'reservation') {
                  setReservationEntries(prev => {
                    const existing = prev.findIndex(e => e.id === entry.id)
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = entry
                      return updated
                    }
                    return [...prev, entry]
                  })
                }
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
          console.log('Successfully subscribed to entry changes for day:', dateParam)
          setIsConnected(true)
          setConnectionError(null)
        } else if (status === 'CLOSED') {
          console.log('Entry channel closed')
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Entry channel error:', err)
          setIsConnected(false)
          setConnectionError(err?.message || 'Connection error')
        }
      })

    subscriptions.push(entryChannel)

    // Subscribe to HotelBooking changes that overlap with this date
    const hotelChannel = supabaseClient
      .channel(`day-hotel-${dateParam}`)
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

            // Check if booking overlaps with this date
            const overlaps = dateParam >= booking.checkInDate && dateParam < booking.checkOutDate

            if (payload.eventType === 'DELETE') {
              setHotelBookings(prev => prev.filter(b => b.id !== payload.old.id))
            } else {
              // Fetch updated booking with breakfast configs
              const { data: updatedBooking, error } = await supabaseClient
                .from('HotelBooking')
                .select('*, breakfastConfigurations:BreakfastConfiguration(*)')
                .eq('id', booking.id)
                .single()

              if (error) {
                console.error('Error fetching hotel booking:', error)
                return
              }

              if (updatedBooking) {
                if (overlaps) {
                  setHotelBookings(prev => {
                    const existing = prev.findIndex(b => b.id === updatedBooking.id)
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = updatedBooking
                      return updated
                    }
                    return [...prev, updatedBooking].sort((a, b) => 
                      a.checkInDate.localeCompare(b.checkInDate)
                    )
                  })
                } else {
                  // Booking no longer overlaps, remove it
                  setHotelBookings(prev => prev.filter(b => b.id !== updatedBooking.id))
                }
              }
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

    // Subscribe to BreakfastConfiguration changes for this date
    const breakfastChannel = supabaseClient
      .channel(`day-breakfast-${dateParam}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'BreakfastConfiguration',
          filter: `breakfastDate=eq.${dateParam}`
        },
        async (payload) => {
          try {
            if (payload.eventType === 'DELETE') {
              setBreakfastConfigs(prev => prev.filter(c => c.id !== payload.old.id))
            } else {
              // Fetch updated config with hotel booking relation
              const { data: config, error } = await supabaseClient
                .from('BreakfastConfiguration')
                .select('*, hotelBooking:HotelBooking(*)')
                .eq('id', payload.new.id)
                .single()

              if (error) {
                console.error('Error fetching breakfast config:', error)
                return
              }

              if (config) {
                setBreakfastConfigs(prev => {
                  const existing = prev.findIndex(c => c.id === config.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = config
                    return updated.sort((a, b) => {
                      if (!a.startTime && !b.startTime) return 0
                      if (!a.startTime) return 1
                      if (!b.startTime) return -1
                      return a.startTime.localeCompare(b.startTime)
                    })
                  }
                  return [...prev, config].sort((a, b) => {
                    if (!a.startTime && !b.startTime) return 0
                    if (!a.startTime) return 1
                    if (!b.startTime) return -1
                    return a.startTime.localeCompare(b.startTime)
                  })
                })
              }
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
  }, [dateParam, dayId])

  return {
    hotelBookings,
    breakfastConfigs,
    golfEntries,
    eventEntries,
    reservationEntries,
    isConnected,
    connectionError
  }
}

