"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntryCard } from "@/components/entry-card"
import { AddEntryModal } from "@/components/add-entry-modal"
import { AddBreakfastModal } from "@/components/add-breakfast-modal"
import { AddHotelBookingDrawer } from "@/components/add-hotel-booking-drawer"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/lib/AdminAuthProvider"
import { createHotelBooking, updateHotelBooking, deleteHotelBooking, createBreakfastConfiguration, updateBreakfastConfiguration, deleteBreakfastConfiguration, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry, updateGolfEntry, updateEventEntry, updateReservationEntry, countRecurringOccurrences } from "./actions"
import { Coffee, Building, LandPlot, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ProgramItem, Reservation, HotelBooking, BreakfastConfiguration } from "@/types/supabase"
import type { ProgramItemWithRelations, DayEntry } from "@/types/components"
import { DaySummaryCard } from "@/components/day-summary-card"

type HotelBookingWithRelations = HotelBooking & {
  breakfastConfigurations?: BreakfastConfiguration[];
}

type BreakfastConfigWithRelations = BreakfastConfiguration & {
  hotelBooking?: HotelBooking;
}

type DayViewClientProps = {
  hotelBookings?: HotelBookingWithRelations[];
  breakfastConfigs?: BreakfastConfigWithRelations[];
  golfEntries?: ProgramItemWithRelations[];
  eventEntries?: ProgramItemWithRelations[];
  reservationEntries?: (Reservation & { type: 'reservation' })[];
  dateParam: string;
}

type ModalType = 'hotel' | 'golf' | 'event' | 'reservation' | null;
type DeleteType = 'booking' | 'breakfast' | 'golf' | 'event' | 'reservation' | null;

