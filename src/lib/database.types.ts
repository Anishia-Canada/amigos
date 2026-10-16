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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      amigo_details: {
        Row: {
          amigo_id: string
          bio: string | null
          confirmed_18_plus: boolean
          created_at: string
          home_location: unknown
          is_available: boolean
          is_verified: boolean
          service_radius_km: number
        }
        Insert: {
          amigo_id: string
          bio?: string | null
          confirmed_18_plus?: boolean
          created_at?: string
          home_location?: unknown
          is_available?: boolean
          is_verified?: boolean
          service_radius_km?: number
        }
        Update: {
          amigo_id?: string
          bio?: string | null
          confirmed_18_plus?: boolean
          created_at?: string
          home_location?: unknown
          is_available?: boolean
          is_verified?: boolean
          service_radius_km?: number
        }
        Relationships: [
          {
            foreignKeyName: "amigo_details_amigo_id_fkey"
            columns: ["amigo_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      amigo_services: {
        Row: {
          amigo_id: string
          has_equipment: boolean
          service_id: string
        }
        Insert: {
          amigo_id: string
          has_equipment?: boolean
          service_id: string
        }
        Update: {
          amigo_id?: string
          has_equipment?: boolean
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amigo_services_amigo_id_fkey"
            columns: ["amigo_id"]
            isOneToOne: false
            referencedRelation: "amigo_details"
            referencedColumns: ["amigo_id"]
          },
          {
            foreignKeyName: "amigo_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addresses: {
        Row: {
          address: string
          booking_id: string
        }
        Insert: {
          address: string
          booking_id: string
        }
        Update: {
          address?: string
          booking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_addresses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_dismissals: {
        Row: {
          amigo_id: string
          booking_id: string
          created_at: string
        }
        Insert: {
          amigo_id: string
          booking_id: string
          created_at?: string
        }
        Update: {
          amigo_id?: string
          booking_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_dismissals_amigo_id_fkey"
            columns: ["amigo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_dismissals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          amigo_id: string | null
          arrived_at: string | null
          completed_at: string | null
          created_at: string
          estimated_hours: number
          homeowner_id: string
          homeowner_marked_paid_at: string | null
          hours_worked: number | null
          id: string
          job_location: unknown
          locked_hourly_rate: number
          notes: string | null
          on_the_way_at: string | null
          paid_at: string | null
          scheduled_start: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          street_name: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amigo_id?: string | null
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_hours: number
          homeowner_id: string
          homeowner_marked_paid_at?: string | null
          hours_worked?: number | null
          id?: string
          job_location: unknown
          locked_hourly_rate: number
          notes?: string | null
          on_the_way_at?: string | null
          paid_at?: string | null
          scheduled_start: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          street_name?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amigo_id?: string | null
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_hours?: number
          homeowner_id?: string
          homeowner_marked_paid_at?: string | null
          hours_worked?: number | null
          id?: string
          job_location?: unknown
          locked_hourly_rate?: number
          notes?: string | null
          on_the_way_at?: string | null
          paid_at?: string | null
          scheduled_start?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          street_name?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_amigo_id_fkey"
            columns: ["amigo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_details: {
        Row: {
          address: string
          created_at: string
          homeowner_id: string
          location: unknown
        }
        Insert: {
          address: string
          created_at?: string
          homeowner_id: string
          location: unknown
        }
        Update: {
          address?: string
          created_at?: string
          homeowner_id?: string
          location?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_details_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          hourly_rate: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          name?: string
          slug?: string
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
      booking_status:
        | "requested"
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "completed"
        | "paid"
        | "cancelled"
      user_role: "homeowner" | "amigo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "requested",
        "accepted",
        "on_the_way",
        "arrived",
        "completed",
        "paid",
        "cancelled",
      ],
      user_role: ["homeowner", "amigo"],
    },
  },
} as const
