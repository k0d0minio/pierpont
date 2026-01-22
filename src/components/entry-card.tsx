"use client"

import clsx from 'clsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Clock, Users, Repeat, MapPin, User, type LucideIcon } from 'lucide-react'
import type { EntryWithRelations } from '@/types/components'
import type { Tables } from '../src/types/supabase'

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
const renderField = (label: string, value: string | number | null | undefined, className: string = ''): JSX.Element | null => {
  if (!value && value !== 0) return null
  
  return (
    <div key={label} className={clsx('flex justify-between items-start gap-2', className)}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">
        {label}:
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
  if (startTime) return `From ${startTime}`
  if (endTime) return `Until ${endTime}`
  return null
}

// Helper function to format recurrence frequency
const formatRecurrenceFrequency = (frequency: string | null | undefined): string => {
  const frequencyMap: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'Biweekly',
    'monthly': 'Monthly',
    'yearly': 'Yearly'
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

  const renderFields = (): (JSX.Element | null)[] => {
    const fields: (JSX.Element | null)[] = []
    
    switch (entry.type) {
      case 'breakfast':
      case 'hotel':
        fields.push(renderField('Guest', entry.guestName))
        fields.push(renderField('Room', entry.roomNumber))
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
    return fields.filter((f): f is JSX.Element => f !== null)
  }

  // Render golf/event card with modern design
  const renderGolfEventCard = () => {
    const timeRange = formatTimeRange(entry.startTime, entry.endTime)
    const confirmedParticipants = entry.guestCount || 0
    const maxCapacity = entry.capacity || 0
    const participationPercentage = maxCapacity > 0 ? (confirmedParticipants / maxCapacity) * 100 : 0
    const venue = formatVenueType(entry.venueType || entry.location)

    return (
      <div className="space-y-4">
        {/* Title and Description */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {entry.title || 'Untitled Event'}
          </h3>
          {entry.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {entry.description}
            </p>
          )}
        </div>

        {/* Participants with visual indicator */}
        {(confirmedParticipants > 0 || maxCapacity > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Participants
                </span>
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {confirmedParticipants}{maxCapacity > 0 ? ` / ${maxCapacity}` : ''}
              </span>
            </div>
            {maxCapacity > 0 && (
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    participationPercentage >= 100
                      ? 'bg-red-500 dark:bg-red-600'
                      : participationPercentage >= 80
                      ? 'bg-amber-500 dark:bg-amber-600'
                      : 'bg-emerald-500 dark:bg-emerald-600'
                  )}
                  style={{ width: `${Math.min(participationPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Time and Venue Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {timeRange && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                {timeRange}
              </span>
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {venue}
              </span>
            </div>
          )}
        </div>

        {/* Recurring indicator and POC */}
        <div className="flex items-center gap-2 flex-wrap">
          {entry.isRecurring && entry.recurrenceFrequency && (
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                {formatRecurrenceFrequency(entry.recurrenceFrequency)}
              </span>
            </div>
          )}
          {entry.poc?.name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                {entry.poc.name}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {entry.notes}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx(
      'group relative rounded-xl border p-5 transition-all duration-200 hover:shadow-lg',
      (entry.type === 'golf' || entry.type === 'event') 
        ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
        : clsx(config.bgColor, config.borderColor),
      'hover:scale-[1.01]'
    )}>
      {/* Action buttons for editors */}
      {isEditor && (
        <div className="absolute top-2 right-2 flex flex-col items-center gap-1 z-0">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="group/edit p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-label="Edit entry"
            title="Edit entry"
          >
            <Edit className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 group-hover/edit:text-blue-600 dark:group-hover/edit:text-blue-400 transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="group/delete p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete entry"
            title="Delete entry"
          >
            <Trash2 className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {/* Dynamic fields */}
      <div className={clsx('pr-12', (entry.type === 'golf' || entry.type === 'event') ? '' : 'space-y-2')}>
        {(entry.type === 'golf' || entry.type === 'event') ? (
          renderGolfEventCard()
        ) : (
          <>
            {renderFields()}
            
            {/* Tour Operator flag */}
            {entry.isTourOperator && (
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Tour Operator
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
                  Notes:
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.notes}
                </div>
              </div>
            )}
          </>
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
      case 'Breakfast': return 'Add Breakfast'
      case 'Hotel Guests': return 'Add Hotel Guest'
      case 'Golf': return 'Add Golf'
      case 'Events': return 'Add Event'
      case 'Reservations': return 'Add Reservation'
      default: return `Add ${title}`
    }
  }

  // Map color to badge variant
  const getBadgeVariant = (color?: string) => {
    if (!color) return 'default'
    // Keep custom colors via className, use default variant
    return 'default'
  }

  // Map color to button variant
  const getButtonVariant = (color?: string) => {
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
