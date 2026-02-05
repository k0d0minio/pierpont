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
      ProgramItem: {
        Row: {
          id: number
          dayId: number
          type: 'golf' | 'event'
          title: string | null
          description: string | null
          startTime: string | null
          endTime: string | null
          guestCount: number | null
          capacity: number | null
          venueTypeId: number | null
          pocId: number | null
          tableBreakdown: Json | null
          isRecurring: boolean
          recurrenceFrequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrenceGroupId: string | null
          isTourOperator: boolean
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          dayId: number
          type: 'golf' | 'event'
          title?: string | null
          description?: string | null
          startTime?: string | null
          endTime?: string | null
          guestCount?: number | null
          capacity?: number | null
          venueTypeId?: number | null
          pocId?: number | null
          tableBreakdown?: Json | null
          isRecurring?: boolean
          recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrenceGroupId?: string | null
          isTourOperator?: boolean
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          dayId?: number
          type?: 'golf' | 'event'
          title?: string | null
          description?: string | null
          startTime?: string | null
          endTime?: string | null
          guestCount?: number | null
          capacity?: number | null
          venueTypeId?: number | null
          pocId?: number | null
          tableBreakdown?: Json | null
          isRecurring?: boolean
          recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrenceGroupId?: string | null
          isTourOperator?: boolean
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProgramItem_dayId_fkey"
            columns: ["dayId"]
            referencedRelation: "Day"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProgramItem_venueTypeId_fkey"
            columns: ["venueTypeId"]
            referencedRelation: "VenueType"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProgramItem_pocId_fkey"
            columns: ["pocId"]
            referencedRelation: "PointOfContact"
            referencedColumns: ["id"]
          }
        ]
      }
      Reservation: {
        Row: {
          id: number
          dayId: number
          guestName: string | null
          phoneNumber: string | null
          email: string | null
          guestCount: number | null
          startTime: string | null
          endTime: string | null
          notes: string | null
          isTourOperator: boolean
          hotelBookingId: number | null
          programItemId: number | null
          tableIndex: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          dayId: number
          guestName?: string | null
          phoneNumber?: string | null
          email?: string | null
          guestCount?: number | null
          startTime?: string | null
          endTime?: string | null
          notes?: string | null
          isTourOperator?: boolean
          hotelBookingId?: number | null
          programItemId?: number | null
          tableIndex?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          dayId?: number
          guestName?: string | null
          phoneNumber?: string | null
          email?: string | null
          guestCount?: number | null
          startTime?: string | null
          endTime?: string | null
          notes?: string | null
          isTourOperator?: boolean
          hotelBookingId?: number | null
          programItemId?: number | null
          tableIndex?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reservation_dayId_fkey"
            columns: ["dayId"]
            referencedRelation: "Day"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reservation_hotelBookingId_fkey"
            columns: ["hotelBookingId"]
            referencedRelation: "HotelBooking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reservation_programItemId_fkey"
            columns: ["programItemId"]
            referencedRelation: "ProgramItem"
            referencedColumns: ["id"]
          }
        ]
      }
      HotelBooking: {
        Row: {
          id: number
          guestName: string | null
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
export type ProgramItem = Tables<'ProgramItem'>
export type Reservation = Tables<'Reservation'>
export type HotelBooking = Tables<'HotelBooking'>
export type BreakfastConfiguration = Tables<'BreakfastConfiguration'>
export type PointOfContact = Tables<'PointOfContact'>
export type VenueType = Tables<'VenueType'>

// Insert types
export type DayInsert = Database['public']['Tables']['Day']['Insert']
export type ProgramItemInsert = Database['public']['Tables']['ProgramItem']['Insert']
export type ReservationInsert = Database['public']['Tables']['Reservation']['Insert']
export type HotelBookingInsert = Database['public']['Tables']['HotelBooking']['Insert']
export type BreakfastConfigurationInsert = Database['public']['Tables']['BreakfastConfiguration']['Insert']
export type PointOfContactInsert = Database['public']['Tables']['PointOfContact']['Insert']
export type VenueTypeInsert = Database['public']['Tables']['VenueType']['Insert']

// Update types
export type DayUpdate = Database['public']['Tables']['Day']['Update']
export type ProgramItemUpdate = Database['public']['Tables']['ProgramItem']['Update']
export type ReservationUpdate = Database['public']['Tables']['Reservation']['Update']
export type HotelBookingUpdate = Database['public']['Tables']['HotelBooking']['Update']
export type BreakfastConfigurationUpdate = Database['public']['Tables']['BreakfastConfiguration']['Update']
export type PointOfContactUpdate = Database['public']['Tables']['PointOfContact']['Update']
export type VenueTypeUpdate = Database['public']['Tables']['VenueType']['Update']
