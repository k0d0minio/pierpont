/**
 * Shared component prop types
 * 
 * This file contains type definitions for component props.
 * All types use type aliases (not interfaces) as per project requirements.
 */

import type { ProgramItem, Reservation, PointOfContact } from './supabase'

export type ProgramItemWithRelations = ProgramItem & {
  venueType?: unknown;
  poc?: PointOfContact | null;
}

export type ReservationWithRelations = Reservation

/** Discriminant union for day view cards: program item (golf/event) or reservation */
export type DayEntry =
  | (ProgramItemWithRelations & { type: 'golf' | 'event' })
  | (ReservationWithRelations & { type: 'reservation' })

export function isProgramItem(entry: DayEntry): entry is ProgramItemWithRelations & { type: 'golf' | 'event' } {
  return entry.type === 'golf' || entry.type === 'event'
}
