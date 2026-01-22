/**
 * Shared component prop types
 * 
 * This file contains type definitions for component props.
 * All types use type aliases (not interfaces) as per project requirements.
 */

import type { Entry, PointOfContact } from './supabase'

export type EntryWithRelations = Entry & {
  venueType?: unknown;
  poc?: PointOfContact | null;
}
