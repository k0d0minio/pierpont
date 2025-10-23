"use client"

import clsx from 'clsx'
import { Badge } from './badge'
import { Button } from './button'
import { Edit, Trash2 } from 'lucide-react'

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
}

// Helper function to render field-value pairs
const renderField = (label, value, className = '') => {
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
const formatVenueType = (location) => {
  if (!location) return null
  
  const venueMap = {
    'eagle': 'Eagle',
    'sports': 'Sports',
    'events-hall': 'Events Hall',
    'restaurant': 'Restaurant',
    'terrace': 'Terrace',
    'courtyard': 'Courtyard'
  }
  
  return venueMap[location] || location
}

// Helper function to format time range
const formatTimeRange = (startTime, endTime) => {
  if (!startTime && !endTime) return null
  if (startTime && endTime) return `${startTime} - ${endTime}`
  if (startTime) return `From ${startTime}`
  if (endTime) return `Until ${endTime}`
  return null
}

export function EntryCard({ entry, isEditor, onEdit, onDelete }) {
  const config = entryConfigs[entry.type]

  const renderFields = () => {
    const fields = []
    
    switch (entry.type) {
      case 'breakfast':
      case 'hotel':
        fields.push(renderField('Guest', entry.guestName))
        fields.push(renderField('Room', entry.roomNumber))
        fields.push(renderField('Guests', entry.guestCount))
        break
        
      case 'golf':
      case 'event':
        fields.push(renderField('Title', entry.title))
        fields.push(renderField('Description', entry.description))
        fields.push(renderField('Size', entry.size))
        fields.push(renderField('Capacity', entry.capacity))
        fields.push(renderField('Venue', formatVenueType(entry.location)))
        break
        
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
    return fields.filter(Boolean)
  }

  return (
    <div className={clsx(
      'group relative rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
      config.bgColor,
      config.borderColor,
      'hover:scale-[1.02]'
    )}>
      {/* Action buttons for editors */}
      {isEditor && (
        <div className="absolute top-2 right-2 flex flex-col items-center gap-1 z-0">
          <button
            onClick={() => onEdit(entry)}
            className="group/edit p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-label="Edit entry"
            title="Edit entry"
          >
            <Edit className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 group-hover/edit:text-blue-600 dark:group-hover/edit:text-blue-400 transition-colors" />
          </button>
          <button
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
      <div className="space-y-2 pr-12">
        {renderFields()}
        
        {/* Tour Operator flag */}
        {entry.isTourOperator && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tour Operator
            </span>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
              ✓
            </span>
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
      </div>
    </div>
  )
}

export function SectionHeader({ title, count, icon: Icon, color, onAdd, isEditor }) {
  const getButtonText = (title) => {
    switch (title) {
      case 'Breakfast': return 'Add Breakfast'
      case 'Hotel Guests': return 'Add Hotel Guest'
      case 'Golf': return 'Add Golf'
      case 'Events': return 'Add Event'
      case 'Reservations': return 'Add Reservation'
      default: return `Add ${title}`
    }
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />}
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <Badge color={color} className="text-xs">
          {count}
        </Badge>
      </div>
      
      {isEditor && onAdd && (
        <Button
          onClick={onAdd}
          color={color}
          className="text-sm whitespace-nowrap"
        >
          {getButtonText(title)}
        </Button>
      )}
    </div>
  )
}
