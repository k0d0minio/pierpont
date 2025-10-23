"use client"

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { Checkbox } from './checkbox'
import { Dialog, DialogTitle, DialogBody, DialogActions } from './dialog'

export function AddEntryModal({ 
  isOpen, 
  onClose, 
  entryType, 
  onSubmit, 
  dateParam,
  isSubmitting = false,
  error = null,
  editEntry = null
}) {

  const isEditMode = !!editEntry

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    if (isEditMode) {
      formData.append('id', editEntry.id)
    }
    onSubmit(formData)
    // Don't close modal here - let parent handle it after success/error
  }

  const renderTypeSpecificFields = () => {
    switch (entryType) {
      case "breakfast":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </label>
                <Input 
                  id="guestName"
                  name="guestName" 
                  type="text" 
                  placeholder="e.g., John Smith"
                  defaultValue={editEntry?.guestName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Room Number *
                </label>
                <Input 
                  id="roomNumber"
                  name="roomNumber" 
                  type="text" 
                  placeholder="e.g., 101"
                  defaultValue={editEntry?.roomNumber || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count *
              </label>
              <Input 
                id="guestCount"
                name="guestCount" 
                type="number" 
                placeholder="e.g., 2"
                defaultValue={editEntry?.guestCount || ''}
                required
                className="w-full"
              />
            </div>
          </>
        );

      case "hotel":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </label>
                <Input 
                  id="guestName"
                  name="guestName" 
                  type="text" 
                  placeholder="e.g., John Smith"
                  defaultValue={editEntry?.guestName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Room Number *
                </label>
                <Input 
                  id="roomNumber"
                  name="roomNumber" 
                  type="text" 
                  placeholder="e.g., 101"
                  defaultValue={editEntry?.roomNumber || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count *
              </label>
              <Input 
                id="guestCount"
                name="guestCount" 
                type="number" 
                placeholder="e.g., 2"
                defaultValue={editEntry?.guestCount || ''}
                required
                className="w-full"
              />
            </div>
          </>
        );

      case "golf":
        return (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title *
              </label>
              <Input 
                id="title"
                name="title" 
                type="text" 
                placeholder="e.g., Golf Tournament"
                defaultValue={editEntry?.title || ''}
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description *
              </label>
              <Textarea 
                id="description"
                name="description" 
                rows={3}
                placeholder="Describe the golf event..."
                defaultValue={editEntry?.description || ''}
                required
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Size *
                </label>
                <Input 
                  id="size"
                  name="size" 
                  type="number" 
                  placeholder="e.g., 18"
                  defaultValue={editEntry?.guestCount || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Capacity *
                </label>
                <Input 
                  id="capacity"
                  name="capacity" 
                  type="number" 
                  placeholder="e.g., 20"
                  defaultValue={editEntry?.capacity || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact) *
                </label>
                <Input 
                  id="poc"
                  name="poc" 
                  type="text" 
                  placeholder="e.g., John Smith"
                  defaultValue={editEntry?.pocName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type *
                </label>
                <Select 
                  id="venueType"
                  name="venueType" 
                  defaultValue={editEntry?.location || ''}
                  required
                  className="w-full"
                >
                  <option value="">Select venue type...</option>
                  <option value="eagle">Eagle</option>
                  <option value="sports">Sports</option>
                  <option value="events-hall">Events Hall</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="terrace">Terrace</option>
                  <option value="courtyard">Courtyard</option>
                </Select>
              </div>
            </div>
          </>
        );

      case "event":
        return (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title *
              </label>
              <Input 
                id="title"
                name="title" 
                type="text" 
                placeholder="e.g., Corporate Event"
                defaultValue={editEntry?.title || ''}
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description *
              </label>
              <Textarea 
                id="description"
                name="description" 
                rows={3}
                placeholder="Describe the event..."
                defaultValue={editEntry?.description || ''}
                required
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Size *
                </label>
                <Input 
                  id="size"
                  name="size" 
                  type="number" 
                  placeholder="e.g., 50"
                  defaultValue={editEntry?.guestCount || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Capacity *
                </label>
                <Input 
                  id="capacity"
                  name="capacity" 
                  type="number" 
                  placeholder="e.g., 100"
                  defaultValue={editEntry?.capacity || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact) *
                </label>
                <Input 
                  id="poc"
                  name="poc" 
                  type="text" 
                  placeholder="e.g., Jane Doe"
                  defaultValue={editEntry?.pocName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type *
                </label>
                <Select 
                  id="venueType"
                  name="venueType" 
                  defaultValue={editEntry?.location || ''}
                  required
                  className="w-full"
                >
                  <option value="">Select venue type...</option>
                  <option value="eagle">Eagle</option>
                  <option value="sports">Sports</option>
                  <option value="events-hall">Events Hall</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="terrace">Terrace</option>
                  <option value="courtyard">Courtyard</option>
                </Select>
              </div>
            </div>
          </>
        );

      case "reservation":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </label>
                <Input 
                  id="guestName"
                  name="guestName" 
                  type="text" 
                  placeholder="e.g., John Smith"
                  defaultValue={editEntry?.guestName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number *
                </label>
                <Input 
                  id="phoneNumber"
                  name="phoneNumber" 
                  type="tel" 
                  placeholder="e.g., +32 123 456 789"
                  defaultValue={editEntry?.phoneNumber || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email *
                </label>
                <Input 
                  id="email"
                  name="email" 
                  type="email" 
                  placeholder="e.g., john@example.com"
                  defaultValue={editEntry?.email || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Count *
                </label>
                <Input 
                  id="guestCount"
                  name="guestCount" 
                  type="number" 
                  placeholder="e.g., 4"
                  defaultValue={editEntry?.guestCount || ''}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    if (isEditMode) {
      switch (entryType) {
        case "breakfast": return "Edit Breakfast Group"
        case "hotel": return "Edit Hotel Guest"
        case "golf": return "Edit Golf Entry"
        case "event": return "Edit Event"
        case "reservation": return "Edit Reservation"
        default: return "Edit Entry"
      }
    } else {
      switch (entryType) {
        case "breakfast": return "Add Breakfast Group"
        case "hotel": return "Add Hotel Guests"
        case "golf": return "Add Golf Entry"
        case "event": return "Add Event"
        case "reservation": return "Add Reservation"
        default: return "Add Entry"
      }
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{getTitle()}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogBody>
          <input type="hidden" name="date" value={dateParam} />
          <input type="hidden" name="type" value={entryType || ''} />
          
          <div className="space-y-4">
            {renderTypeSpecificFields()}
            
            {/* Time fields - show for all types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Time
                </label>
                <Input 
                  id="startTime"
                  name="startTime" 
                  type="time" 
                  defaultValue={editEntry?.startTime || ''}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  End Time
                </label>
                <Input 
                  id="endTime"
                  name="endTime" 
                  type="time" 
                  defaultValue={editEntry?.endTime || ''}
                  className="w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </label>
              <Textarea 
                id="notes"
                name="notes" 
                rows={3}
                placeholder="Additional notes or details..."
                defaultValue={editEntry?.notes || ''}
                className="w-full"
              />
            </div>

            {/* Tour Operator Flag */}
            <div className="flex items-center">
              <Checkbox 
                id="isTourOperator"
                name="isTourOperator" 
                defaultChecked={editEntry?.isTourOperator || false}
                className="mr-2"
              />
              <label htmlFor="isTourOperator" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mark as Tour Operator
              </label>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button type="button" plain onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" color="emerald" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Entry' : 'Add Entry')}
          </Button>
        </DialogActions>
        
        {error && (
          <div className="px-6 pb-4">
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              {error}
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}
