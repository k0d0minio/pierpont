"use client"

import { useState } from 'react'
import { EntryCard, SectionHeader } from "../../../../components/entry-card.jsx"
import { AddEntryModal } from "../../../../components/add-entry-modal.jsx"
import { AddBreakfastModal } from "../../../../components/add-breakfast-modal.jsx"
import { Dialog, DialogTitle, DialogBody, DialogActions } from "../../../../components/dialog.jsx"
import { Button } from "../../../../components/button.jsx"
import { useAdminAuth } from "../../../lib/AdminAuthProvider"
import { createHotelBooking, updateHotelBooking, deleteHotelBooking, createBreakfastConfiguration, updateBreakfastConfiguration, deleteBreakfastConfiguration, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry, updateGolfEntry, updateEventEntry, updateReservationEntry, countRecurringOccurrences } from "./actions"
import { Coffee, Building, LandPlot, Calendar, Users } from 'lucide-react'
import { useRealtimeDaySchedule } from "../../../hooks/useRealtimeDaySchedule"

export default function DayViewClient({ 
  hotelBookings: initialHotelBookings = [], 
  breakfastConfigs: initialBreakfastConfigs = [],
  golfEntries: initialGolfEntries = [], 
  eventEntries: initialEventEntries = [],
  reservationEntries: initialReservationEntries = [],
  dateParam 
}) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  
  // Use real-time hook to get live updates
  const {
    hotelBookings,
    breakfastConfigs,
    golfEntries,
    eventEntries,
    reservationEntries,
    isConnected
  } = useRealtimeDaySchedule(
    dateParam,
    initialHotelBookings,
    initialBreakfastConfigs,
    initialGolfEntries,
    initialEventEntries,
    initialReservationEntries
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [breakfastModalOpen, setBreakfastModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [editingBreakfast, setEditingBreakfast] = useState(null)
  const [defaultBooking, setDefaultBooking] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'booking' or 'breakfast'
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false)
  const [recurringOccurrencesCount, setRecurringOccurrencesCount] = useState(0)
  

  const openModal = (type) => {
    setModalType(type)
    setModalOpen(true)
    setError(null)
    setEditingEntry(null)
  }

  const openEditModal = (entry) => {
    // Use the entry's type, or 'hotel' for hotel bookings (which don't have a type field)
    setModalType(entry.type || 'hotel')
    setModalOpen(true)
    setError(null)
    setEditingEntry(entry)
  }

  const openBreakfastModal = (booking = null, config = null) => {
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

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      let result
      const isEditMode = !!editingEntry
      
      if (isEditMode) {
        // Update operations
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
        // Create operations
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
        // The page will revalidate automatically due to revalidatePath in actions
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

  const handleBreakfastSubmit = async (formData) => {
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
        // The page will revalidate automatically due to revalidatePath in actions
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

  const handleDelete = async (entry, type = null) => {
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
        type = entryType
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
    formData.append('id', entryToDelete.id)
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
      // The page will revalidate automatically due to revalidatePath in actions
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

  const handleEdit = (entry) => {
    openEditModal(entry)
  }

  // Calculate total breakfast guests for the day
  const totalBreakfastGuests = breakfastConfigs.reduce((sum, config) => sum + (config.totalGuests || 0), 0)
  
  // Calculate total hotel guests for the day
  const totalHotelGuests = hotelBookings.reduce((sum, booking) => sum + (booking.guestCount || 0), 0)

  // Format table breakdown for display
  const formatTableBreakdown = (breakdown) => {
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
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <>
      <div className="space-y-8">
        {/* Hotel Bookings Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Hotel Bookings
              </h2>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {totalHotelGuests}
              </span>
            </div>
            {isAuthenticated && (
              <Button
                onClick={() => openModal('hotel')}
                color="blue"
                className="text-sm whitespace-nowrap"
              >
                Add Hotel Booking
              </Button>
            )}
          </div>

          {/* Breakfast Summary */}
          {totalBreakfastGuests > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Total Breakfast: {totalBreakfastGuests} guest{totalBreakfastGuests !== 1 ? 's' : ''}
                </span>
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
            <div className="space-y-4">
              {hotelBookings.map((booking) => {
                const bookingBreakfast = breakfastConfigs.find(
                  config => config.hotelBookingId === booking.id && config.breakfastDate === dateParam
                )
                const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))
                
                return (
                  <div
                    key={booking.id}
                    className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {booking.guestName || 'Unnamed Guest'}
                          </h3>
                          {booking.isTourOperator && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                              Tour Operator
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                          {booking.roomNumber && (
                            <div>Room: {booking.roomNumber}</div>
                          )}
                          {booking.guestCount && (
                            <div>Guests: {booking.guestCount}</div>
                          )}
                          <div>
                            {booking.checkInDate} to {booking.checkOutDate} ({nights} night{nights !== 1 ? 's' : ''})
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                            {booking.notes}
                          </div>
                        )}
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(booking)}
                            className="p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all"
                            title="Edit booking"
                          >
                            <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(booking, 'booking')}
                            className="p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all"
                            title="Delete booking"
                          >
                            <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakfast Configuration */}
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      {bookingBreakfast ? (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Breakfast: {bookingBreakfast.totalGuests} guest{bookingBreakfast.totalGuests !== 1 ? 's' : ''}
                              </span>
                              {formatTableBreakdown(bookingBreakfast.tableBreakdown) && (
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                  ({formatTableBreakdown(bookingBreakfast.tableBreakdown)})
                                </span>
                              )}
                            </div>
                            {bookingBreakfast.startTime && (
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                Time: {bookingBreakfast.startTime}
                              </div>
                            )}
                            {bookingBreakfast.notes && (
                              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                {bookingBreakfast.notes}
                              </div>
                            )}
                          </div>
                          {isAuthenticated && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openBreakfastModal(booking, bookingBreakfast)}
                                className="p-1 rounded bg-white dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all text-xs"
                                title="Edit breakfast"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(bookingBreakfast, 'breakfast')}
                                className="p-1 rounded bg-white dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all text-xs"
                                title="Delete breakfast"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            No breakfast configured
                          </span>
                          {isAuthenticated && (
                            <Button
                              onClick={() => openBreakfastModal(booking)}
                              color="amber"
                              className="text-xs"
                            >
                              Add Breakfast
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hotel bookings for this date</p>
            </div>
          )}
        </section>

        {/* Golf Section */}
        <section>
          <SectionHeader
            title="Golf"
            count={golfEntries.length}
            icon={LandPlot}
            color="emerald"
            onAdd={() => openModal('golf')}
            isEditor={isAuthenticated}
          />
          {golfEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {golfEntries.map((entry) => (
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
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <LandPlot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No golf events scheduled</p>
            </div>
          )}
        </section>

        {/* Events Section */}
        <section>
          <SectionHeader
            title="Events"
            count={eventEntries.length}
            icon={Calendar}
            color="sky"
            onAdd={() => openModal('event')}
            isEditor={isAuthenticated}
          />
          {eventEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No events scheduled</p>
            </div>
          )}
        </section>

        {/* Reservations Section */}
        <section>
          <SectionHeader
            title="Reservations"
            count={reservationEntries.reduce((total, entry) => total + (entry.guestCount || 0), 0)}
            icon={Users}
            color="purple"
            onAdd={() => openModal('reservation')}
            isEditor={isAuthenticated}
          />
          {reservationEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservationEntries.map((entry) => (
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
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reservations scheduled</p>
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
        dateParam={dateParam}
        isSubmitting={isSubmitting}
        error={error}
        editEntry={editingEntry}
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
      <Dialog open={deleteConfirmOpen} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogBody>
          <p className="text-zinc-700 dark:text-zinc-300 mb-4">
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
          </p>
          
          {/* Show recurring delete option if this is a recurring entry */}
          {recurringOccurrencesCount > 0 && (deleteType === 'event' || deleteType === 'golf') && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
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
              </label>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button type="button" plain onClick={cancelDelete}>
            Cancel
          </Button>
          <Button type="button" color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
