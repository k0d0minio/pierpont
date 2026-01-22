/**
 * Supabase Database Types
 * 
 * This file contains TypeScript types for the Supabase database schema.
 * To regenerate these types, run:
 *   supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
 * 
 * Or if using local development:
 *   supabase gen types typescript --local > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Day: {
        Row: {
          id: number
          dateISO: string
          weekday: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          dateISO: string
          weekday: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          dateISO?: string
          weekday?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Entry: {
        Row: {
          id: number
          dayId: number
          type: 'breakfast' | 'hotel' | 'golf' | 'event' | 'reservation'
          size: number | null
          label: string | null
          isAmbiguous: boolean | null
          source: string | null
          title: string | null
          participantsCount: number | null
          time: string | null
          startTime: string | null
          endTime: string | null
          location: string | null
          capacity: number | null
          notes: string | null
          guestName: string | null
          roomNumber: string | null
          guestCount: number | null
          description: string | null
          pocId: number | null
          phoneNumber: string | null
          email: string | null
          venueTypeId: number | null
          isTourOperator: boolean | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          dayId: number
          type: 'breakfast' | 'hotel' | 'golf' | 'event' | 'reservation'
          size?: number | null
          label?: string | null
          isAmbiguous?: boolean | null
          source?: string | null
          title?: string | null
          participantsCount?: number | null
          time?: string | null
          startTime?: string | null
          endTime?: string | null
          location?: string | null
          capacity?: number | null
          notes?: string | null
          guestName?: string | null
          roomNumber?: string | null
          guestCount?: number | null
          description?: string | null
          pocId?: number | null
          phoneNumber?: string | null
          email?: string | null
          venueTypeId?: number | null
          isTourOperator?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          dayId?: number
          type?: 'breakfast' | 'hotel' | 'golf' | 'event' | 'reservation'
          size?: number | null
          label?: string | null
          isAmbiguous?: boolean | null
          source?: string | null
          title?: string | null
          participantsCount?: number | null
          time?: string | null
          startTime?: string | null
          endTime?: string | null
          location?: string | null
          capacity?: number | null
          notes?: string | null
          guestName?: string | null
          roomNumber?: string | null
          guestCount?: number | null
          description?: string | null
          pocId?: number | null
          phoneNumber?: string | null
          email?: string | null
          venueTypeId?: number | null
          isTourOperator?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Entry_dayId_fkey"
            columns: ["dayId"]
            referencedRelation: "Day"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Entry_pocId_fkey"
            columns: ["pocId"]
            referencedRelation: "PointOfContact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Entry_venueTypeId_fkey"
            columns: ["venueTypeId"]
            referencedRelation: "VenueType"
            referencedColumns: ["id"]
          }
        ]
      }
      HotelBooking: {
        Row: {
          id: number
          guestName: string | null
          roomNumber: string | null
          guestCount: number | null
          checkInDate: string
          checkOutDate: string
          notes: string | null
          isTourOperator: boolean | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          guestName?: string | null
          roomNumber?: string | null
          guestCount?: number | null
          checkInDate: string
          checkOutDate: string
          notes?: string | null
          isTourOperator?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          guestName?: string | null
          roomNumber?: string | null
          guestCount?: number | null
          checkInDate?: string
          checkOutDate?: string
          notes?: string | null
          isTourOperator?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      BreakfastConfiguration: {
        Row: {
          id: number
          hotelBookingId: number
          breakfastDate: string
          tableBreakdown: Json
          totalGuests: number
          startTime: string | null
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          hotelBookingId: number
          breakfastDate: string
          tableBreakdown?: Json
          totalGuests?: number
          startTime?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          hotelBookingId?: number
          breakfastDate?: string
          tableBreakdown?: Json
          totalGuests?: number
          startTime?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BreakfastConfiguration_hotelBookingId_fkey"
            columns: ["hotelBookingId"]
            referencedRelation: "HotelBooking"
            referencedColumns: ["id"]
          }
        ]
      }
      PointOfContact: {
        Row: {
          id: number
          name: string
          role: string | null
          phoneNumber: string | null
          email: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          role?: string | null
          phoneNumber?: string | null
          email?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          role?: string | null
          phoneNumber?: string | null
          email?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      VenueType: {
        Row: {
          id: number
          name: string
          code: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Day = Tables<'Day'>
export type Entry = Tables<'Entry'>
export type HotelBooking = Tables<'HotelBooking'>
export type BreakfastConfiguration = Tables<'BreakfastConfiguration'>
export type PointOfContact = Tables<'PointOfContact'>
export type VenueType = Tables<'VenueType'>

// Insert types
export type DayInsert = Database['public']['Tables']['Day']['Insert']
export type EntryInsert = Database['public']['Tables']['Entry']['Insert']
export type HotelBookingInsert = Database['public']['Tables']['HotelBooking']['Insert']
export type BreakfastConfigurationInsert = Database['public']['Tables']['BreakfastConfiguration']['Insert']
export type PointOfContactInsert = Database['public']['Tables']['PointOfContact']['Insert']
export type VenueTypeInsert = Database['public']['Tables']['VenueType']['Insert']

// Update types
export type DayUpdate = Database['public']['Tables']['Day']['Update']
export type EntryUpdate = Database['public']['Tables']['Entry']['Update']
export type HotelBookingUpdate = Database['public']['Tables']['HotelBooking']['Update']
export type BreakfastConfigurationUpdate = Database['public']['Tables']['BreakfastConfiguration']['Update']
export type PointOfContactUpdate = Database['public']['Tables']['PointOfContact']['Update']
export type VenueTypeUpdate = Database['public']['Tables']['VenueType']['Update']
