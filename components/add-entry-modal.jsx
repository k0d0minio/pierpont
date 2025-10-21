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
  dateParam 
}) {

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    onSubmit(formData)
    onClose()
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
    switch (entryType) {
      case "breakfast": return "Add Breakfast Group"
      case "hotel": return "Add Hotel Guests"
      case "golf": return "Add Golf Entry"
      case "event": return "Add Event"
      case "reservation": return "Add Reservation"
      default: return "Add Entry"
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
                className="w-full"
              />
            </div>

            {/* Tour Operator Flag */}
            <div className="flex items-center">
              <Checkbox 
                id="isTourOperator"
                name="isTourOperator" 
                className="mr-2"
              />
              <label htmlFor="isTourOperator" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mark as Tour Operator
              </label>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button type="button" plain onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color="emerald">
            Add Entry
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
