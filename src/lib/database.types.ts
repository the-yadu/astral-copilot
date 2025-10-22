export interface Database {
  public: {
    Tables: {
      lessons: {
        Row: {
          id: string
          title: string
          outline: string
          status: string
          file_path: string | null
          content: string | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          outline: string
          status?: string
          file_path?: string | null
          content?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          outline?: string
          status?: string
          file_path?: string | null
          content?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}

export type Lesson = Database['public']['Tables']['lessons']['Row'];