export default function DayViewClient({
  hotelBookings = [],
  breakfastConfigs = [],
  golfEntries = [],
  eventEntries = [],
  reservationEntries = [],
  dateParam
}: DayViewClientProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAdminAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [breakfastModalOpen, setBreakfastModalOpen] = useState(false)
  const [hotelBookingDrawerOpen, setHotelBookingDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [editingBooking, setEditingBooking] = useState<HotelBookingWithRelations | null>(null)
  const [editingBreakfast, setEditingBreakfast] = useState<BreakfastConfigWithRelations | null>(null)
  const [defaultBooking, setDefaultBooking] = useState<HotelBookingWithRelations | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<DeleteType>(null)
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false)
  const [recurringOccurrencesCount, setRecurringOccurrencesCount] = useState(0)


  const openModal = (type: ModalType) => {
    setModalType(type)
    setModalOpen(true)
    setError(null)
    setEditingEntry(null)
  }

  const openEditModal = (entry: any) => {
    // Use the entry's type, or 'hotel' for hotel bookings (which don't have a type field)
    if (entry.type || entry.checkInDate) {
      // It's a hotel booking
      setEditingBooking(entry)
      setHotelBookingDrawerOpen(true)
      setError(null)
    } else {
      setModalType((entry.type || 'hotel') as ModalType)
      setModalOpen(true)
      setError(null)
      setEditingEntry(entry)
    }
  }

  const openHotelBookingDrawer = () => {
    setEditingBooking(null)
    setHotelBookingDrawerOpen(true)
    setError(null)
  }

  const closeHotelBookingDrawer = () => {
    setHotelBookingDrawerOpen(false)
    setError(null)
    setEditingBooking(null)
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
    setIsSubmitting(true)
    setError(null)

    try {
      let result
      const isEditMode = !!editingEntry

      if (isEditMode) {
        // Update operations
        switch (modalType) {
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
            setError('Type d\'entrée inconnu')
            return
        }
      } else {
        // Create operations
        switch (modalType) {
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
            setError('Type d\'entrée inconnu')
            return
        }
      }

      if (result?.ok) {
        closeModal()
        router.refresh()
      } else {
        setError(result?.error || `Échec de la ${isEditMode ? 'mise à jour' : 'création'} de l'entrée`)
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHotelBookingSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      let result
      const isEditMode = !!editingBooking

      if (isEditMode) {
        result = await updateHotelBooking(formData)
      } else {
        result = await createHotelBooking(formData)
      }

      if (result?.ok) {
        closeHotelBookingDrawer()
        router.refresh()
      } else {
        setError(result?.error || `Failed to ${isEditMode ? 'update' : 'create'} hotel booking`)
      }
    } catch (err) {
      console.error('Hotel booking submission error:', err)
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBreakfastSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      let result
      const isEditMode = !!editingBreakfast

      if (isEditMode) {
        result = await updateBreakfastConfiguration(formData)
      } else {
        result = await createBreakfastConfiguration(formData)
      }

      if (result?.ok) {
        closeBreakfastModal()
        router.refresh()
      } else {
        setError(result?.error || `Échec de la ${isEditMode ? 'mise à jour' : 'création'} de la configuration de petit-déjeuner`)
      }
    } catch (err) {
      console.error('Breakfast form submission error:', err)
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (entry: any, type: DeleteType = null) => {
    console.log('handleDelete called with:', { entry, type, entryType: entry?.type, entryKeys: entry ? Object.keys(entry) : null })
    setEntryToDelete(entry)
    setDeleteAllRecurring(false)
    setRecurringOccurrencesCount(0)

    // Auto-detect type from entry if not provided
    if (!type) {
      // First, check if entry has a type field (for golf, event, reservation entries)
      // Entry types should be: 'golf', 'event', 'reservation'
      const entryType = entry?.type
      if (entryType && ['golf', 'event', 'reservation'].includes(entryType)) {
        type = entryType as DeleteType
        console.log('Detected entry type from entry.type:', type)
      }
      // Check if it's a hotel booking (has checkInDate/checkOutDate but no type field)
      else if (entry?.checkInDate || entry?.checkOutDate) {
        type = 'booking'
        console.log('Detected hotel booking from checkInDate/checkOutDate')
      }
      // Check if it's a breakfast config (has breakfastDate and hotelBookingId)
      else if (entry?.breakfastDate || entry?.hotelBookingId) {
        type = 'breakfast'
        console.log('Detected breakfast configuration')
      }
      // Fallback: try to infer from which array it came from
      else {
        console.warn('Could not determine entry type from entry object, trying to infer from context. Entry:', entry)
        // Check which array contains this entry
        const entryId = entry?.id
        if (entryId) {
          if (golfEntries.some(e => e.id === entryId)) {
            type = 'golf'
            console.log('Inferred type: golf (from golfEntries array)')
          } else if (eventEntries.some(e => e.id === entryId)) {
            type = 'event'
            console.log('Inferred type: event (from eventEntries array)')
          } else if (reservationEntries.some(e => e.id === entryId)) {
            type = 'reservation'
            console.log('Inferred type: reservation (from reservationEntries array)')
          } else if (hotelBookings.some(b => b.id === entryId)) {
            type = 'booking'
            console.log('Inferred type: booking (from hotelBookings array)')
          } else if (breakfastConfigs.some(c => c.id === entryId)) {
            type = 'breakfast'
            console.log('Inferred type: breakfast (from breakfastConfigs array)')
          } else {
            // Last resort: default to 'booking' but log error
            console.error('Could not determine entry type! Entry:', entry)
            type = 'booking'
          }
        } else {
          console.error('Entry has no id! Entry:', entry)
          type = 'booking'
        }
      }
    }

    // Check if this is a recurring entry and count occurrences
    if ((type === 'event' || type === 'golf') && entry?.isRecurring) {
      try {
        const count = await countRecurringOccurrences(entry.id, type)
        setRecurringOccurrencesCount(count || 0)
        console.log('Found recurring occurrences:', count)
      } catch (err) {
        console.error('Error counting recurring occurrences:', err)
        setRecurringOccurrencesCount(0)
      }
    }

    console.log('Final deleteType:', type)
    setDeleteType(type)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!entryToDelete) return

    let result
    const formData = new FormData()
    formData.append('id', entryToDelete.id.toString())
    formData.append('date', dateParam)

    // If deleting all recurring occurrences, add the flag
    if (deleteAllRecurring && recurringOccurrencesCount > 0) {
      formData.append('deleteAllRecurring', 'true')
    }

    if (deleteType === 'breakfast') {
      result = await deleteBreakfastConfiguration(formData)
    } else if (deleteType === 'booking') {
      result = await deleteHotelBooking(formData)
    } else {
      // Entry types: golf, event, reservation
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
          console.error('Unknown delete type:', deleteType)
          return
      }
    }

    if (result?.ok) {
      router.refresh()
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

  const handleEdit = (entry: any) => {
    openEditModal(entry)
  }

  // Calculate total breakfast guests for the day
  const totalBreakfastGuests = breakfastConfigs.reduce((sum, config) => sum + (config.totalGuests || 0), 0)

  // Calculate total hotel guests for the day
  const totalHotelGuests = hotelBookings.reduce((sum, booking) => sum + (booking.guestCount || 0), 0)

  // Calculate total reservation guests for the day
  const totalReservationGuests = reservationEntries.reduce((sum, entry) => sum + (entry.guestCount || 0), 0)

  // Format table breakdown for display
  const formatTableBreakdown = (breakdown: any): string => {
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

  // Don't render until authentication state is loaded
  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <>
      <div className="space-y-8">
        {/* Summary Card - Only show for non-admin users */}
        {!isAuthenticated && (
          <DaySummaryCard
            breakfastConfigs={breakfastConfigs}
            reservationEntries={reservationEntries}
            totalBreakfastGuests={totalBreakfastGuests}
            totalReservationGuests={totalReservationGuests}
          />
        )}

        {/* Hotel Bookings Section - Only visible to admin users */}
        {isAuthenticated && (
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Building className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {"Réservations d'hôtel"}
                </h2>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {totalHotelGuests}
                </span>
              </div>
              <Button
                onClick={openHotelBookingDrawer}
                variant="default"
                className="text-xs sm:text-sm whitespace-nowrap min-h-[44px] px-3 sm:px-4"
              >
                <span className="hidden sm:inline">{"Ajouter une réservation d'hôtel"}</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>

            {/* Breakfast Summary */}
            {totalBreakfastGuests > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Total petit-déjeuner : {totalBreakfastGuests} invité{totalBreakfastGuests !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {breakfastConfigs.length > 0 && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      ({breakfastConfigs.map(config => {
                        const breakdown = formatTableBreakdown(config.tableBreakdown)
                        return breakdown || config.totalGuests
                      }).join(', ')})
                    </span>
                  )}
                </div>
              </div>
            )}

            {hotelBookings.length > 0 ? (
              <div className="space-y-2">
                {hotelBookings.map((booking) => {
                  const bookingBreakfast = breakfastConfigs.find(
                    config => config.hotelBookingId === booking.id && config.breakfastDate === dateParam
                  )
                  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 sm:py-2"
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-h-[44px]"
                          >
                            <span className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                              {booking.guestName || 'Invité sans nom'}
                            </span>
                            {booking.guestCount && (
                              <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                - {booking.guestCount} invité{booking.guestCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            <Info className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-80" align="start">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {booking.guestName || 'Invité sans nom'}
                                </h3>
                                {booking.isTourOperator && (
                                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                                    Opérateur touristique
                                  </span>
                                )}
                              </div>
                              {booking.guestCount && (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                  Invités : {booking.guestCount}
                                </div>
                              )}
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                {booking.checkInDate} au {booking.checkOutDate} ({nights} nuit{nights !== 1 ? 's' : ''})
                              </div>
                            </div>
                            {booking.notes && (
                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Notes :</div>
                                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                                  {booking.notes}
                                </div>
                              </div>
                            )}
                            {bookingBreakfast && (
                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-2 mb-1">
                                  <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Petit-déjeuner : {bookingBreakfast.totalGuests} invité{bookingBreakfast.totalGuests !== 1 ? 's' : ''}
                                  </span>
                                  {formatTableBreakdown(bookingBreakfast.tableBreakdown) && (
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                      ({formatTableBreakdown(bookingBreakfast.tableBreakdown)})
                                    </span>
                                  )}
                                </div>
                                {bookingBreakfast.startTime && (
                                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Heure : {bookingBreakfast.startTime}
                                  </div>
                                )}
                                {bookingBreakfast.notes && (
                                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    {bookingBreakfast.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <div className="flex gap-1.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(booking)}
                          className="p-2 sm:p-1.5 rounded bg-white dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                          title="Modifier la réservation"
                          aria-label="Modifier la réservation"
                        >
                          <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(booking, 'booking')}
                          className="p-2 sm:p-1.5 rounded bg-white dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                          title="Supprimer la réservation"
                          aria-label="Supprimer la réservation"
                        >
                          <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{"Aucune réservation d'hôtel pour cette date"}</p>
              </div>
            )}
          </section>
        )}

        {/* Golf and Events Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <LandPlot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Golf et événements
              </h2>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded">
                {golfEntries.length + eventEntries.length}
              </span>
            </div>
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => openModal('golf')}
                  variant="default"
                  className="text-xs sm:text-sm whitespace-nowrap min-h-[44px] px-3 sm:px-4 w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Ajouter du golf</span>
                  <span className="sm:hidden">Golf</span>
                </Button>
                <Button
                  onClick={() => openModal('event')}
                  variant="default"
                  className="text-xs sm:text-sm whitespace-nowrap min-h-[44px] px-3 sm:px-4 w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Ajouter un événement</span>
                  <span className="sm:hidden">Événement</span>
                </Button>
              </div>
            )}
          </div>
          {(golfEntries.length > 0 || eventEntries.length > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {golfEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry as DayEntry}
                  isEditor={isAuthenticated}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  eventEntriesForLookup={[...golfEntries, ...eventEntries].map((e) => ({ id: e.id, title: e.title ?? null, tableBreakdown: Array.isArray(e.tableBreakdown) ? (e.tableBreakdown as number[]) : null }))}
                />
              ))}
              {eventEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry as DayEntry}
                  isEditor={isAuthenticated}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  eventEntriesForLookup={[...golfEntries, ...eventEntries].map((e) => ({ id: e.id, title: e.title ?? null, tableBreakdown: Array.isArray(e.tableBreakdown) ? (e.tableBreakdown as number[]) : null }))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <LandPlot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun golf ou événement prévu</p>
            </div>
          )}
        </section>
      </div>

      {/* Add Entry Modal */}
      <AddEntryModal
        isOpen={modalOpen}
        onClose={closeModal}
        entryType={modalType === 'hotel' ? null : modalType}
        onSubmit={handleSubmit}
        dateParam={dateParam}
        isSubmitting={isSubmitting}
        error={error}
        editEntry={editingEntry}
        eventEntriesForDay={[...golfEntries, ...eventEntries].map((e) => ({
          id: e.id,
          title: e.title ?? null,
          type: e.type as 'golf' | 'event',
          tableBreakdown: (() => {
            const tb = (e as { tableBreakdown?: unknown }).tableBreakdown
            if (!tb || !Array.isArray(tb)) return null
            return tb.map((n: unknown) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0)
          })()
        }))}
      />

      {/* Hotel Booking Drawer */}
      <AddHotelBookingDrawer
        isOpen={hotelBookingDrawerOpen}
        onClose={closeHotelBookingDrawer}
        onSubmit={handleHotelBookingSubmit}
        dateParam={dateParam}
        isSubmitting={isSubmitting}
        error={error}
        editBooking={editingBooking}
        existingBreakfastConfigs={editingBooking ? breakfastConfigs.filter(c => c.hotelBookingId === editingBooking.id) : []}
        existingReservations={editingBooking ? reservationEntries.filter(r => r.hotelBookingId === editingBooking.id) : []}
      />

      {/* Breakfast Configuration Modal */}
      <AddBreakfastModal
        isOpen={breakfastModalOpen}
        onClose={closeBreakfastModal}
        onSubmit={handleBreakfastSubmit}
        dateParam={dateParam}
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-700 dark:text-zinc-300">
              Êtes-vous sûr de vouloir supprimer cette {
                deleteType === 'breakfast'
                  ? 'configuration de petit-déjeuner'
                  : deleteType === 'booking'
                    ? "réservation d'hôtel"
                    : deleteType === 'golf'
                      ? 'entrée de golf'
                      : deleteType === 'event'
                        ? "entrée d'événement"
                        : deleteType === 'reservation'
                          ? 'entrée de réservation'
                          : (entryToDelete?.type || deleteType) + ' entrée'
              } ? Cette action ne peut pas être annulée.
              {deleteType === 'booking' && ' Toutes les configurations de petit-déjeuner associées seront également supprimées.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Show recurring delete option if this is a recurring entry */}
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
                    Supprimer toutes les {recurringOccurrencesCount} autres occurrences de cette {deleteType === 'event' ? 'événement' : 'entrée de golf'} récurrente
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Si non coché, seule cette occurrence sera supprimée.
                  </p>
                </div>
              </Label>
            </div>
          )}
          <AlertDialogFooter>
            <Button type="button" variant="ghost" onClick={cancelDelete}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
