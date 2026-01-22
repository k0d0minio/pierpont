"use client"

import { useState } from 'react'
import { EntryCard } from "@/components/entry-card"
import { AddEntryModal } from "@/components/add-entry-modal"
import { AddBreakfastModal } from "@/components/add-breakfast-modal"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/lib/AdminAuthProvider"
import { createHotelBooking, updateHotelBooking, deleteHotelBooking, createBreakfastConfiguration, updateBreakfastConfiguration, deleteBreakfastConfiguration, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry, updateGolfEntry, updateEventEntry, updateReservationEntry, countRecurringOccurrences } from "@/app/day/[date]/actions"
import { Coffee, Building, LandPlot, Calendar as CalendarIcon, Users, CalendarDays, Clock, UtensilsCrossed } from 'lucide-react'
import type { Entry, HotelBooking, BreakfastConfiguration } from "@/types/supabase"
import { useRouter } from 'next/navigation'
import { parseYmd } from '@/lib/day-utils'

type EntryWithRelations = Entry & {
  venueType?: unknown;
  poc?: unknown;
}

type HotelBookingWithRelations = HotelBooking & {
  breakfastConfigurations?: BreakfastConfiguration[];
}

type BreakfastConfigWithRelations = BreakfastConfiguration & {
  hotelBooking?: HotelBooking;
}

type CalendarDaySidebarProps = {
  hotelBookings?: HotelBookingWithRelations[];
  breakfastConfigs?: BreakfastConfigWithRelations[];
  golfEntries?: EntryWithRelations[];
  eventEntries?: EntryWithRelations[];
  reservationEntries?: EntryWithRelations[];
  dateParam: string | null;
  onDataChange?: () => void;
}

type ModalType = 'hotel' | 'golf' | 'event' | 'reservation' | null;
type DeleteType = 'booking' | 'breakfast' | 'golf' | 'event' | 'reservation' | null;

