"use client"

import { useState } from 'react'
import { EntryCard, SectionHeader } from "../../../../components/entry-card.jsx"
import { AddEntryModal } from "../../../../components/add-entry-modal.jsx"
import { useAdminAuth } from "../../../lib/admin-auth.js"
import { createPDJGroup, deletePDJGroup, createHotelGuest, deleteHotelGuest, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry, createReservationEntry, deleteReservationEntry } from "./actions"
import { Coffee, Building, LandPlot, Calendar, Users } from 'lucide-react'

export default function DayViewClient({ 
  pdjGroups, 
  hotelEntries, 
  golfEntries, 
  eventEntries,
  reservationEntries,
  dateParam 
}) {
  const { isAuthenticated } = useAdminAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)

  const openModal = (type) => {
    setModalType(type)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalType(null)
  }

  const handleSubmit = async (formData) => {
    let result
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
        return
    }
    
    if (result?.ok) {
      // The page will revalidate automatically due to revalidatePath in actions
    }
  }

  const handleDelete = async (entry) => {
    let result
    switch (entry.type) {
      case 'breakfast':
        result = await deletePDJGroup(new FormData().append('id', entry.id).append('date', dateParam))
        break
      case 'hotel':
        result = await deleteHotelGuest(new FormData().append('id', entry.id).append('date', dateParam))
        break
      case 'golf':
        result = await deleteGolfEntry(new FormData().append('id', entry.id).append('date', dateParam))
        break
      case 'event':
        result = await deleteEventEntry(new FormData().append('id', entry.id).append('date', dateParam))
        break
      case 'reservation':
        result = await deleteReservationEntry(new FormData().append('id', entry.id).append('date', dateParam))
        break
      default:
        return
    }
    
    if (result?.ok) {
      // The page will revalidate automatically due to revalidatePath in actions
    }
  }

  const handleEdit = (entry) => {
    // TODO: Implement edit functionality
    console.log('Edit entry:', entry)
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
      />
    </>
  )
}
