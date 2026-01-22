"use client"

import { ReactElement } from 'react'
import clsx from 'clsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit, Trash2, Clock, Users, Repeat, MapPin, User, type LucideIcon } from 'lucide-react'
import type { EntryWithRelations } from '@/types/components'
import type { Tables } from '@/types/supabase'

// Entry type configurations for styling
const entryConfigs = {
  breakfast: {
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  hotel: {
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  golf: {
    color: 'emerald',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  event: {
    color: 'sky',
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    borderColor: 'border-sky-200 dark:border-sky-800'
  },
  reservation: {
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  }
} as const

// Helper function to render field-value pairs
const renderField = (label: string, value: string | number | null | undefined, className: string = ''): ReactElement | null => {
  if (!value && value !== 0) return null
  
  const labelMap: Record<string, string> = {
    'Guest': 'Invité',
    'Guests': 'Invités',
    'Phone': 'Téléphone',
    'Email': 'Email',
    'Time': 'Heure',
    'Notes': 'Notes'
  }
  
  const translatedLabel = labelMap[label] || label
  
  return (
    <div key={label} className={clsx('flex justify-between items-start gap-2', className)}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">
        {translatedLabel}:
      </span>
      <span className="text-sm text-zinc-900 dark:text-zinc-100 text-right">
        {value}
      </span>
    </div>
  )
}

// Helper function to format venue type
const formatVenueType = (venueType: Tables<'VenueType'> | string | null | undefined): string | null => {
  if (!venueType) return null
  // venueType can be an object (from database) or a string (backward compatibility)
  if (typeof venueType === 'object' && 'name' in venueType) {
    return venueType.name
  }
  if (typeof venueType === 'string') {
    // Backward compatibility with old location field
    const venueMap: Record<string, string> = {
      'eagle': 'Eagle',
      'sports': 'Sports',
      'events-hall': 'Events Hall',
      'restaurant': 'Restaurant',
      'terrace': 'Terrace',
      'courtyard': 'Courtyard'
    }
    return venueMap[venueType] || venueType
  }
  return null
}

// Helper function to format time range
const formatTimeRange = (startTime: string | null | undefined, endTime: string | null | undefined): string | null => {
  if (!startTime && !endTime) return null
  if (startTime && endTime) return `${startTime} - ${endTime}`
  if (startTime) return `À partir de ${startTime}`
  if (endTime) return `Jusqu'à ${endTime}`
  return null
}

// Helper function to format recurrence frequency
const formatRecurrenceFrequency = (frequency: string | null | undefined): string => {
  const frequencyMap: Record<string, string> = {
    'weekly': 'Hebdomadaire',
    'biweekly': 'Bihebdomadaire',
    'monthly': 'Mensuel',
    'yearly': 'Annuel'
  }
  return frequencyMap[frequency || ''] || frequency || ''
}

interface EntryCardProps {
  entry: EntryWithRelations;
  isEditor: boolean;
  onEdit: (entry: EntryWithRelations) => void;
  onDelete: (entry: EntryWithRelations) => void;
}

export function EntryCard({ entry, isEditor, onEdit, onDelete }: EntryCardProps) {
  const config = entryConfigs[entry.type]

  const renderFields = (): (ReactElement | null)[] => {
    const fields: (ReactElement | null)[] = []
    
    switch (entry.type) {
      case 'breakfast':
      case 'hotel':
        fields.push(renderField('Guest', entry.guestName))
        fields.push(renderField('Guests', entry.guestCount))
        break
        
      case 'golf':
      case 'event':
        // Golf and event entries are now rendered with a custom layout
        // Return empty array as they're handled separately
        return []
        
      case 'reservation':
        fields.push(renderField('Guest', entry.guestName))
        fields.push(renderField('Phone', entry.phoneNumber))
        fields.push(renderField('Email', entry.email))
        fields.push(renderField('Guests', entry.guestCount))
        break
    }
    
    // Common fields for all types
    const timeRange = formatTimeRange(entry.startTime, entry.endTime)
    fields.push(renderField('Time', timeRange))
    
    // Filter out null fields
    return fields.filter((f): f is ReactElement => f !== null)
  }

  // Render golf/event card with compact design similar to hotel booking
  const renderGolfEventCard = () => {
    const timeRange = formatTimeRange(entry.startTime, entry.endTime)
    const confirmedParticipants = entry.guestCount || 0
    const maxCapacity = entry.capacity || 0
    const participationPercentage = maxCapacity > 0 ? (confirmedParticipants / maxCapacity) * 100 : 0
    const venue = formatVenueType((entry.venueType as Tables<'VenueType'> | string | null | undefined) || entry.location)
    const title = entry.title || 'Événement sans titre'
    const description = entry.description || ''
    const descriptionPreview = description.length > 50 ? description.substring(0, 50) + '...' : description
    
    // Get POC and venue names from relations (same way as popover does)
    const pocName = entry.poc?.name || null
    const venueName = venue

    return (
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {title}
            </span>
            {entry.isRecurring && entry.recurrenceFrequency && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Récurrent : {formatRecurrenceFrequency(entry.recurrenceFrequency)}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {pocName && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Point de contact : {pocName}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {timeRange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Heure : {timeRange}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {venueName && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <MapPin className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lieu : {venueName}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {(confirmedParticipants > 0 || maxCapacity > 0) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Participants : {confirmedParticipants}{maxCapacity > 0 ? ` / ${maxCapacity}` : ''}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {descriptionPreview && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400 block mt-0.5 truncate">
              {descriptionPreview}
            </span>
          )}
        </div>
        {isEditor && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="group/edit p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800"
              title="Modifier l'entrée"
              aria-label="Modifier l'entrée"
            >
              <Edit className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover/edit:text-blue-600 dark:group-hover/edit:text-blue-400 transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="group/delete p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:scale-105 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
              title="Supprimer l'entrée"
              aria-label="Supprimer l'entrée"
            >
              <Trash2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-400 transition-colors" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // For golf/event entries, render the compact card directly
  if (entry.type === 'golf' || entry.type === 'event') {
    return renderGolfEventCard()
  }

  // For other entry types, render the traditional card
  return (
    <div className={clsx(
      'group relative rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md p-5',
      clsx(config.bgColor, config.borderColor)
    )}>
      {/* Action buttons for editors */}
      {isEditor && (
        <div className="absolute top-2 right-2 flex flex-col items-center gap-1 z-0">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="group/edit p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-label="Modifier l'entrée"
            title="Modifier l'entrée"
          >
            <Edit className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 group-hover/edit:text-blue-600 dark:group-hover/edit:text-blue-400 transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="group/delete p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Supprimer l'entrée"
            title="Supprimer l'entrée"
          >
            <Trash2 className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {/* Dynamic fields */}
      <div className="pr-12 space-y-2">
        {renderFields()}
        
        {/* Tour Operator flag */}
        {entry.isTourOperator && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Opérateur touristique
            </span>
            <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
              ✓
            </Badge>
          </div>
        )}
        
        {/* Notes */}
        {entry.notes && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Notes :
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              {entry.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string;
  count: number;
  icon?: LucideIcon;
  color?: string;
  onAdd?: () => void;
  isEditor: boolean;
}

export function SectionHeader({ title, count, icon: Icon, color, onAdd, isEditor }: SectionHeaderProps) {
  const getButtonText = (title: string): string => {
    switch (title) {
      case 'Breakfast': return 'Ajouter un petit-déjeuner'
      case 'Hotel Guests': return 'Ajouter un invité d\'hôtel'
      case 'Golf': return 'Ajouter du golf'
      case 'Events': return 'Ajouter un événement'
      case 'Reservations': return 'Ajouter une réservation'
      default: return `Ajouter ${title}`
    }
  }

  // Map color to badge variant
  const getBadgeVariant = (color?: string): "default" | "destructive" | "outline" | "secondary" => {
    if (!color) return 'default'
    // Keep custom colors via className, use default variant
    return 'default'
  }

  // Map color to button variant
  const getButtonVariant = (color?: string): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" => {
    if (!color) return 'default'
    // Map specific colors to variants
    if (color === 'red') return 'destructive'
    return 'default'
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />}
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <Badge variant={getBadgeVariant(color)} className="text-xs">
          {count}
        </Badge>
      </div>
      
      {isEditor && onAdd && (
        <Button
          onClick={onAdd}
          variant={getButtonVariant(color)}
          className="text-sm whitespace-nowrap"
        >
          {getButtonText(title)}
        </Button>
      )}
    </div>
  )
}
