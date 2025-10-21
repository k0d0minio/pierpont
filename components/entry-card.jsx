"use client"

import clsx from 'clsx'
import { Badge } from './badge'
import { Button } from './button'
import { Coffee, Building, LandPlot, Calendar, Edit, Trash2, Users } from 'lucide-react'

// Entry type configurations
const entryConfigs = {
  breakfast: {
    icon: Coffee,
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Breakfast'
  },
  hotel: {
    icon: Building,
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Hotel'
  },
  golf: {
    icon: LandPlot,
    color: 'emerald',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Golf'
  },
  event: {
    icon: Calendar,
    color: 'sky',
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    borderColor: 'border-sky-200 dark:border-sky-800',
    label: 'Event'
  },
  reservation: {
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Reservation'
  }
}

export function EntryCard({ entry, isEditor, onEdit, onDelete }) {
  const config = entryConfigs[entry.type]
  const IconComponent = config.icon

  const formatEntryContent = (entry) => {
    switch (entry.type) {
      case 'breakfast':
        return `${entry.size}${entry.label ? ` ${entry.label}` : ''}`
      case 'hotel':
        return `${entry.size}${entry.source ? ` ${entry.source}` : ''}`
      case 'golf':
        return `${entry.title}${entry.participantsCount ? ` (${entry.participantsCount})` : ''}${entry.time ? ` at ${entry.time}` : ''}`
      case 'event':
        return `${entry.title}${entry.startTime ? ` ${entry.startTime}` : ''}${entry.endTime ? ` - ${entry.endTime}` : ''}${entry.location ? ` @ ${entry.location}` : ''}${entry.capacity ? ` [${entry.capacity}]` : ''}`
      case 'reservation':
        return `${entry.guestName || entry.title}${entry.guestCount ? ` (${entry.guestCount})` : ''}${entry.startTime ? ` at ${entry.startTime}` : ''}`
      default:
        return entry.title || 'Unknown'
    }
  }

  return (
    <div className={clsx(
      'group relative rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
      config.bgColor,
      config.borderColor,
      'hover:scale-[1.02]'
    )}>
      {/* Header with icon and type */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <Badge color={config.color} className="text-xs">
            {config.label}
          </Badge>
        </div>
        
        {/* Action buttons for editors */}
        {isEditor && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              plain
              onClick={() => onEdit(entry)}
              className="p-1 h-6 w-6 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label={`Edit ${config.label.toLowerCase()} entry`}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              plain
              onClick={() => onDelete(entry)}
              className="p-1 h-6 w-6 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
              aria-label={`Delete ${config.label.toLowerCase()} entry`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {formatEntryContent(entry)}
      </div>

      {/* Additional details */}
      {entry.notes && (
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          {entry.notes}
        </div>
      )}
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
