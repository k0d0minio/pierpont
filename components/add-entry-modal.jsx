"use client"

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { Checkbox } from './checkbox'
import { Dialog, DialogTitle, DialogBody, DialogActions } from './dialog'
import { getTodayBrusselsUtc, formatYmd, addDays } from '../src/lib/day-utils'
import { getAllPOCs, createPOC, getAllVenueTypes, createVenueType } from '../src/app/admin/settings/actions'

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
  const [pocs, setPocs] = useState([])
  const [venueTypes, setVenueTypes] = useState([])
  const [isLoadingPOCs, setIsLoadingPOCs] = useState(false)
  const [isLoadingVenueTypes, setIsLoadingVenueTypes] = useState(false)
  const [selectedPOC, setSelectedPOC] = useState(editEntry?.pocId ? String(editEntry.pocId) : '')
  const [selectedVenueType, setSelectedVenueType] = useState(editEntry?.venueTypeId ? String(editEntry.venueTypeId) : '')
  const [isAddPOCModalOpen, setIsAddPOCModalOpen] = useState(false)
  const [isAddVenueTypeModalOpen, setIsAddVenueTypeModalOpen] = useState(false)
  const [isAddingPOC, setIsAddingPOC] = useState(false)
  const [isAddingVenueType, setIsAddingVenueType] = useState(false)
  const [pocError, setPocError] = useState('')
  const [venueTypeError, setVenueTypeError] = useState('')
  const [pocFormData, setPocFormData] = useState({
    name: '',
    role: '',
    phoneNumber: '',
    email: '',
  })
  const [venueTypeFormData, setVenueTypeFormData] = useState({
    name: '',
    code: '',
  })
  const [isRecurring, setIsRecurring] = useState(editEntry?.isRecurring || false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(editEntry?.recurrenceFrequency || 'weekly')

  // Fetch POCs and Venue Types when modal opens
  useEffect(() => {
    if (isOpen && (entryType === 'golf' || entryType === 'event')) {
      setIsLoadingPOCs(true)
      getAllPOCs()
        .then((result) => {
          if (result.ok) {
            setPocs(result.data || [])
          }
        })
        .catch((err) => {
          console.error('Error loading POCs:', err)
        })
        .finally(() => {
          setIsLoadingPOCs(false)
        })
    }
    
    if (isOpen && (entryType === 'golf' || entryType === 'event')) {
      setIsLoadingVenueTypes(true)
      getAllVenueTypes()
        .then((result) => {
          if (result.ok) {
            setVenueTypes(result.data || [])
          }
        })
        .catch((err) => {
          console.error('Error loading venue types:', err)
        })
        .finally(() => {
          setIsLoadingVenueTypes(false)
        })
    }
  }, [isOpen, entryType])

  // Update selected POC and Venue Type when editEntry changes
  useEffect(() => {
    if (editEntry?.pocId) {
      setSelectedPOC(String(editEntry.pocId))
    } else {
      setSelectedPOC('')
    }
    
    if (editEntry?.venueTypeId) {
      setSelectedVenueType(String(editEntry.venueTypeId))
    } else {
      setSelectedVenueType('')
    }
    
    if (editEntry?.isRecurring) {
      setIsRecurring(true)
      setRecurrenceFrequency(editEntry.recurrenceFrequency || 'weekly')
    } else {
      setIsRecurring(false)
      setRecurrenceFrequency('weekly')
    }
  }, [editEntry])

  // Handle POC dropdown change
  const handlePOCChange = (e) => {
    const value = e.target.value
    if (value === 'add-new') {
      setIsAddPOCModalOpen(true)
      setSelectedPOC('')
    } else {
      setSelectedPOC(value)
    }
  }

  // Handle add POC form submit
  const handleAddPOCSubmit = async (e) => {
    e.preventDefault()
    setIsAddingPOC(true)
    setPocError('')

    try {
      const formData = new FormData()
      formData.append('name', pocFormData.name)
      formData.append('role', pocFormData.role)
      formData.append('phoneNumber', pocFormData.phoneNumber)
      formData.append('email', pocFormData.email)

      const result = await createPOC(formData)

      if (result.ok && result.data) {
        // Refresh POC list
        const pocsResult = await getAllPOCs()
        if (pocsResult.ok) {
          setPocs(pocsResult.data || [])
        }
        // Select the newly created POC
        setSelectedPOC(String(result.data.id))
        // Close modal and reset form
        setIsAddPOCModalOpen(false)
        setPocFormData({ name: '', role: '', phoneNumber: '', email: '' })
      } else {
        setPocError(result.error || 'Failed to create POC')
      }
    } catch (err) {
      setPocError('An error occurred. Please try again.')
    } finally {
      setIsAddingPOC(false)
    }
  }

  // Handle Venue Type dropdown change
  const handleVenueTypeChange = (e) => {
    const value = e.target.value
    if (value === 'add-new') {
      setIsAddVenueTypeModalOpen(true)
      setSelectedVenueType('')
    } else {
      setSelectedVenueType(value)
    }
  }

  // Handle add Venue Type form submit
  const handleAddVenueTypeSubmit = async (e) => {
    e.preventDefault()
    setIsAddingVenueType(true)
    setVenueTypeError('')

    try {
      const formData = new FormData()
      formData.append('name', venueTypeFormData.name)
      if (venueTypeFormData.code) {
        formData.append('code', venueTypeFormData.code)
      }

      const result = await createVenueType(formData)

      if (result.ok && result.data) {
        // Refresh venue types list
        const venueTypesResult = await getAllVenueTypes()
        if (venueTypesResult.ok) {
          setVenueTypes(venueTypesResult.data || [])
        }
        // Select the newly created venue type
        setSelectedVenueType(String(result.data.id))
        // Close modal and reset form
        setIsAddVenueTypeModalOpen(false)
        setVenueTypeFormData({ name: '', code: '' })
      } else {
        setVenueTypeError(result.error || 'Failed to create venue type')
      }
    } catch (err) {
      setVenueTypeError('An error occurred. Please try again.')
    } finally {
      setIsAddingVenueType(false)
    }
  }

  // Get min and max dates for date inputs (today to 1 year ahead)
  const todayUtc = getTodayBrusselsUtc()
  const oneYearFromToday = addDays(todayUtc, 365)
  const minDate = formatYmd(todayUtc)
  const maxDate = formatYmd(oneYearFromToday)

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    if (isEditMode) {
      formData.append('id', editEntry.id)
    }
    // Add recurring fields
    if (isRecurring) {
      formData.append('isRecurring', 'true')
      formData.append('recurrenceFrequency', recurrenceFrequency)
    } else {
      formData.append('isRecurring', 'false')
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
                  Room Number
                </label>
                <Input 
                  id="roomNumber"
                  name="roomNumber" 
                  type="text" 
                  placeholder="e.g., 101"
                  defaultValue={editEntry?.roomNumber || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count
              </label>
              <Input 
                id="guestCount"
                name="guestCount" 
                type="number" 
                placeholder="e.g., 2"
                defaultValue={editEntry?.guestCount || ''}
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
                  Room Number
                </label>
                <Input 
                  id="roomNumber"
                  name="roomNumber" 
                  type="text" 
                  placeholder="e.g., 101"
                  defaultValue={editEntry?.roomNumber || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count
              </label>
              <Input 
                id="guestCount"
                name="guestCount" 
                type="number" 
                placeholder="e.g., 2"
                defaultValue={editEntry?.guestCount || ''}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Check-in Date *
                </label>
                <Input 
                  id="checkInDate"
                  name="checkInDate" 
                  type="date" 
                  defaultValue={editEntry?.checkInDate || dateParam || ''}
                  min={minDate}
                  max={maxDate}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Check-out Date *
                </label>
                <Input 
                  id="checkOutDate"
                  name="checkOutDate" 
                  type="date" 
                  defaultValue={editEntry?.checkOutDate || ''}
                  min={minDate}
                  max={maxDate}
                  required
                  className="w-full"
                />
              </div>
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
                Description
              </label>
              <Textarea 
                id="description"
                name="description" 
                rows={3}
                placeholder="Describe the golf event..."
                defaultValue={editEntry?.description || ''}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmed Participants
                </label>
                <Input 
                  id="size"
                  name="size" 
                  type="number" 
                  placeholder="e.g., 54"
                  defaultValue={editEntry?.guestCount || ''}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Capacity
                </label>
                <Input 
                  id="capacity"
                  name="capacity" 
                  type="number" 
                  placeholder="e.g., 70"
                  defaultValue={editEntry?.capacity || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact)
                </label>
                <Select 
                  id="poc"
                  name="poc" 
                  value={selectedPOC}
                  onChange={handlePOCChange}
                  className="w-full"
                  disabled={isLoadingPOCs}
                >
                  <option value="">Select POC...</option>
                  {pocs.map((poc) => (
                    <option key={poc.id} value={poc.id}>
                      {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                    </option>
                  ))}
                  <option value="add-new" className="font-medium text-emerald-600">
                    + Add New POC
                  </option>
                </Select>
              </div>
              <div>
                <label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type
                </label>
                <Select 
                  id="venueType"
                  name="venueType" 
                  value={selectedVenueType}
                  onChange={handleVenueTypeChange}
                  className="w-full"
                  disabled={isLoadingVenueTypes}
                >
                  <option value="">Select venue type...</option>
                  {venueTypes.map((venueType) => (
                    <option key={venueType.id} value={venueType.id}>
                      {venueType.name}
                    </option>
                  ))}
                  <option value="add-new" className="font-medium text-emerald-600">
                    + Add New Venue Type
                  </option>
                </Select>
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center">
                <Checkbox 
                  id="isRecurring-golf"
                  checked={isRecurring}
                  onChange={setIsRecurring}
                  className="mr-2"
                />
                <label htmlFor="isRecurring-golf" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This is a recurring entry
                </label>
              </div>
              {isRecurring && (
                <div>
                  <label htmlFor="recurrenceFrequency-golf" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Recurrence Frequency
                  </label>
                  <Select 
                    id="recurrenceFrequency-golf"
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value)}
                    className="w-full"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </div>
              )}
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
                Description
              </label>
              <Textarea 
                id="description"
                name="description" 
                rows={3}
                placeholder="Describe the event..."
                defaultValue={editEntry?.description || ''}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmed Participants
                </label>
                <Input 
                  id="size"
                  name="size" 
                  type="number" 
                  placeholder="e.g., 54"
                  defaultValue={editEntry?.guestCount || ''}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Capacity
                </label>
                <Input 
                  id="capacity"
                  name="capacity" 
                  type="number" 
                  placeholder="e.g., 70"
                  defaultValue={editEntry?.capacity || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact)
                </label>
                <Select 
                  id="poc"
                  name="poc" 
                  value={selectedPOC}
                  onChange={handlePOCChange}
                  className="w-full"
                  disabled={isLoadingPOCs}
                >
                  <option value="">Select POC...</option>
                  {pocs.map((poc) => (
                    <option key={poc.id} value={poc.id}>
                      {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                    </option>
                  ))}
                  <option value="add-new" className="font-medium text-emerald-600">
                    + Add New POC
                  </option>
                </Select>
              </div>
              <div>
                <label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type
                </label>
                <Select 
                  id="venueType"
                  name="venueType" 
                  value={selectedVenueType}
                  onChange={handleVenueTypeChange}
                  className="w-full"
                  disabled={isLoadingVenueTypes}
                >
                  <option value="">Select venue type...</option>
                  {venueTypes.map((venueType) => (
                    <option key={venueType.id} value={venueType.id}>
                      {venueType.name}
                    </option>
                  ))}
                  <option value="add-new" className="font-medium text-emerald-600">
                    + Add New Venue Type
                  </option>
                </Select>
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center">
                <Checkbox 
                  id="isRecurring-event"
                  checked={isRecurring}
                  onChange={setIsRecurring}
                  className="mr-2"
                />
                <label htmlFor="isRecurring-event" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This is a recurring entry
                </label>
              </div>
              {isRecurring && (
                <div>
                  <label htmlFor="recurrenceFrequency-event" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Recurrence Frequency
                  </label>
                  <Select 
                    id="recurrenceFrequency-event"
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value)}
                    className="w-full"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </div>
              )}
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
                  Phone Number
                </label>
                <Input 
                  id="phoneNumber"
                  name="phoneNumber" 
                  type="tel" 
                  placeholder="e.g., +32 123 456 789"
                  defaultValue={editEntry?.phoneNumber || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <Input 
                  id="email"
                  name="email" 
                  type="email" 
                  placeholder="e.g., john@example.com"
                  defaultValue={editEntry?.email || ''}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Count
                </label>
                <Input 
                  id="guestCount"
                  name="guestCount" 
                  type="number" 
                  placeholder="e.g., 4"
                  defaultValue={editEntry?.guestCount || ''}
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
        case "hotel": return "Edit Hotel Booking"
        case "golf": return "Edit Golf Entry"
        case "event": return "Edit Event"
        case "reservation": return "Edit Reservation"
        default: return "Edit Entry"
      }
    } else {
      switch (entryType) {
        case "breakfast": return "Add Breakfast Group"
        case "hotel": return "Add Hotel Booking"
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

      {/* Add POC Modal */}
      <Dialog open={isAddPOCModalOpen} onClose={() => !isAddingPOC && setIsAddPOCModalOpen(false)}>
        <DialogTitle>Add New Point of Contact</DialogTitle>
        <form onSubmit={handleAddPOCSubmit}>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="poc-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <Input
                  id="poc-name"
                  type="text"
                  value={pocFormData.name}
                  onChange={(e) => setPocFormData({ ...pocFormData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Role
                </label>
                <Input
                  id="poc-role"
                  type="text"
                  value={pocFormData.role}
                  onChange={(e) => setPocFormData({ ...pocFormData, role: e.target.value })}
                  placeholder="e.g., Event Coordinator"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <Input
                  id="poc-phone"
                  type="tel"
                  value={pocFormData.phoneNumber}
                  onChange={(e) => setPocFormData({ ...pocFormData, phoneNumber: e.target.value })}
                  placeholder="e.g., +32 123 456 789"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <Input
                  id="poc-email"
                  type="email"
                  value={pocFormData.email}
                  onChange={(e) => setPocFormData({ ...pocFormData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  className="w-full"
                />
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              type="button"
              plain
              onClick={() => setIsAddPOCModalOpen(false)}
              disabled={isAddingPOC}
            >
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={isAddingPOC}>
              {isAddingPOC ? 'Adding...' : 'Add POC'}
            </Button>
          </DialogActions>
          {pocError && (
            <div className="px-6 pb-4">
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                {pocError}
              </div>
            </div>
          )}
        </form>
      </Dialog>

      {/* Add Venue Type Modal */}
      <Dialog open={isAddVenueTypeModalOpen} onClose={() => !isAddingVenueType && setIsAddVenueTypeModalOpen(false)}>
        <DialogTitle>Add New Venue Type</DialogTitle>
        <form onSubmit={handleAddVenueTypeSubmit}>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="venue-type-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <Input
                  id="venue-type-name"
                  type="text"
                  value={venueTypeFormData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setVenueTypeFormData({ 
                      ...venueTypeFormData, 
                      name,
                      code: venueTypeFormData.code || name.toLowerCase().replace(/\s+/g, '-')
                    });
                  }}
                  placeholder="e.g., Events Hall"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="venue-type-code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Code
                </label>
                <Input
                  id="venue-type-code"
                  type="text"
                  value={venueTypeFormData.code}
                  onChange={(e) => setVenueTypeFormData({ ...venueTypeFormData, code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g., events-hall (auto-generated from name)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Code is auto-generated from name if not provided.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              type="button"
              plain
              onClick={() => setIsAddVenueTypeModalOpen(false)}
              disabled={isAddingVenueType}
            >
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={isAddingVenueType}>
              {isAddingVenueType ? 'Adding...' : 'Add Venue Type'}
            </Button>
          </DialogActions>
          {venueTypeError && (
            <div className="px-6 pb-4">
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                {venueTypeError}
              </div>
            </div>
          )}
        </form>
      </Dialog>
    </Dialog>
  )
}
