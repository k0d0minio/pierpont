"use client"

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { getTodayBrusselsUtc, formatYmd, addDays } from '@/lib/day-utils'
import { getAllPOCs, createPOC, getAllVenueTypes, createVenueType } from '@/app/admin/settings/actions'
import { Tables } from '@/types/supabase'
import { EntryWithRelations } from '@/types/components'

type EntryType = Tables<'Entry'>['type']
type RecurrenceFrequency = Tables<'Entry'>['recurrenceFrequency']

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryType: EntryType | null;
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
  const [selectedEntryType, setSelectedEntryType] = useState<EntryType | null>(entryType || (editEntry?.type || null))

  // Update selectedEntryType when entryType prop changes
  useEffect(() => {
    if (entryType) {
      setSelectedEntryType(entryType)
    } else if (editEntry?.type) {
      setSelectedEntryType(editEntry.type)
    }
  }, [entryType, editEntry])

  // Use selectedEntryType for rendering, but allow golf/event to be interchangeable
  const effectiveEntryType = selectedEntryType || entryType || (editEntry?.type || null)
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
    if (isOpen && (effectiveEntryType === 'golf' || effectiveEntryType === 'event')) {
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

    if (isOpen && (effectiveEntryType === 'golf' || effectiveEntryType === 'event')) {
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
  }, [isOpen, effectiveEntryType])

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
        setPocError(result.error || 'Échec de la création du point de contact')
      }
    } catch (err) {
      setPocError('Une erreur s\'est produite. Veuillez réessayer.')
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
        setVenueTypeError(result.error || 'Échec de la création du type de lieu')
      }
    } catch (err) {
      setVenueTypeError('Une erreur s\'est produite. Veuillez réessayer.')
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
    // Use selectedEntryType for submission (or effectiveEntryType as fallback)
    const typeToSubmit = selectedEntryType || effectiveEntryType
    if (typeToSubmit) {
      formData.append('type', typeToSubmit)
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
    if (!effectiveEntryType) {
      return null
    }

    switch (effectiveEntryType) {
      case "breakfast":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guestName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nom de l&apos;invité *
              </Label>
              <Input
                id="guestName"
                name="guestName"
                type="text"
                placeholder="ex. Jean Dupont"
                defaultValue={editEntry?.guestName || ''}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre d&apos;invités
              </Label>
              <Input
                id="guestCount"
                name="guestCount"
                type="number"
                placeholder="ex. 2"
                defaultValue={editEntry?.guestCount || ''}
                className="w-full"
              />
            </div>
          </div>

        );

      case "golf":
        return (
          <>
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Titre *
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="ex. Tournoi de golf"
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
                placeholder="Décrivez l'événement de golf..."
                defaultValue={editEntry?.description || ''}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Participants confirmés
                </Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  placeholder="ex. 54"
                  defaultValue={editEntry?.guestCount || ''}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Capacité maximale
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  placeholder="ex. 70"
                  defaultValue={editEntry?.capacity || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Point de contact (POC)
                </Label>
                <Select
                  value={selectedPOC || undefined}
                  onValueChange={handlePOCChange}
                  disabled={isLoadingPOCs}
                >
                  <SelectTrigger id="poc" className="w-full">
                    <SelectValue placeholder="Sélectionner un point de contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pocs.map((poc) => (
                      <SelectItem key={poc.id} value={String(poc.id)}>
                        {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Ajouter un nouveau point de contact
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="poc" value={selectedPOC || ''} />
              </div>
              <div>
                <Label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Type de lieu
                </Label>
                <Select
                  value={selectedVenueType || undefined}
                  onValueChange={handleVenueTypeChange}
                  disabled={isLoadingVenueTypes}
                >
                  <SelectTrigger id="venueType" className="w-full">
                    <SelectValue placeholder="Sélectionner un type de lieu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map((venueType) => (
                      <SelectItem key={venueType.id} value={String(venueType.id)}>
                        {venueType.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Ajouter un nouveau type de lieu
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
                  Il s&apos;agit d&apos;une entrée récurrente
                </Label>
              </div>
              {isRecurring && (
                <div>
                  <Label htmlFor="recurrenceFrequency-golf" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Fréquence de récurrence
                  </Label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="recurrenceFrequency-golf" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bihebdomadaire (Toutes les 2 semaines)</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
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
                Titre *
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="ex. Événement d'entreprise"
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
                placeholder="Décrivez l'événement..."
                defaultValue={editEntry?.description || ''}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Participants confirmés
                </Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  placeholder="ex. 54"
                  defaultValue={editEntry?.guestCount || ''}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Capacité maximale
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  placeholder="ex. 70"
                  defaultValue={editEntry?.capacity || ''}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Point de contact (POC)
                </Label>
                <Select
                  value={selectedPOC || undefined}
                  onValueChange={handlePOCChange}
                  disabled={isLoadingPOCs}
                >
                  <SelectTrigger id="poc" className="w-full">
                    <SelectValue placeholder="Sélectionner un point de contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pocs.map((poc) => (
                      <SelectItem key={poc.id} value={String(poc.id)}>
                        {poc.name}{poc.role ? ` - ${poc.role}` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Ajouter un nouveau point de contact
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="poc" value={selectedPOC || ''} />
              </div>
              <div>
                <Label htmlFor="venueType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Type de lieu
                </Label>
                <Select
                  value={selectedVenueType || undefined}
                  onValueChange={handleVenueTypeChange}
                  disabled={isLoadingVenueTypes}
                >
                  <SelectTrigger id="venueType" className="w-full">
                    <SelectValue placeholder="Sélectionner un type de lieu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map((venueType) => (
                      <SelectItem key={venueType.id} value={String(venueType.id)}>
                        {venueType.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="font-medium text-emerald-600">
                      + Ajouter un nouveau type de lieu
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
                  Il s&apos;agit d&apos;une entrée récurrente
                </Label>
              </div>
              {isRecurring && (
                <div>
                  <Label htmlFor="recurrenceFrequency-event" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Fréquence de récurrence
                  </Label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="recurrenceFrequency-event" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bihebdomadaire (Toutes les 2 semaines)</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
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
                  Nom de l&apos;invité *
                </Label>
                <Input
                  id="guestName"
                  name="guestName"
                  type="text"
                  placeholder="ex. Jean Dupont"
                  defaultValue={editEntry?.guestName || ''}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="ex. +32 123 456 789"
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
                  placeholder="ex. jean@exemple.com"
                  defaultValue={editEntry?.email || ''}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="guestCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre d&apos;invités
                </Label>
                <Input
                  id="guestCount"
                  name="guestCount"
                  type="number"
                  placeholder="ex. 4"
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
      switch (effectiveEntryType) {
        case "breakfast": return "Modifier le groupe de petit-déjeuner"
        case "golf": return "Modifier l'entrée de golf"
        case "event": return "Modifier l'événement"
        case "reservation": return "Modifier la réservation"
        default: return "Modifier l'entrée"
      }
    } else {
      if (effectiveEntryType === 'golf' || effectiveEntryType === 'event') {
        return "Ajouter Golf/Événement"
      }
      switch (effectiveEntryType) {
        case "breakfast": return "Ajouter un groupe de petit-déjeuner"
        case "reservation": return "Ajouter une réservation"
        default: return "Ajouter une entrée"
      }
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{getTitle()}</DrawerTitle>
          <DrawerDescription>
            {effectiveEntryType === 'golf' ? 'Ajouter ou modifier les détails de l&apos;entrée de golf' :
              effectiveEntryType === 'event' ? 'Ajouter ou modifier les détails de l&apos;événement' :
                'Ajouter ou modifier les détails de l&apos;entrée'}
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-4">
                <input type="hidden" name="date" value={dateParam || ''} />

                {/* Entry Type Selector - only show for golf/event when not in edit mode */}
                {!isEditMode && (effectiveEntryType === 'golf' || effectiveEntryType === 'event' || !effectiveEntryType) && (
                  <div>
                    <Label htmlFor="entryType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Type d&apos;entrée *
                    </Label>
                    <Select
                      value={selectedEntryType || ''}
                      onValueChange={(value) => setSelectedEntryType(value as EntryType)}
                      required
                    >
                      <SelectTrigger id="entryType" className="w-full">
                        <SelectValue placeholder="Sélectionner le type d'entrée..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="golf">Golf</SelectItem>
                        <SelectItem value="event">Événement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {renderTypeSpecificFields()}

                {/* Time fields - show for all types when entry type is selected */}
                {effectiveEntryType && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Heure de début
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
                        Heure de fin
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
                )}

                {/* Notes */}
                {effectiveEntryType && (
                  <div>
                    <Label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="Notes ou détails supplémentaires..."
                      defaultValue={editEntry?.notes || ''}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Tour Operator Flag */}
                {effectiveEntryType && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isTourOperator"
                      name="isTourOperator"
                      defaultChecked={editEntry?.isTourOperator || false}
                      className="mr-2 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label htmlFor="isTourOperator" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Marquer comme opérateur touristique
                    </Label>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting || !effectiveEntryType}>
              {isSubmitting ? (isEditMode ? 'Mise à jour...' : 'Ajout...') : (isEditMode ? 'Mettre à jour l&apos;entrée' : 'Ajouter l&apos;entrée')}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>

      {/* Add POC Modal */}
      <Dialog open={isAddPOCModalOpen} onOpenChange={(open) => !open && !isAddingPOC && setIsAddPOCModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau point de contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPOCSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="poc-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nom *
                </Label>
                <Input
                  id="poc-name"
                  type="text"
                  value={pocFormData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, name: e.target.value })}
                  placeholder="ex. Jean Dupont"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="poc-role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Rôle
                </Label>
                <Input
                  id="poc-role"
                  type="text"
                  value={pocFormData.role}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, role: e.target.value })}
                  placeholder="ex. Coordinateur d'événements"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="poc-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Numéro de téléphone
                </Label>
                <Input
                  id="poc-phone"
                  type="tel"
                  value={pocFormData.phoneNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPocFormData({ ...pocFormData, phoneNumber: e.target.value })}
                  placeholder="ex. +32 123 456 789"
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
                  placeholder="ex. jean@exemple.com"
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
                Annuler
              </Button>
              <Button type="submit" variant="default" disabled={isAddingPOC}>
                {isAddingPOC ? 'Ajout...' : 'Ajouter le point de contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Venue Type Modal */}
      <Dialog open={isAddVenueTypeModalOpen} onOpenChange={(open) => !open && !isAddingVenueType && setIsAddVenueTypeModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau type de lieu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVenueTypeSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="venue-type-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nom *
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
                  placeholder="ex. Salle des événements"
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
                  placeholder="ex. salle-evenements (généré automatiquement à partir du nom)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Le code est généré automatiquement à partir du nom s&apos;il n&apos;est pas fourni.
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
                Annuler
              </Button>
              <Button type="submit" variant="default" disabled={isAddingVenueType}>
                {isAddingVenueType ? 'Ajout...' : 'Ajouter le type de lieu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Drawer>
  )
}
