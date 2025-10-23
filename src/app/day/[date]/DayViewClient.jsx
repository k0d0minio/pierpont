"use client"

import { useState } from 'react'
import { EntryCard, SectionHeader } from "../../../../components/entry-card.jsx"
import { AddEntryModal } from "../../../../components/add-entry-modal.jsx"
import { Dialog, DialogTitle, DialogBody, DialogActions } from "../../../../components/dialog.jsx"
import { Button } from "../../../../components/button.jsx"
import { useAdminAuth } from "../../../lib/AdminAuthProvider"
import { createPDJGroup, deletePDJGroup, createHotelGuest, deleteHotelGuest, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry, updatePDJGroup, updateHotelGuest, updateGolfEntry, updateEventEntry, updateReservationEntry } from "./actions"
import { Coffee, Building, LandPlot, Calendar, Users } from 'lucide-react'

export default function DayViewClient({ 
  pdjGroups, 
  hotelEntries, 
  golfEntries, 
  eventEntries,
  reservationEntries,
  dateParam 
}) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)

  const openModal = (type) => {
    setModalType(type)
    setModalOpen(true)
    setError(null)
    setEditingEntry(null)
  }

  const openEditModal = (entry) => {
    setModalType(entry.type)
    setModalOpen(true)
    setError(null)
    setEditingEntry(entry)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalType(null)
    setError(null)
    setEditingEntry(null)
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
          case 'breakfast':
            result = await updatePDJGroup(formData)
            break
          case 'hotel':
            result = await updateHotelGuest(formData)
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
          case 'breakfast':
            result = await createPDJGroup(formData)
            break
          case 'hotel':
            result = await createHotelGuest(formData)
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

  const handleDelete = (entry) => {
    setEntryToDelete(entry)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!entryToDelete) return
    
    let result
    switch (entryToDelete.type) {
      case 'breakfast':
        const breakfastFormData = new FormData()
        breakfastFormData.append('id', entryToDelete.id)
        breakfastFormData.append('date', dateParam)
        result = await deletePDJGroup(breakfastFormData)
        break
      case 'hotel':
        const hotelFormData = new FormData()
        hotelFormData.append('id', entryToDelete.id)
        hotelFormData.append('date', dateParam)
        result = await deleteHotelGuest(hotelFormData)
        break
      case 'golf':
        const golfFormData = new FormData()
        golfFormData.append('id', entryToDelete.id)
        golfFormData.append('date', dateParam)
        result = await deleteGolfEntry(golfFormData)
        break
      case 'event':
        const eventFormData = new FormData()
        eventFormData.append('id', entryToDelete.id)
        eventFormData.append('date', dateParam)
        result = await deleteEventEntry(eventFormData)
        break
      case 'reservation':
        const reservationFormData = new FormData()
        reservationFormData.append('id', entryToDelete.id)
        reservationFormData.append('date', dateParam)
        result = await deleteReservationEntry(reservationFormData)
        break
      default:
        return
    }
    
    if (result?.ok) {
      // The page will revalidate automatically due to revalidatePath in actions
    }
    
    setDeleteConfirmOpen(false)
    setEntryToDelete(null)
  }

  const cancelDelete = () => {
    setDeleteConfirmOpen(false)
    setEntryToDelete(null)
  }

  const handleEdit = (entry) => {
    openEditModal(entry)
  }

  // Don't render until authentication state is loaded
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <>
      <div className="space-y-8">
        {/* Breakfast Section */}
        <section>
          <SectionHeader
            title="Breakfast"
            count={pdjGroups.length}
            icon={Coffee}
            color="amber"
            onAdd={() => openModal('breakfast')}
            isEditor={isAuthenticated}
          />
          {pdjGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdjGroups.map((entry) => (
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
              <Coffee className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No breakfast groups scheduled</p>
            </div>
          )}
        </section>

        {/* Hotel Section */}
        <section>
          <SectionHeader
            title="Hotel Guests"
            count={hotelEntries.length}
            icon={Building}
            color="blue"
            onAdd={() => openModal('hotel')}
            isEditor={isAuthenticated}
          />
          {hotelEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelEntries.map((entry) => (
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
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hotel guests registered</p>
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
            count={reservationEntries.length}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogBody>
          <p className="text-zinc-700 dark:text-zinc-300">
            Are you sure you want to delete this {entryToDelete?.type} entry? This action cannot be undone.
          </p>
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
