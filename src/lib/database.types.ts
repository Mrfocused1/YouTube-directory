export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string
          youtube_id: string
          youtube_url: string
          title: string
          channel: string
          thumbnail_url: string
          description: string
          published_at: string
          tags: string[]
          added_by_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          youtube_id: string
          youtube_url: string
          title: string
          channel: string
          thumbnail_url: string
          description: string
          published_at: string
          tags: string[]
          added_by_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          youtube_id?: string
          youtube_url?: string
          title?: string
          channel?: string
          thumbnail_url?: string
          description?: string
          published_at?: string
          tags?: string[]
          added_by_admin?: boolean
          created_at?: string
          updated_at?: string
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