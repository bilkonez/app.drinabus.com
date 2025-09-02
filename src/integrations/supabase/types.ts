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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          amount: number
          cost_type: string
          created_at: string | null
          id: string
          note: string | null
          ride_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          cost_type: string
          created_at?: string | null
          id?: string
          note?: string | null
          ride_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          cost_type?: string
          created_at?: string | null
          id?: string
          note?: string | null
          ride_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "costs_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_costs"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          doc_type: string
          file_url: string
          id: string
          ride_id: string | null
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          file_url: string
          id?: string
          ride_id?: string | null
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          file_url?: string
          id?: string
          ride_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          license_expiry: string | null
          notes: string | null
          phone: string | null
          role: string | null
          tachograph_card_expiry: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          license_expiry?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          tachograph_card_expiry?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_expiry?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          tachograph_card_expiry?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          generated_at: string | null
          id: string
          kind: string | null
          message: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: string
          kind?: string | null
          message?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: string
          kind?: string | null
          message?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          created_at: string | null
          destination: string
          driver_id: string | null
          end_at: string
          id: string
          notes: string | null
          origin: string
          ride_type: string | null
          start_at: string
          status: string | null
          total_price: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          destination: string
          driver_id?: string | null
          end_at: string
          id?: string
          notes?: string | null
          origin: string
          ride_type?: string | null
          start_at: string
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: string
          driver_id?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          origin?: string
          ride_type?: string | null
          start_at?: string
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_costs"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_deadlines: {
        Row: {
          fire_extinguisher_expiry: string | null
          id: string
          registration_expiry: string | null
          tachograph_calibration_expiry: string | null
          technical_6m_expiry: string | null
          technical_expiry: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          fire_extinguisher_expiry?: string | null
          id?: string
          registration_expiry?: string | null
          tachograph_calibration_expiry?: string | null
          technical_6m_expiry?: string | null
          technical_expiry?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          fire_extinguisher_expiry?: string | null
          id?: string
          registration_expiry?: string | null
          tachograph_calibration_expiry?: string | null
          technical_6m_expiry?: string | null
          technical_expiry?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_deadlines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "v_vehicle_monthly_costs"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_deadlines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_service: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          invoice_url: string | null
          service_date: string
          service_type: string | null
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          service_date: string
          service_type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          service_date?: string
          service_type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_costs"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_service_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          model: string
          notes: string | null
          registration: string
          seats: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          model: string
          notes?: string | null
          registration: string
          seats?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          model?: string
          notes?: string | null
          registration?: string
          seats?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_daily_stats: {
        Row: {
          costs_total: number | null
          day: string | null
          profit_total: number | null
          revenue_total: number | null
          rides_count: number | null
        }
        Relationships: []
      }
      v_monthly_stats: {
        Row: {
          costs_total: number | null
          month: string | null
          profit_total: number | null
          revenue_total: number | null
          rides_count: number | null
        }
        Relationships: []
      }
      v_reminders_due: {
        Row: {
          days_left: number | null
          expiry_date: string | null
          kind: string | null
          ref_id: string | null
          title: string | null
        }
        Relationships: []
      }
      v_vehicle_monthly_costs: {
        Row: {
          costs_total: number | null
          month: string | null
          registration: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gen_daily_insights: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
