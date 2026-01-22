"use client"

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tables } from '../src/types/supabase'

interface AddBreakfastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  dateParam?: string;
  hotelBookings?: Tables<'HotelBooking'>[];
  defaultBooking?: Tables<'HotelBooking'> | null;
  isSubmitting?: boolean;
  error?: string | null;
  editConfig?: Tables<'BreakfastConfiguration'> | null;
}

export function AddBreakfastModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  dateParam,
  hotelBookings = [],
  defaultBooking = null,
  isSubmitting = false,
  error = null,
  editConfig = null
}: AddBreakfastModalProps) {

  const isEditMode = !!editConfig

  // Parse initial table breakdown from edit config
  const getInitialTables = (): string[] => {
    if (!editConfig?.tableBreakdown) return ['']
    let breakdown = editConfig.tableBreakdown
    if (typeof breakdown === 'string') {
      try {
        breakdown = JSON.parse(breakdown)
      } catch {
        // If it's a string like "3+2+1", parse it
        if (breakdown.includes('+')) {
          return breakdown.split('+').map(s => s.trim()).filter(s => s)
        }
        return breakdown ? [breakdown] : ['']
      }
    }
    if (Array.isArray(breakdown) && breakdown.length > 0) {
      return breakdown.map(n => String(n))
    }
    return ['']
  }

  const [tables, setTables] = useState<string[]>(getInitialTables())
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    editConfig?.hotelBookingId ? String(editConfig.hotelBookingId) : (defaultBooking?.id ? String(defaultBooking.id) : '')
  )

  useEffect(() => {
    if (editConfig) {
      setTables(getInitialTables())
      setSelectedBookingId(editConfig.hotelBookingId ? String(editConfig.hotelBookingId) : '')
    } else if (defaultBooking) {
      setSelectedBookingId(defaultBooking.id ? String(defaultBooking.id) : '')
    } else {
      setTables([''])
      setSelectedBookingId('')
    }
  }, [editConfig, defaultBooking, isOpen])

  // Filter bookings that are active on the selected date
  const activeBookings = hotelBookings.filter(booking => {
    if (!dateParam) return true
    const date = new Date(dateParam + 'T00:00:00')
    const checkIn = new Date(booking.checkInDate + 'T00:00:00')
    const checkOut = new Date(booking.checkOutDate + 'T00:00:00')
    return date >= checkIn && date < checkOut
  })

  // Calculate total from tables array
  const totalGuests = tables.reduce((sum, table) => {
    const num = Number(table)
    return sum + (isNaN(num) || num <= 0 ? 0 : num)
  }, 0)

  const addTable = () => {
    setTables([...tables, ''])
  }

  const removeTable = (index: number) => {
    if (tables.length > 1) {
      setTables(tables.filter((_, i) => i !== index))
    }
  }

  const updateTable = (index: number, value: string) => {
    const newTables = [...tables]
    newTables[index] = value
    setTables(newTables)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Build table breakdown string from tables array
    const validTables = tables
      .map(t => Number(t.trim()))
      .filter(n => !isNaN(n) && n > 0)
    
    if (validTables.length === 0) {
      // Don't submit if no valid tables
      return
    }
    
    formData.set('tableBreakdown', validTables.join('+'))
    
    // Ensure hotelBookingId is set
    if (!formData.get('hotelBookingId') && selectedBookingId) {
      formData.set('hotelBookingId', String(selectedBookingId))
    }
    
    if (isEditMode && editConfig) {
      formData.append('id', String(editConfig.id))
    }
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier la configuration du petit-déjeuner' : 'Ajouter une configuration de petit-déjeuner'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="breakfastDate" value={dateParam || editConfig?.breakfastDate || ''} />
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="hotelBookingId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Réservation d'hôtel *
              </Label>
              <select
                id="hotelBookingId"
                name="hotelBookingId"
                required
                value={selectedBookingId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedBookingId(e.target.value)}
                className="w-full rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isEditMode || !!defaultBooking}
              >
                <option value="">Sélectionner une réservation d'hôtel...</option>
                {activeBookings.map(booking => (
                  <option key={booking.id} value={String(booking.id)}>
                    {booking.guestName || 'Sans nom'} ({booking.checkInDate} au {booking.checkOutDate})
                  </option>
                ))}
              </select>
              {activeBookings.length === 0 && !isEditMode && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Aucune réservation d'hôtel active pour cette date
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Répartition des tables *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addTable}
                  className="text-xs"
                >
                  + Ajouter une table
                </Button>
              </div>
              <div className="space-y-2">
                {tables.map((table, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="sr-only">Table {index + 1}</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={`Table ${index + 1} invités`}
                        value={table}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateTable(index, e.target.value)}
                        className="w-full"
                      />
                    </div>
                    {tables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTable(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                        title="Supprimer la table"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Entrez le nombre d'invités pour chaque table
              </p>
              {totalGuests > 0 && (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">
                  Total : {totalGuests} invité{totalGuests !== 1 ? 's' : ''} ({tables.filter(t => Number(t) > 0).join('+')})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Heure de début
              </Label>
              <Input 
                id="startTime"
                name="startTime" 
                type="time" 
                defaultValue={editConfig?.startTime || ''}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </Label>
              <Textarea 
                id="notes"
                name="notes" 
                rows={3}
                placeholder="Notes supplémentaires..."
                defaultValue={editConfig?.notes || ''}
                className="w-full"
              />
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
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              disabled={isSubmitting || (!isEditMode && (activeBookings.length === 0 || !selectedBookingId || totalGuests === 0))}
            >
              {isSubmitting ? (isEditMode ? 'Mise à jour...' : 'Ajout...') : (isEditMode ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
