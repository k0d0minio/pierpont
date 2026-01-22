"use client"

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { getTodayBrusselsUtc, formatYmd, addDays } from '@/lib/day-utils'
import { getAllPOCs, createPOC, getAllVenueTypes, createVenueType } from '@/app/admin/settings/actions'
import { Tables } from '@/types/supabase'
import { EntryWithRelations } from '@/types/components'

type EntryType = Tables<'Entry'>['type']
type RecurrenceFrequency = Tables<'Entry'>['recurrenceFrequency']

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryType: EntryType;
  onSubmit: (formData: FormData) => void;
  dateParam?: string;
  isSubmitting?: boolean;
  error?: string | null;
  editEntry?: EntryWithRelations | null;
}

export function AddEntryModal({ 
  isOpen, 
  onClose, 
  entryType, 
  onSubmit, 
  dateParam,
  isSubmitting = false,
  error = null,
  editEntry = null
}: AddEntryModalProps) {

  const isEditMode = !!editEntry
  const [pocs, setPocs] = useState<Tables<'PointOfContact'>[]>([])
  const [venueTypes, setVenueTypes] = useState<Tables<'VenueType'>[]>([])
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
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(editEntry?.recurrenceFrequency || 'weekly')

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
  const handlePOCChange = (value: string) => {
    if (value === 'add-new') {
      setIsAddPOCModalOpen(true)
      setSelectedPOC('')
    } else {
      setSelectedPOC(value)
    }
  }

  // Handle add POC form submit
  const handleAddPOCSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
  const handleVenueTypeChange = (value: string) => {
    if (value === 'add-new') {
      setIsAddVenueTypeModalOpen(true)
      setSelectedVenueType('')
    } else {
      setSelectedVenueType(value)
    }
  }

  // Handle add Venue Type form submit
  const handleAddVenueTypeSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (isEditMode && editEntry) {
      formData.append('id', String(editEntry.id))
    }
    // Add recurring fields
    if (isRecurring) {
      formData.append('isRecurring', 'true')
      formData.append('recurrenceFrequency', recurrenceFrequency || 'weekly')
    } else {
      formData.append('isRecurring', 'false')
    }
    onSubmit(formData)
    // Don't close modal here - let parent handle it after success/error
  }

  const renderTypeSpecificFields = (): JSX.Element | null => {
    switch (entryType) {
      case "breakfast":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </Label>
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
                <Label htmlFor="roomNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Room Number
                </Label>
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
              <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count
              </Label>
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
                <Label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </Label>
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
                <Label htmlFor="roomNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Room Number
                </Label>
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
              <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Guest Count
              </Label>
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
                <Label htmlFor="checkInDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Check-in Date *
                </Label>
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
                <Label htmlFor="checkOutDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Check-out Date *
                </Label>
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
              <Label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title *
              </Label>
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
              <Label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </Label>
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
                <Label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmed Participants
                </Label>
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
                <Label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Capacity
                </Label>
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
                <Label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact)
                </Label>
                <Select 
                  value={selectedPOC || undefined}
                  onValueChange={handlePOCChange}
                  disabled={isLoadingPOCs}
                >
                  <SelectTrigger id="poc" className="w-full">
                    <SelectValue placeholder="Select POC..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pocs.map((poc) => (
                      <SelectItem key={poc.id} value={String(poc.id)}>
                        {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Add New POC
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="poc" value={selectedPOC || ''} />
              </div>
              <div>
                <Label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type
                </Label>
                <Select 
                  value={selectedVenueType || undefined}
                  onValueChange={handleVenueTypeChange}
                  disabled={isLoadingVenueTypes}
                >
                  <SelectTrigger id="venueType" className="w-full">
                    <SelectValue placeholder="Select venue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map((venueType) => (
                      <SelectItem key={venueType.id} value={String(venueType.id)}>
                        {venueType.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Add New Venue Type
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="venueType" value={selectedVenueType || ''} />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring-golf"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="isRecurring-golf" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This is a recurring entry
                </Label>
              </div>
              {isRecurring && (
                <div>
                  <Label htmlFor="recurrenceFrequency-golf" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Recurrence Frequency
                  </Label>
                  <Select 
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="recurrenceFrequency-golf" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly (Every 2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
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
              <Label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title *
              </Label>
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
              <Label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </Label>
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
                <Label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmed Participants
                </Label>
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
                <Label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Capacity
                </Label>
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
                <Label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  POC (Point of Contact)
                </Label>
                <Select 
                  value={selectedPOC || undefined}
                  onValueChange={handlePOCChange}
                  disabled={isLoadingPOCs}
                >
                  <SelectTrigger id="poc" className="w-full">
                    <SelectValue placeholder="Select POC..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pocs.map((poc) => (
                      <SelectItem key={poc.id} value={String(poc.id)}>
                        {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Add New POC
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="poc" value={selectedPOC || ''} />
              </div>
              <div>
                <Label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Type
                </Label>
                <Select 
                  value={selectedVenueType || undefined}
                  onValueChange={handleVenueTypeChange}
                  disabled={isLoadingVenueTypes}
                >
                  <SelectTrigger id="venueType" className="w-full">
                    <SelectValue placeholder="Select venue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map((venueType) => (
                      <SelectItem key={venueType.id} value={String(venueType.id)}>
                        {venueType.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Add New Venue Type
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="venueType" value={selectedVenueType || ''} />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring-event"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="isRecurring-event" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This is a recurring entry
                </Label>
              </div>
              {isRecurring && (
                <div>
                  <Label htmlFor="recurrenceFrequency-event" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Recurrence Frequency
                  </Label>
                  <Select 
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="recurrenceFrequency-event" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly (Every 2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
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
                <Label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Name *
                </Label>
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
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </Label>
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
                <Label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </Label>
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
                <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Guest Count
                </Label>
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

  const getTitle = (): string => {
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="date" value={dateParam || ''} />
          <input type="hidden" name="type" value={entryType || ''} />
          
          <div className="space-y-4">
            {renderTypeSpecificFields()}
            
            {/* Time fields - show for all types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Time
                </Label>
                <Input 
                  id="startTime"
                  name="startTime" 
                  type="time" 
                  defaultValue={editEntry?.startTime || ''}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  End Time
                </Label>
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
              <Label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </Label>
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
              <input
                type="checkbox"
                id="isTourOperator"
                name="isTourOperator" 
                defaultChecked={editEntry?.isTourOperator || false}
                className="mr-2 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="isTourOperator" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mark as Tour Operator
              </Label>
            </div>
          </div>
          
          {error && (
            <div className="mt-4">
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                {error}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Entry' : 'Add Entry')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Add POC Modal */}
      <Dialog open={isAddPOCModalOpen} onOpenChange={(open) => !open && !isAddingPOC && setIsAddPOCModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Point of Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPOCSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="poc-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </Label>
                <Input
                  id="poc-name"
                  type="text"
                  value={pocFormData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="poc-role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Role
                </Label>
                <Input
                  id="poc-role"
                  type="text"
                  value={pocFormData.role}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, role: e.target.value })}
                  placeholder="e.g., Event Coordinator"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="poc-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </Label>
                <Input
                  id="poc-phone"
                  type="tel"
                  value={pocFormData.phoneNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, phoneNumber: e.target.value })}
                  placeholder="e.g., +32 123 456 789"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="poc-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </Label>
                <Input
                  id="poc-email"
                  type="email"
                  value={pocFormData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  className="w-full"
                />
              </div>
            </div>
            {pocError && (
              <div className="mt-4">
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  {pocError}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddPOCModalOpen(false)}
                disabled={isAddingPOC}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isAddingPOC}>
                {isAddingPOC ? 'Adding...' : 'Add POC'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Venue Type Modal */}
      <Dialog open={isAddVenueTypeModalOpen} onOpenChange={(open) => !open && !isAddingVenueType && setIsAddVenueTypeModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Venue Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVenueTypeSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="venue-type-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </Label>
                <Input
                  id="venue-type-name"
                  type="text"
                  value={venueTypeFormData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
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
                <Label htmlFor="venue-type-code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Code
                </Label>
                <Input
                  id="venue-type-code"
                  type="text"
                  value={venueTypeFormData.code}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setVenueTypeFormData({ ...venueTypeFormData, code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g., events-hall (auto-generated from name)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Code is auto-generated from name if not provided.
                </p>
              </div>
            </div>
            {venueTypeError && (
              <div className="mt-4">
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  {venueTypeError}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddVenueTypeModalOpen(false)}
                disabled={isAddingVenueType}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isAddingVenueType}>
                {isAddingVenueType ? 'Adding...' : 'Add Venue Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