export function CalendarDaySidebar({
  hotelBookings = [],
  breakfastConfigs = [],
  golfEntries = [],
  eventEntries = [],
  reservationEntries = [],
  dateParam,
  onDataChange
}: CalendarDaySidebarProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAdminAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [breakfastModalOpen, setBreakfastModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<EntryWithRelations | HotelBookingWithRelations | null>(null)
  const [editingBreakfast, setEditingBreakfast] = useState<BreakfastConfigWithRelations | null>(null)
  const [defaultBooking, setDefaultBooking] = useState<HotelBookingWithRelations | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<EntryWithRelations | HotelBookingWithRelations | BreakfastConfigWithRelations | null>(null)
  const [deleteType, setDeleteType] = useState<DeleteType>(null)
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false)
  const [recurringOccurrencesCount, setRecurringOccurrencesCount] = useState(0)

  const openModal = (type: ModalType) => {
    setModalType(type)
    setModalOpen(true)
    setError(null)
    setEditingEntry(null)
  }

  const openEditModal = (entry: EntryWithRelations | HotelBookingWithRelations) => {
    setModalType((entry.type || 'hotel') as ModalType)
    setModalOpen(true)
    setError(null)
    setEditingEntry(entry)
  }

  const openBreakfastModal = (booking: HotelBookingWithRelations | null = null, config: BreakfastConfigWithRelations | null = null) => {
    setEditingBreakfast(config)
    setDefaultBooking(booking)
    setBreakfastModalOpen(true)
    setError(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalType(null)
    setError(null)
    setEditingEntry(null)
  }

  const closeBreakfastModal = () => {
    setBreakfastModalOpen(false)
    setError(null)
    setEditingBreakfast(null)
    setDefaultBooking(null)
  }

  const handleSubmit = async (formData: FormData) => {
    if (!dateParam) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      let result: { ok: boolean; error?: string } | undefined
      const isEditMode = !!editingEntry

      if (isEditMode) {
        switch (modalType) {
          case 'hotel':
            result = await updateHotelBooking(formData)
            break
          case 'golf':
            result = await updateGolfEntry(formData)
            break
          case 'event':
            result = await updateEventEntry(formData)
            break
          case 'reservation':
            result = await updateReservationEntry(formData)
            break
          default:
            setError('Unknown entry type')
            return
        }
      } else {
        switch (modalType) {
          case 'hotel':
            result = await createHotelBooking(formData)
            break
          case 'golf':
            result = await createGolfEntry(formData)
            break
          case 'event':
            result = await createEventEntry(formData)
            break
          case 'reservation':
            result = await createReservationEntry(formData)
            break
          default:
            setError('Unknown entry type')
            return
        }
      }

      if (result?.ok) {
        closeModal()
        router.refresh()
        onDataChange?.()
      } else {
        setError(result?.error || `Failed to ${isEditMode ? 'update' : 'create'} entry`)
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBreakfastSubmit = async (formData: FormData) => {
    if (!dateParam) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      let result: { ok: boolean; error?: string } | undefined
      const isEditMode = !!editingBreakfast

      if (isEditMode) {
        result = await updateBreakfastConfiguration(formData)
      } else {
        result = await createBreakfastConfiguration(formData)
      }

      if (result?.ok) {
        closeBreakfastModal()
        router.refresh()
        onDataChange?.()
      } else {
        setError(result?.error || `Failed to ${isEditMode ? 'update' : 'create'} breakfast configuration`)
      }
    } catch (err) {
      console.error('Breakfast form submission error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (entry: EntryWithRelations | HotelBookingWithRelations | BreakfastConfigWithRelations, type: DeleteType = null) => {
    if (!dateParam) return
    
    setEntryToDelete(entry)
    setDeleteAllRecurring(false)
    setRecurringOccurrencesCount(0)

    if (!type) {
      const entryType = entry?.type
      if (entryType && ['golf', 'event', 'reservation'].includes(entryType)) {
        type = entryType as DeleteType
      } else if (entry?.checkInDate || entry?.checkOutDate) {
        type = 'booking'
      } else if (entry?.breakfastDate || entry?.hotelBookingId) {
        type = 'breakfast'
      } else {
        const entryId = entry?.id
        if (entryId) {
          if (golfEntries.some(e => e.id === entryId)) {
            type = 'golf'
          } else if (eventEntries.some(e => e.id === entryId)) {
            type = 'event'
          } else if (reservationEntries.some(e => e.id === entryId)) {
            type = 'reservation'
          } else if (hotelBookings.some(b => b.id === entryId)) {
            type = 'booking'
          } else if (breakfastConfigs.some(c => c.id === entryId)) {
            type = 'breakfast'
          } else {
            type = 'booking'
          }
        } else {
          type = 'booking'
        }
      }
    }

    if ((type === 'event' || type === 'golf') && entry?.isRecurring) {
      try {
        const count = await countRecurringOccurrences(entry.id, type)
        setRecurringOccurrencesCount(count || 0)
      } catch (err) {
        console.error('Error counting recurring occurrences:', err)
        setRecurringOccurrencesCount(0)
      }
    }

    setDeleteType(type)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!entryToDelete || !dateParam) return

    let result: { ok: boolean; error?: string } | undefined
    const formData = new FormData()
    formData.append('id', entryToDelete.id.toString())
    formData.append('date', dateParam)

    if (deleteAllRecurring && recurringOccurrencesCount > 0) {
      formData.append('deleteAllRecurring', 'true')
    }

    if (deleteType === 'breakfast') {
      result = await deleteBreakfastConfiguration(formData)
    } else if (deleteType === 'booking') {
      result = await deleteHotelBooking(formData)
    } else {
      switch (deleteType) {
        case 'golf':
          result = await deleteGolfEntry(formData)
          break
        case 'event':
          result = await deleteEventEntry(formData)
          break
        case 'reservation':
          result = await deleteReservationEntry(formData)
          break
        default:
          return
      }
    }

    if (result?.ok) {
      router.refresh()
      onDataChange?.()
    }

    setDeleteConfirmOpen(false)
    setEntryToDelete(null)
    setDeleteType(null)
    setDeleteAllRecurring(false)
    setRecurringOccurrencesCount(0)
  }

  const cancelDelete = () => {
    setDeleteConfirmOpen(false)
    setEntryToDelete(null)
    setDeleteType(null)
    setDeleteAllRecurring(false)
    setRecurringOccurrencesCount(0)
  }

  const handleEdit = (entry: EntryWithRelations | HotelBookingWithRelations) => {
    openEditModal(entry)
  }

  const totalBreakfastGuests = breakfastConfigs.reduce((sum, config) => sum + (config.totalGuests || 0), 0)
  const totalHotelGuests = hotelBookings.reduce((sum, booking) => sum + (booking.guestCount || 0), 0)

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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!dateParam) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-lg mb-2">Select a date</p>
          <p className="text-sm">Choose a date from the calendar to view details</p>
        </div>
      </div>
    )
  }

  // Format date for display
  const formatDateDisplay = (dateStr: string): string => {
    const date = parseYmd(dateStr)
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Date Header */}
      {dateParam && (
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDateDisplay(dateParam)}
            </h1>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Hotel Bookings Section */}
        {isAuthenticated && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Hotel Bookings
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {totalHotelGuests} guest{totalHotelGuests !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => openModal('hotel')}
                variant="default"
                size="sm"
                className="text-sm"
              >
                Add Booking
              </Button>
            </div>

            {totalBreakfastGuests > 0 && (
              <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/40">
                    <Coffee className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Total Breakfast: {totalBreakfastGuests} guest{totalBreakfastGuests !== 1 ? 's' : ''}
                    </div>
                    {breakfastConfigs.length > 0 && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {breakfastConfigs.map(config => {
                          const breakdown = formatTableBreakdown(config.tableBreakdown)
                          return breakdown || config.totalGuests
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {hotelBookings.length > 0 ? (
              <div className="space-y-3">
                {hotelBookings.map((booking) => {
                  const bookingBreakfast = breakfastConfigs.find(
                    config => config.hotelBookingId === booking.id && config.breakfastDate === dateParam
                  )
                  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={booking.id}
                      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {/* Guest Name and Tour Operator Badge */}
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                              {booking.guestName || 'Unnamed Guest'}
                            </h3>
                            {booking.isTourOperator && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full font-medium">
                                Tour Operator
                              </span>
                            )}
                          </div>

                          {/* Info Row: Room, Guests, Stay */}
                          <div className="flex items-center gap-4 flex-wrap mb-4">
                            {booking.roomNumber && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                  Room {booking.roomNumber}
                                </span>
                              </div>
                            )}
                            {booking.guestCount && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                  {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                {booking.checkInDate} → {booking.checkOutDate}
                              </span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                {nights} night{nights !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Notes with potential time extraction */}
                          {booking.notes && (
                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                              <div className="flex items-start gap-2">
                                <UtensilsCrossed className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                  {booking.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(booking)}
                            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                            title="Edit booking"
                            aria-label="Edit booking"
                          >
                            <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <title>Edit</title>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(booking, 'booking')}
                            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete booking"
                            aria-label="Delete booking"
                          >
                            <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <title>Delete</title>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        {bookingBreakfast ? (
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                  <Coffee className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {bookingBreakfast.totalGuests} guest{bookingBreakfast.totalGuests !== 1 ? 's' : ''}
                                  </span>
                                  {formatTableBreakdown(bookingBreakfast.tableBreakdown) && (
                                    <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full font-medium">
                                      {formatTableBreakdown(bookingBreakfast.tableBreakdown)}
                                    </span>
                                  )}
                                  {bookingBreakfast.startTime && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                      <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                        {bookingBreakfast.startTime}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {bookingBreakfast.notes && (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 ml-9">
                                  {bookingBreakfast.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => openBreakfastModal(booking, bookingBreakfast)}
                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                                title="Edit breakfast"
                                aria-label="Edit breakfast"
                              >
                                <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <title>Edit</title>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(bookingBreakfast, 'breakfast')}
                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete breakfast"
                                aria-label="Delete breakfast"
                              >
                                <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <title>Delete</title>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                              <Coffee className="h-4 w-4" />
                              <span>No breakfast configured</span>
                            </div>
                            <Button
                              onClick={() => openBreakfastModal(booking)}
                              variant="default"
                              size="sm"
                              className="text-sm"
                            >
                              Add Breakfast
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No hotel bookings for this date</p>
              </div>
            )}
          </section>
        )}

        {/* Golf and Events Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <LandPlot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Golf and Events
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {golfEntries.length + eventEntries.length} item{golfEntries.length + eventEntries.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {isAuthenticated && (
              <div className="flex gap-2">
                <Button
                  onClick={() => openModal('golf')}
                  variant="default"
                  size="sm"
                  className="text-sm"
                >
                  Add Golf
                </Button>
                <Button
                  onClick={() => openModal('event')}
                  variant="default"
                  size="sm"
                  className="text-sm"
                >
                  Add Event
                </Button>
              </div>
            )}
          </div>
          {(golfEntries.length > 0 || eventEntries.length > 0) ? (
            <div className="space-y-3">
              {golfEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isEditor={isAuthenticated}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {eventEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isEditor={isAuthenticated}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <LandPlot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No golf or events scheduled</p>
            </div>
          )}
        </section>
      </div>

      {/* Add Entry Modal */}
      <AddEntryModal
        isOpen={modalOpen}
        onClose={closeModal}
        entryType={modalType}
        onSubmit={handleSubmit}
        dateParam={dateParam || ''}
        isSubmitting={isSubmitting}
        error={error}
        editEntry={editingEntry}
      />

      {/* Breakfast Configuration Modal */}
      <AddBreakfastModal
        isOpen={breakfastModalOpen}
        onClose={closeBreakfastModal}
        onSubmit={handleBreakfastSubmit}
        dateParam={dateParam || ''}
        hotelBookings={hotelBookings}
        defaultBooking={defaultBooking}
        isSubmitting={isSubmitting}
        error={error}
        editConfig={editingBreakfast}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-700 dark:text-zinc-300">
              Are you sure you want to delete this {
                deleteType === 'breakfast'
                  ? 'breakfast configuration'
                  : deleteType === 'booking'
                    ? 'hotel booking'
                    : deleteType === 'golf'
                      ? 'golf entry'
                      : deleteType === 'event'
                        ? 'event entry'
                        : deleteType === 'reservation'
                          ? 'reservation entry'
                          : (entryToDelete?.type || deleteType) + ' entry'
              }? This action cannot be undone.
              {deleteType === 'booking' && ' All associated breakfast configurations will also be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {recurringOccurrencesCount > 0 && (deleteType === 'event' || deleteType === 'golf') && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteAllRecurring}
                  onChange={(e) => setDeleteAllRecurring(e.target.checked)}
                  className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-zinc-300 rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Delete all {recurringOccurrencesCount} other occurrence{recurringOccurrencesCount !== 1 ? 's' : ''} of this recurring {deleteType === 'event' ? 'event' : 'golf entry'}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    If unchecked, only this occurrence will be deleted.
                  </p>
                </div>
              </Label>
            </div>
          )}
          <AlertDialogFooter>
            <Button type="button" variant="ghost" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
