export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      data_snapshots: {
        Row: {
          id: string
          created_at: string | null
          week_start: string
          week_end: string
          deals_count: number | null
          tasks_count: number | null
          deals_data: Json | null
          tasks_data: Json | null
          metadata: Json | null
          import_timestamp: string | null
          deals_imported: number | null
          tasks_imported: number | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          week_start: string
          week_end: string
          deals_count?: number | null
          tasks_count?: number | null
          deals_data?: Json | null
          tasks_data?: Json | null
          metadata?: Json | null
          import_timestamp?: string | null
          deals_imported?: number | null
          tasks_imported?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          week_start?: string
          week_end?: string
          deals_count?: number | null
          tasks_count?: number | null
          deals_data?: Json | null
          tasks_data?: Json | null
          metadata?: Json | null
          import_timestamp?: string | null
          deals_imported?: number | null
          tasks_imported?: number | null
        }
        Relationships: []
      }
      deal_files: {
        Row: {
          file_data: Json
          file_name: string
          id: string
          metadata: Json | null
          uploaded_at: string
        }
        Insert: {
          file_data: Json
          file_name: string
          id?: string
          metadata?: Json | null
          uploaded_at?: string
        }
        Update: {
          file_data?: Json
          file_name?: string
          id?: string
          metadata?: Json | null
          uploaded_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: number
          bitrix_id: string
          title: string | null
          stage_id: string | null
          stage_name: string | null
          amount: number | null
          currency: string | null
          assigned_by_id: string | null
          assigned_by_name: string | null
          contact_id: string | null
          contact_name: string | null
          company_id: string | null
          company_name: string | null
          date_create: string | null
          date_modify: string | null
          date_begin: string | null
          date_close: string | null
          department: string | null
          probability: number | null
          source_id: string | null
          type_id: string | null
          comments: string | null
          raw_data: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bitrix_id: string
          title?: string | null
          stage_id?: string | null
          stage_name?: string | null
          amount?: number | null
          currency?: string | null
          assigned_by_id?: string | null
          assigned_by_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          company_id?: string | null
          company_name?: string | null
          date_create?: string | null
          date_modify?: string | null
          date_begin?: string | null
          date_close?: string | null
          department?: string | null
          probability?: number | null
          source_id?: string | null
          type_id?: string | null
          comments?: string | null
          raw_data?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bitrix_id?: string
          title?: string | null
          stage_id?: string | null
          stage_name?: string | null
          amount?: number | null
          currency?: string | null
          assigned_by_id?: string | null
          assigned_by_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          company_id?: string | null
          company_name?: string | null
          date_create?: string | null
          date_modify?: string | null
          date_begin?: string | null
          date_close?: string | null
          department?: string | null
          probability?: number | null
          source_id?: string | null
          type_id?: string | null
          comments?: string | null
          raw_data?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_files: {
        Row: {
          file_data: Json
          file_name: string
          id: string
          uploaded_at: string
        }
        Insert: {
          file_data: Json
          file_name: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          file_data?: Json
          file_name?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          bitrix_id: string
          title: string | null
          status: string | null
          status_name: string | null
          priority: string | null
          priority_name: string | null
          created_by: string | null
          created_by_name: string | null
          responsible_id: string | null
          responsible_name: string | null
          date_create: string | null
          date_close: string | null
          description: string | null
          raw_data: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bitrix_id: string
          title?: string | null
          status?: string | null
          status_name?: string | null
          priority?: string | null
          priority_name?: string | null
          created_by?: string | null
          created_by_name?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          date_create?: string | null
          date_close?: string | null
          description?: string | null
          raw_data?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bitrix_id?: string
          title?: string | null
          status?: string | null
          status_name?: string | null
          priority?: string | null
          priority_name?: string | null
          created_by?: string | null
          created_by_name?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          date_create?: string | null
          date_close?: string | null
          description?: string | null
          raw_data?: Json
          created_at?: string | null
          updated_at?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
