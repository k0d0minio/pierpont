"use client"

import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { DateRangePicker } from '@/components/date-range-picker'
import type { Tables } from '@/types/supabase'
import { parseYmd, formatYmd, addDays, normalizeToUtcMidnight } from '@/lib/day-utils'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Coffee, UtensilsCrossed, Plus, Minus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TimePicker } from '@/components/ui/time-picker'
import supabaseClient from '@/lib/supabase-client'

interface AddHotelBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  dateParam?: string;
  isSubmitting?: boolean;
  error?: string | null;
  editBooking?: Tables<'HotelBooking'> | null;
  existingBreakfastConfigs?: Tables<'BreakfastConfiguration'>[];
  existingReservations?: Tables<'Entry'>[];
}

type BreakfastDayConfig = {
  date: string;
  tableBreakdown: number[];
  tableTimes: (string | null)[]; // Optional time for each table
  notes: string;
}

type ReservationDayConfig = {
  date: string;
  guestCount: number;
  startTime: string | null;
  endTime: string | null;
  notes: string;
}

export function AddHotelBookingDrawer({ 
  isOpen, 
  onClose, 
  onSubmit, 
  dateParam,
  isSubmitting = false,
  error = null,
  editBooking = null,
  existingBreakfastConfigs = [],
  existingReservations = []
}: AddHotelBookingDrawerProps) {
  const isEditMode = !!editBooking

  // Initialize date range from edit booking or dateParam
  const getInitialDateRange = (): DateRange | undefined => {
    if (editBooking) {
      if (editBooking.checkInDate && editBooking.checkOutDate) {
        return {
          from: parseYmd(editBooking.checkInDate),
          to: parseYmd(editBooking.checkOutDate),
        }
      }
    }
    if (dateParam) {
      return {
        from: parseYmd(dateParam),
        to: undefined,
      }
    }
    return undefined
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(getInitialDateRange())
  const [breakfastConfigs, setBreakfastConfigs] = useState<BreakfastDayConfig[]>([])
  const [reservationConfigs, setReservationConfigs] = useState<ReservationDayConfig[]>([])
  const [openDayDialog, setOpenDayDialog] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState<string>(editBooking?.guestCount?.toString() || '')

  // Update date range when editBooking or isOpen changes
  useEffect(() => {
    if (isOpen) {
      let newDateRange: DateRange | undefined
      if (editBooking && editBooking.checkInDate && editBooking.checkOutDate) {
        newDateRange = {
          from: parseYmd(editBooking.checkInDate),
          to: parseYmd(editBooking.checkOutDate),
        }
      } else if (dateParam) {
        newDateRange = {
          from: parseYmd(dateParam),
          to: undefined,
        }
      } else {
        newDateRange = undefined
      }
      setDateRange(newDateRange)
    }
  }, [editBooking, isOpen, dateParam])

  // Calculate breakfast days (excluding first, including last)
  const getBreakfastDays = useCallback((): Date[] => {
    if (!dateRange?.from || !dateRange?.to) return []
    const days: Date[] = []
    let current = addDays(dateRange.from, 1) // Start from day after check-in
    const checkOut = dateRange.to
    while (current <= checkOut) {
      days.push(new Date(current))
      current = addDays(current, 1)
    }
    return days
  }, [dateRange])

  // Calculate reservation days (including first and last/check-out day)
  const getReservationDays = useCallback((): Date[] => {
    if (!dateRange?.from || !dateRange?.to) return []
    const days: Date[] = []
    let current = new Date(dateRange.from)
    const checkOut = dateRange.to // Include check-out day
    while (current <= checkOut) {
      days.push(new Date(current))
      current = addDays(current, 1)
    }
    return days
  }, [dateRange])

  // Get all unique days that need configuration (breakfast or reservation)
  const getAllDays = useCallback((): Date[] => {
    if (!dateRange?.from || !dateRange?.to) return []
    const breakfastDays = getBreakfastDays()
    const reservationDays = getReservationDays()
    const allDaysSet = new Set<string>()
    
    for (const d of breakfastDays) {
      allDaysSet.add(formatYmd(d))
    }
    for (const d of reservationDays) {
      allDaysSet.add(formatYmd(d))
    }
    
    return Array.from(allDaysSet)
      .map(d => parseYmd(d))
      .sort((a, b) => a.getTime() - b.getTime())
  }, [dateRange, getBreakfastDays, getReservationDays])

  // Initialize breakfast configs from existing data only (don't create new ones)
  useEffect(() => {
    if (isOpen && dateRange?.from && dateRange?.to) {
      const breakfastDays = getBreakfastDays()
      if (breakfastDays.length > 0) {
        // When editing, fetch all breakfast configs for the booking's date range
        if (editBooking) {
          const fetchBreakfastConfigs = async () => {
            const breakfastDateStrs = breakfastDays.map(d => formatYmd(d))
            
            // Query all breakfast configs for this booking and date range
            const { data: configs } = await supabaseClient
              .from('BreakfastConfiguration')
              .select('*')
              .eq('hotelBookingId', editBooking.id)
              .in('breakfastDate', breakfastDateStrs)
            
            if (configs) {
              const loadedConfigs: BreakfastDayConfig[] = breakfastDays.map(date => {
                const dateStr = formatYmd(date)
                const existing = configs.find(c => c.breakfastDate === dateStr)
                if (existing) {
                  // Parse existing table breakdown
                  let breakdown: number[] = []
                  if (existing.tableBreakdown) {
                    if (Array.isArray(existing.tableBreakdown)) {
                      breakdown = existing.tableBreakdown.map(n => {
                        const num = Number(n)
                        return Number.isNaN(num) || num <= 0 ? 0 : num
                      }).filter(n => n > 0)
                    } else if (typeof existing.tableBreakdown === 'string') {
                      try {
                        const parsed = JSON.parse(existing.tableBreakdown)
                        if (Array.isArray(parsed)) {
                          breakdown = parsed.map(n => {
                            const num = Number(n)
                            return Number.isNaN(num) || num <= 0 ? 0 : num
                          }).filter(n => n > 0)
                        }
                      } catch {
                        // If it's a string like "3+2+1", parse it
                        if (existing.tableBreakdown.includes('+')) {
                          breakdown = existing.tableBreakdown.split('+').map(s => {
                            const num = Number(s.trim())
                            return Number.isNaN(num) || num <= 0 ? 0 : num
                          }).filter(n => n > 0)
                        }
                      }
                    }
                  }
                  return {
                    date: dateStr,
                    tableBreakdown: breakdown.length > 0 ? breakdown : [],
                    tableTimes: breakdown.map(() => null), // Initialize with null times
                    notes: existing.notes || '',
                  }
                }
                return null as any
              }).filter(c => c !== null)
              setBreakfastConfigs(loadedConfigs)
            } else {
              setBreakfastConfigs([])
            }
          }
          
          fetchBreakfastConfigs()
        } else {
          // For new bookings, use the passed existingBreakfastConfigs (should be empty)
          const configs: BreakfastDayConfig[] = breakfastDays.map(date => {
            const dateStr = formatYmd(date)
            const existing = existingBreakfastConfigs.find(c => c.breakfastDate === dateStr)
            if (existing) {
              // Parse existing table breakdown
              let breakdown: number[] = []
              if (existing.tableBreakdown) {
                if (Array.isArray(existing.tableBreakdown)) {
                  breakdown = existing.tableBreakdown.map(n => {
                    const num = Number(n)
                    return Number.isNaN(num) || num <= 0 ? 0 : num
                  }).filter(n => n > 0)
                } else if (typeof existing.tableBreakdown === 'string') {
                  try {
                    const parsed = JSON.parse(existing.tableBreakdown)
                    if (Array.isArray(parsed)) {
                      breakdown = parsed.map(n => {
                        const num = Number(n)
                        return Number.isNaN(num) || num <= 0 ? 0 : num
                      }).filter(n => n > 0)
                    }
                  } catch {
                    // If it's a string like "3+2+1", parse it
                    if (existing.tableBreakdown.includes('+')) {
                      breakdown = existing.tableBreakdown.split('+').map(s => {
                        const num = Number(s.trim())
                        return Number.isNaN(num) || num <= 0 ? 0 : num
                      }).filter(n => n > 0)
                    }
                  }
                }
              }
              return {
                date: dateStr,
                tableBreakdown: breakdown.length > 0 ? breakdown : [],
                tableTimes: breakdown.map(() => null), // Initialize with null times
                notes: existing.notes || '',
              }
            }
            // Don't create configs for new days - they'll be created when dialog opens
            return null as any
          }).filter(c => c !== null)
          setBreakfastConfigs(configs)
        }
      } else {
        setBreakfastConfigs([])
      }
    }
  }, [dateRange, isOpen, existingBreakfastConfigs, getBreakfastDays, editBooking])

  // Initialize reservation configs from existing data only (don't create new ones)
  useEffect(() => {
    if (isOpen && dateRange?.from && dateRange?.to && editBooking) {
      const reservationDays = getReservationDays()
      if (reservationDays.length > 0) {
        // Fetch all reservations for the booking's date range
        const fetchReservations = async () => {
          // Get all days in the reservation range
          const dayDates = reservationDays.map(d => d.toISOString())
          
          // Query entries for all days in the range
          const { data: days } = await supabaseClient
            .from('Day')
            .select('dateISO, entries:Entry(*)')
            .in('dateISO', dayDates)
          
          if (days) {
            const configs: ReservationDayConfig[] = reservationDays.map(date => {
              const dateStr = formatYmd(date)
              const day = days.find(d => {
                const dayDateStr = formatYmd(new Date(d.dateISO))
                return dayDateStr === dateStr
              })
              
              if (day?.entries) {
                const reservation = (day.entries as any[]).find(
                  (e: any) => e.type === 'reservation' && e.hotelBookingId === editBooking.id
                )
                
                if (reservation) {
                  return {
                    date: dateStr,
                    guestCount: reservation.guestCount || 0,
                    startTime: reservation.startTime || null,
                    endTime: reservation.endTime || null,
                    notes: reservation.notes || '',
                  }
                }
              }
              return null as any
            }).filter(c => c !== null)
            setReservationConfigs(configs)
          } else {
            setReservationConfigs([])
          }
        }
        
        fetchReservations()
      } else {
        setReservationConfigs([])
      }
    } else {
      setReservationConfigs([])
    }
  }, [dateRange, isOpen, getReservationDays, editBooking])

  // Update breakfast and reservation configs when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const breakfastDays = getBreakfastDays()
      const reservationDays = getReservationDays()
      
      // Update breakfast configs - preserve existing ones if date matches, don't create new ones
      setBreakfastConfigs(prevConfigs => {
        const newBreakfastConfigs: BreakfastDayConfig[] = breakfastDays.map(date => {
          const dateStr = formatYmd(date)
          const existing = prevConfigs.find(c => c.date === dateStr)
          if (existing) return existing
          // Don't create new configs - they'll be created when dialog opens
          return null as any
        }).filter(c => c !== null)
        return newBreakfastConfigs
      })

      // Update reservation configs - preserve existing ones if date matches, don't create new ones
      setReservationConfigs(prevConfigs => {
        const newReservationConfigs: ReservationDayConfig[] = reservationDays.map(date => {
          const dateStr = formatYmd(date)
          const existing = prevConfigs.find(c => c.date === dateStr)
          if (existing) return existing
          // Don't create new configs - they'll be created when dialog opens
          return null as any
        }).filter(c => c !== null)
        return newReservationConfigs
      })
    }
  }, [dateRange, getBreakfastDays, getReservationDays])

  const adjustBreakfastTableGuests = (date: string, tableIndex: number, delta: number) => {
    setBreakfastConfigs(configs => configs.map(config => {
      if (config.date === date) {
        const newTables = [...config.tableBreakdown]
        const newTimes = [...(config.tableTimes || [])]
        const currentValue = newTables[tableIndex] || 0
        const newValue = Math.max(0, currentValue + delta)
        newTables[tableIndex] = newValue
        // Ensure times array matches tables array length
        while (newTimes.length < newTables.length) {
          newTimes.push(null)
        }
        return { ...config, tableBreakdown: newTables, tableTimes: newTimes }
      }
      return config
    }))
  }

  const addBreakfastTable = (date: string) => {
    const guestCountNum = guestCount ? Number(guestCount) : null
    setBreakfastConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            return { 
              ...config, 
              tableBreakdown: [...config.tableBreakdown, guestCountNum && guestCountNum > 0 ? guestCountNum : 0],
              tableTimes: [...(config.tableTimes || []), null] // Add null time for new table
            }
          }
          return config
        })
      }
      // Create new config if it doesn't exist
      return [...configs, {
        date,
        tableBreakdown: [guestCountNum && guestCountNum > 0 ? guestCountNum : 0],
        tableTimes: [null], // Initialize with null time
        notes: '',
      }]
    })
  }

  const removeBreakfastTable = (date: string, tableIndex: number) => {
    setBreakfastConfigs(configs => {
      return configs.map(config => {
        if (config.date === date) {
          const newTables = config.tableBreakdown.filter((_, i) => i !== tableIndex)
          const newTimes = (config.tableTimes || []).filter((_, i) => i !== tableIndex)
          // If no tables left, remove the config entirely
          if (newTables.length === 0) {
            return null as any
          }
          return { ...config, tableBreakdown: newTables, tableTimes: newTimes }
        }
        return config
      }).filter(c => c !== null)
    })
  }

  const updateBreakfastTableTime = (date: string, tableIndex: number, time: string | null) => {
    setBreakfastConfigs(configs => configs.map(config => {
      if (config.date === date) {
        const newTimes = [...(config.tableTimes || [])]
        // Ensure times array matches tables array length
        while (newTimes.length <= tableIndex) {
          newTimes.push(null)
        }
        newTimes[tableIndex] = time
        return { ...config, tableTimes: newTimes }
      }
      return config
    }))
  }

  const updateBreakfastNotes = (date: string, notes: string) => {
    setBreakfastConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            return { ...config, notes }
          }
          return config
        })
      }
      // Create config if it doesn't exist (for notes)
      return [...configs, {
        date,
        tableBreakdown: [],
        tableTimes: [],
        notes,
      }]
    })
  }

  const adjustReservationGuestCount = (date: string, delta: number) => {
    setReservationConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            const newCount = Math.max(0, (config.guestCount || 0) + delta)
            // If count becomes 0, remove the config
            if (newCount === 0) {
              return null as any
            }
            return { ...config, guestCount: newCount }
          }
          return config
        }).filter(c => c !== null)
      }
      // Create new config if it doesn't exist
      const guestCountNum = guestCount ? Number(guestCount) : null
      const initialCount = guestCountNum && guestCountNum > 0 ? guestCountNum : 0
      const newCount = Math.max(0, initialCount + delta)
      if (newCount === 0) {
        return configs
      }
      return [...configs, {
        date,
        guestCount: newCount,
        startTime: null,
        endTime: null,
        notes: '',
      }]
    })
  }

  const clearReservation = (date: string) => {
    setReservationConfigs(configs => configs.filter(c => c.date !== date))
  }

  const updateReservationStartTime = (date: string, startTime: string | null) => {
    setReservationConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            return { ...config, startTime }
          }
          return config
        })
      } else {
        // Create config if it doesn't exist
        return [...configs, {
          date,
          guestCount: 0,
          startTime,
          endTime: null,
          notes: ''
        }]
      }
    })
  }

  const updateReservationEndTime = (date: string, endTime: string | null) => {
    setReservationConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            return { ...config, endTime }
          }
          return config
        })
      } else {
        // Create config if it doesn't exist
        return [...configs, {
          date,
          guestCount: 0,
          startTime: null,
          endTime,
          notes: ''
        }]
      }
    })
  }

  const updateReservationNotes = (date: string, notes: string) => {
    setReservationConfigs(configs => {
      const existing = configs.find(c => c.date === date)
      if (existing) {
        return configs.map(config => {
          if (config.date === date) {
            return { ...config, notes }
          }
          return config
        })
      }
      // Create config if it doesn't exist (for notes) - but only if notes are provided
      if (notes.trim()) {
        return [...configs, {
          date,
          guestCount: 0,
          startTime: null,
          endTime: null,
          notes,
        }]
      }
      return configs
    })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Add date range - normalize to UTC midnight to avoid timezone issues
    if (dateRange?.from) {
      const normalizedFrom = normalizeToUtcMidnight(dateRange.from)
      formData.set('checkInDate', formatYmd(normalizedFrom))
    }
    if (dateRange?.to) {
      const normalizedTo = normalizeToUtcMidnight(dateRange.to)
      formData.set('checkOutDate', formatYmd(normalizedTo))
    }

    // Add breakfast configurations
    breakfastConfigs.forEach((config, index) => {
      const validTables = config.tableBreakdown.filter(n => n > 0)
      if (validTables.length > 0) {
        formData.append(`breakfast_${index}_date`, config.date)
        formData.append(`breakfast_${index}_tableBreakdown`, validTables.join('+'))
        // Add table times if any are set
        const validTimes = (config.tableTimes || []).slice(0, validTables.length).filter(t => t !== null && t !== '')
        if (validTimes.length > 0) {
          formData.append(`breakfast_${index}_tableTimes`, validTimes.join('+'))
        }
        if (config.notes) {
          formData.append(`breakfast_${index}_notes`, config.notes)
        }
      }
    })

    // Add reservation configurations
    // Filter out configs with guestCount 0 before submitting (they represent deleted reservations)
    // Server will delete all existing reservations and recreate only the ones we send
    const validReservationConfigs = reservationConfigs.filter(config => config.guestCount > 0)
    validReservationConfigs.forEach((config, index) => {
      formData.append(`reservation_${index}_date`, config.date)
      formData.append(`reservation_${index}_guestCount`, String(config.guestCount))
      if (config.startTime) {
        formData.append(`reservation_${index}_startTime`, config.startTime)
      }
      if (config.endTime) {
        formData.append(`reservation_${index}_endTime`, config.endTime)
      }
      if (config.notes) {
        formData.append(`reservation_${index}_notes`, config.notes)
      }
    })

    if (isEditMode && editBooking) {
      formData.append('id', String(editBooking.id))
    }

    onSubmit(formData)
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{isEditMode ? 'Modifier la réservation d\'hôtel' : 'Ajouter une réservation d\'hôtel'}</DrawerTitle>
          <DrawerDescription>
            Configurez la réservation d'hôtel et les paramètres quotidiens de petit-déjeuner et de réservation
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  {/* First Row: Guest Name, Guest Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Nom de l'invité *
                      </Label>
                      <Input 
                        id="guestName"
                        name="guestName" 
                        type="text" 
                        placeholder="ex. Jean Dupont"
                        defaultValue={editBooking?.guestName || ''}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Nombre d'invités
                      </Label>
                      <Input 
                        id="guestCount"
                        name="guestCount" 
                        type="number" 
                        placeholder="ex. 2"
                        defaultValue={editBooking?.guestCount || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestCount(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Date Range Picker - Full Width */}
                  <div>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      label="Dates d'arrivée et de départ"
                      id="dateRange"
                      name="dateRange"
                      required
                    />
                  </div>

                  {/* Notes - Full Width */}
                  <div>
                    <Label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Notes
                    </Label>
                    <Textarea 
                      id="notes"
                      name="notes" 
                      rows={3}
                      placeholder="Notes supplémentaires..."
                      defaultValue={editBooking?.notes || ''}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isTourOperator"
                      name="isTourOperator"
                      defaultChecked={editBooking?.isTourOperator || false}
                    />
                    <Label htmlFor="isTourOperator" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Opérateur touristique
                    </Label>
                  </div>
                </div>

                {/* Right Column: Date Icons */}
                {dateRange?.from && dateRange?.to && (() => {
                  const allDays = getAllDays()
                  return (
                    <div className="space-y-4 lg:border-l lg:pl-6">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          Configuration quotidienne
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                          Cliquez sur une date pour configurer le petit-déjeuner et les réservations
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allDays.map((date) => {
                            const dateStr = formatYmd(date)
                            const breakfastConfig = breakfastConfigs.find(c => c.date === dateStr)
                            const reservationConfig = reservationConfigs.find(c => c.date === dateStr)
                            const hasBreakfast = breakfastConfig?.tableBreakdown.some(t => t > 0) ?? false
                            const hasReservation = reservationConfig?.guestCount && reservationConfig.guestCount > 0
                            const isBreakfastDay = getBreakfastDays().some(d => formatYmd(d) === dateStr)
                            const isReservationDay = getReservationDays().some(d => formatYmd(d) === dateStr)
                            
                            const breakfastGuests = breakfastConfig ? breakfastConfig.tableBreakdown.reduce((sum, table) => sum + (table > 0 ? table : 0), 0) : 0
                            
                            return (
                              <button
                                key={`day-${dateStr}`}
                                type="button"
                                onClick={() => setOpenDayDialog(dateStr)}
                                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-w-[90px] relative"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {isBreakfastDay && (
                                    <Coffee 
                                      className={`h-4 w-4 ${hasBreakfast ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`} 
                                    />
                                  )}
                                  {isReservationDay && (
                                    <UtensilsCrossed 
                                      className={`h-4 w-4 ${hasReservation ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} 
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                  {format(date, 'MMM d')}
                                </span>
                                {(hasBreakfast || hasReservation) && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    {hasBreakfast && hasReservation 
                                      ? `${breakfastGuests}B, ${reservationConfig?.guestCount || 0}R`
                                      : hasBreakfast 
                                        ? `${breakfastGuests}B`
                                        : `${reservationConfig?.guestCount || 0}R`
                                    }
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {error && (
              <div className="max-w-6xl mx-auto mt-4">
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  {error}
                </div>
              </div>
            )}
          </div>
          
          <DrawerFooter className="flex-row gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              disabled={isSubmitting || !dateRange?.from || !dateRange?.to}
            >
              {isSubmitting ? (isEditMode ? 'Mise à jour...' : 'Ajout...') : (isEditMode ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </DrawerFooter>
        </form>

        {/* Unified Day Configuration Dialog */}
        {openDayDialog && (() => {
          const dateStr = openDayDialog
          const date = parseYmd(dateStr)
          const isBreakfastDay = getBreakfastDays().some(d => formatYmd(d) === dateStr)
          const isReservationDay = getReservationDays().some(d => formatYmd(d) === dateStr)
          
          // Get breakfast config for dialog (don't create empty one - will be created when user adds table)
          let breakfastConfig = breakfastConfigs.find(c => c.date === dateStr)
          // Create a temporary empty config for the dialog UI, but don't persist it
          if (!breakfastConfig && isBreakfastDay) {
            breakfastConfig = {
              date: dateStr,
              tableBreakdown: [],
              tableTimes: [],
              notes: '',
            }
          }
          
          // Get reservation config for dialog (don't create empty one - will be created when user sets value)
          let reservationConfig = reservationConfigs.find(c => c.date === dateStr)
          // Create a temporary empty config for the dialog UI, but don't persist it
          if (!reservationConfig && isReservationDay) {
            reservationConfig = {
              date: dateStr,
              guestCount: 0,
              startTime: null,
              endTime: null,
              notes: '',
            }
          }
          
          const breakfastTotalGuests = breakfastConfig && breakfastConfig.tableBreakdown ? breakfastConfig.tableBreakdown.reduce((sum, table) => sum + (table > 0 ? table : 0), 0) : 0
          
          return (
            <Dialog open={!!openDayDialog} onOpenChange={(open) => !open && setOpenDayDialog(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configuration du jour - {format(date, 'EEEE d MMMM yyyy', { locale: fr })}</DialogTitle>
                  <DialogDescription>
                    Configurez les paramètres de petit-déjeuner et de réservation pour ce jour
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={isBreakfastDay ? "breakfast" : "reservation"} className="w-full">
                  <TabsList className="inline-flex w-full">
                    {isBreakfastDay && (
                      <TabsTrigger value="breakfast" className="flex-1 flex items-center justify-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Petit-déjeuner
                      </TabsTrigger>
                    )}
                    {isReservationDay && (
                      <TabsTrigger value="reservation" className="flex-1 flex items-center justify-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Réservation
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  {isBreakfastDay && (
                    <TabsContent value="breakfast" className="space-y-4 mt-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Répartition des tables *
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addBreakfastTable(dateStr)}
                            className="text-xs h-6"
                          >
                            + Ajouter une table
                          </Button>
                        </div>
                        {(!breakfastConfig || breakfastConfig.tableBreakdown.length === 0) && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                            Aucune table ajoutée pour le moment. Cliquez sur &quot;+ Ajouter une table&quot; pour en ajouter une.
                          </p>
                        )}
                        {breakfastConfig && breakfastConfig.tableBreakdown.length > 0 && (
                        <div className="space-y-3">
                          {breakfastConfig.tableBreakdown.map((table, tableIndex) => (
                            <div key={`${dateStr}-table-${tableIndex}`} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wide">
                                Table {tableIndex + 1}
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => adjustBreakfastTableGuests(dateStr, tableIndex, -1)}
                                      disabled={table <= 0}
                                      className="h-9 w-9"
                                      aria-label="Diminuer les invités"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => adjustBreakfastTableGuests(dateStr, tableIndex, 1)}
                                      className="h-9 w-9"
                                      aria-label="Augmenter les invités"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 min-w-[3ch] inline-block">
                                      {table}
                                    </span>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                                      {table === 1 ? 'invité' : 'invités'}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeBreakfastTable(dateStr, tableIndex)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 h-9 w-9"
                                    aria-label="Supprimer la table"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </div>
                                <div>
                                  <Label className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 block">
                                    Heure (optionnel)
                                  </Label>
                                  <TimePicker
                                    value={breakfastConfig.tableTimes?.[tableIndex] || null}
                                    onChange={(time) => 
                                      updateBreakfastTableTime(dateStr, tableIndex, time)
                                    }
                                    placeholder="Sélectionner l'heure"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        )}
                        {breakfastConfig && breakfastTotalGuests > 0 && (
                          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              Total : {breakfastTotalGuests} invité{breakfastTotalGuests !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</Label>
                        <Textarea
                          rows={3}
                          placeholder="Notes optionnelles..."
                          value={breakfastConfig?.notes || ''}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                            updateBreakfastNotes(dateStr, e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </TabsContent>
                  )}
                  
                  {isReservationDay && (
                    <TabsContent value="reservation" className="space-y-4 mt-4">
                      <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 block">
                          Nombre d'invités
                        </Label>
                        {(!reservationConfig || reservationConfig.guestCount === 0) ? (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                            Aucune réservation configurée. Utilisez les boutons ci-dessous pour définir le nombre d'invités.
                          </p>
                        ) : (
                          <div className="flex items-center gap-3 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => adjustReservationGuestCount(dateStr, -1)}
                                disabled={reservationConfig.guestCount <= 0}
                                className="h-9 w-9"
                                aria-label="Diminuer les invités"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => adjustReservationGuestCount(dateStr, 1)}
                                className="h-9 w-9"
                                aria-label="Augmenter les invités"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 text-center">
                              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 min-w-[3ch] inline-block">
                                {reservationConfig.guestCount}
                              </span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                                {reservationConfig.guestCount === 1 ? 'invité' : 'invités'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => clearReservation(dateStr)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 h-9 w-9"
                              aria-label="Effacer la réservation"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        )}
                        {(!reservationConfig || reservationConfig.guestCount === 0) && (
                          <div className="flex items-center justify-center gap-3 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => adjustReservationGuestCount(dateStr, 1)}
                                className="h-9 w-9"
                                aria-label="Augmenter les invités"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1 text-center">
                              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 min-w-[3ch] inline-block">
                                0
                              </span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                                invités
                              </span>
                            </div>
                            <div className="shrink-0 h-9 w-9" />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                            Heure de début (optionnel)
                          </Label>
                          <TimePicker
                            value={reservationConfig?.startTime || null}
                            onChange={(time) => 
                              updateReservationStartTime(dateStr, time)
                            }
                            placeholder="Sélectionner l'heure de début"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                            Heure de fin (optionnel)
                          </Label>
                          <TimePicker
                            value={reservationConfig?.endTime || null}
                            onChange={(time) => 
                              updateReservationEndTime(dateStr, time)
                            }
                            placeholder="Sélectionner l'heure de fin"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</Label>
                        <Textarea
                          rows={3}
                          placeholder="Notes optionnelles..."
                          value={reservationConfig?.notes || ''}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                            updateReservationNotes(dateStr, e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => {
                    // Clean up empty configs when dialog closes
                    setBreakfastConfigs(prev => prev.filter(c => {
                      const config = c.date === dateStr ? c : null
                      return !config || (config.tableBreakdown.length > 0 && config.tableBreakdown.some(t => t > 0))
                    }))
                    setReservationConfigs(prev => prev.filter(c => {
                      const config = c.date === dateStr ? c : null
                      return !config || config.guestCount > 0
                    }))
                    setOpenDayDialog(null)
                  }}>
                    Fermer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        })()}
      </DrawerContent>
    </Drawer>
  )
}
