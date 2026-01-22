"use client"

import { useState } from 'react'
import { EntryCard } from "@/components/entry-card"
import { AddEntryModal } from "@/components/add-entry-modal"
import { AddBreakfastModal } from "@/components/add-breakfast-modal"
import { AddHotelBookingDrawer } from "@/components/add-hotel-booking-drawer"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/lib/AdminAuthProvider"
import { createHotelBooking, updateHotelBooking, deleteHotelBooking, createBreakfastConfiguration, updateBreakfastConfiguration, deleteBreakfastConfiguration, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry, updateGolfEntry, updateEventEntry, updateReservationEntry, countRecurringOccurrences } from "@/app/day/[date]/actions"
import { Coffee, Building, LandPlot, Edit, Trash2, Users, FileText, UtensilsCrossed } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Entry, HotelBooking, BreakfastConfiguration } from "@/types/supabase"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
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
  const [hotelBookingDrawerOpen, setHotelBookingDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<EntryWithRelations | HotelBookingWithRelations | null>(null)
  const [editingBooking, setEditingBooking] = useState<HotelBookingWithRelations | null>(null)
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
    // Check if it's a hotel booking by looking for checkInDate (hotel bookings don't have a type field)
    if ((entry as HotelBookingWithRelations).checkInDate) {
      // It's a hotel booking
      setEditingBooking(entry as HotelBookingWithRelations)
      setHotelBookingDrawerOpen(true)
      setError(null)
    } else if (entry.type && ['golf', 'event', 'reservation'].includes(entry.type)) {
      // It's a golf, event, or reservation entry
      setModalType(entry.type as ModalType)
      setModalOpen(true)
      setError(null)
      setEditingEntry(entry as EntryWithRelations)
    } else {
      // Fallback (shouldn't happen, but handle gracefully)
      setError('Unknown entry type')
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
    if (!dateParam) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      let result: { ok: boolean; error?: string } | undefined
      const isEditMode = !!editingEntry
      
      // Get entry type from form data (set by the modal) or fall back to modalType
      const entryType = formData.get('type') as string || modalType

      if (isEditMode) {
        switch (entryType) {
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
        switch (entryType) {
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
        onDataChange?.()
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
        setError(result?.error || `Échec de la ${isEditMode ? 'mise à jour' : 'création'} de la configuration de petit-déjeuner`)
      }
    } catch (err) {
      console.error('Breakfast form submission error:', err)
      setError('Une erreur inattendue s\'est produite')
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
        <div className="text-center py-8">Chargement...</div>
      </div>
    )
  }

  if (!dateParam) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-xl mb-3">Sélectionner une date</p>
          <p className="text-base">Choisissez une date dans le calendrier pour voir les détails</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="flex items-center justify-center min-h-full">
          <div className="w-full max-w-2xl space-y-8">
            {/* Hotel Bookings Section */}
            {isAuthenticated && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Réservations d&apos;hôtel
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {totalHotelGuests} invité{totalHotelGuests !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                onClick={openHotelBookingDrawer}
                variant="default"
                size="default"
                className="text-base"
              >
                Ajouter une réservation
              </Button>
            </div>

            {totalBreakfastGuests > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-200 dark:bg-amber-900/40">
                    <Coffee className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Total petit-déjeuner : {totalBreakfastGuests} invité{totalBreakfastGuests !== 1 ? 's' : ''}
                    </div>
                    {breakfastConfigs.length > 0 && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
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
              <div className="space-y-2">
                {hotelBookings.map((booking) => {
                  // Get all breakfast configurations for this booking
                  const bookingBreakfastConfigs = breakfastConfigs.filter(
                    config => config.hotelBookingId === booking.id
                  )
                  const hasBreakfast = bookingBreakfastConfigs.length > 0
                  
                  // Get all reservation entries for this booking
                  const bookingReservations = reservationEntries.filter(
                    entry => entry.hotelBookingId === booking.id
                  )
                  const hasReservations = bookingReservations.length > 0
                  
                  // Format dates as "Jan 4, 2026"
                  const checkInDate = parseYmd(booking.checkInDate)
                  const checkOutDate = parseYmd(booking.checkOutDate)
                  const dateRange = `${format(checkInDate, 'MMM d, yyyy')} - ${format(checkOutDate, 'MMM d, yyyy')}`

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {booking.guestName || 'Unnamed Guest'}
                          </span>
                          {booking.guestCount && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{booking.guestCount}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Invitations : {booking.guestCount}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {booking.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{booking.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {hasBreakfast && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {bookingBreakfastConfigs.map((config) => {
                                    // Parse table breakdown to show table-by-table configuration
                                    let tableBreakdownArray: number[] = []
                                    if (config.tableBreakdown) {
                                      if (Array.isArray(config.tableBreakdown)) {
                                        tableBreakdownArray = config.tableBreakdown
                                      } else if (typeof config.tableBreakdown === 'string') {
                                        try {
                                          const parsed = JSON.parse(config.tableBreakdown)
                                          if (Array.isArray(parsed)) {
                                            tableBreakdownArray = parsed
                                          }
                                        } catch {
                                          // Ignore parse errors
                                        }
                                      }
                                    }
                                    
                                    const guests = config.totalGuests || 0
                                    const tableConfig = tableBreakdownArray.length > 0
                                      ? tableBreakdownArray.map((guestsAtTable, idx) => 
                                          `Table ${idx + 1} : ${guestsAtTable} invité${guestsAtTable !== 1 ? 's' : ''}`
                                        ).join(', ')
                                      : `${guests} invité${guests !== 1 ? 's' : ''}`
                                    
                                    return (
                                      <div key={`${config.id || config.breakfastDate || config.startTime}`}>
                                        <div className="font-medium">
                                          {tableConfig}
                                        </div>
                                        {config.startTime && (
                                          <div className="text-xs opacity-90">Heure : {config.startTime}</div>
                                        )}
                                        {config.notes && (
                                          <div className="text-xs opacity-75 mt-1">{config.notes}</div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {hasReservations && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <UtensilsCrossed className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-2">
                                  {bookingReservations.map((reservation) => {
                                    const guestCount = reservation.guestCount || 0
                                    const timeRange = reservation.startTime && reservation.endTime
                                      ? `${reservation.startTime} - ${reservation.endTime}`
                                      : reservation.startTime
                                      ? reservation.startTime
                                      : null
                                    
                                    return (
                                      <div key={reservation.id || reservation.dayId}>
                                        {timeRange && (
                                          <div className="font-medium">
                                            {timeRange}
                                          </div>
                                        )}
                                        <div className={timeRange ? "text-xs opacity-90" : "font-medium"}>
                                          {guestCount} invité{guestCount !== 1 ? 's' : ''}
                                        </div>
                                        {reservation.notes && (
                                          <div className="text-xs opacity-75 mt-1">{reservation.notes}</div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 block mt-0.5">
                          {dateRange}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(booking)}
                          className="group/edit p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800"
                          title="Modifier la réservation"
                          aria-label="Modifier la réservation"
                        >
                          <Edit className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover/edit:text-blue-600 dark:group-hover/edit:text-blue-400 transition-colors" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(booking, 'booking')}
                          className="group/delete p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:scale-105 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
                          title="Supprimer la réservation"
                          aria-label="Supprimer la réservation"
                        >
                          <Trash2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">Aucune réservation d&apos;hôtel pour cette date</p>
              </div>
            )}
          </section>
        )}

        {/* Golf and Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <LandPlot className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Golf et événements
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {golfEntries.length + eventEntries.length} élément{golfEntries.length + eventEntries.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {isAuthenticated && (
              <Button
                onClick={() => openModal('golf')}
                variant="default"
                size="default"
                className="text-base"
              >
                Ajouter Golf/Événement
              </Button>
            )}
          </div>
          {(golfEntries.length > 0 || eventEntries.length > 0) ? (
            <div className="space-y-4">
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
            <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <LandPlot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium">Aucun golf ou événement prévu</p>
            </div>
          )}
          </section>
          </div>
        </div>
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

      {/* Hotel Booking Drawer */}
      <AddHotelBookingDrawer
        isOpen={hotelBookingDrawerOpen}
        onClose={closeHotelBookingDrawer}
        onSubmit={async (formData) => {
          if (!dateParam) return
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
              onDataChange?.()
            } else {
              setError(result?.error || `Échec de la ${isEditMode ? 'mise à jour' : 'création'} de la réservation d'hôtel`)
            }
          } catch (err) {
            console.error('Hotel booking submission error:', err)
            setError('Une erreur inattendue s\'est produite')
          } finally {
            setIsSubmitting(false)
          }
        }}
        dateParam={dateParam || undefined}
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-700 dark:text-zinc-300">
              Êtes-vous sûr de vouloir supprimer cette {
                deleteType === 'breakfast'
                  ? 'configuration de petit-déjeuner'
                  : deleteType === 'booking'
                    ? 'réservation d&apos;hôtel'
                    : deleteType === 'golf'
                      ? 'entrée de golf'
                      : deleteType === 'event'
                        ? 'entrée d&apos;événement'
                        : deleteType === 'reservation'
                          ? 'entrée de réservation'
                          : (entryToDelete?.type || deleteType) + ' entrée'
              } ? Cette action ne peut pas être annulée.
              {deleteType === 'booking' && ' Toutes les configurations de petit-déjeuner associées seront également supprimées.'}
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
    </div>
  )
}
