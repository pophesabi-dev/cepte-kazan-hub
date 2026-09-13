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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          id: string
          identifier_hash: string
          ip_hash: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identifier_hash: string
          ip_hash?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identifier_hash?: string
          ip_hash?: string | null
          success?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_completions: {
        Row: {
          created_at: string
          external_transaction_id: string
          id: string
          metadata: Json
          offer_id: string | null
          points: number
          provider_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_transaction_id: string
          id?: string
          metadata?: Json
          offer_id?: string | null
          points?: number
          provider_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_transaction_id?: string
          id?: string
          metadata?: Json
          offer_id?: string | null
          points?: number
          provider_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_completions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_completions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "offer_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_providers: {
        Row: {
          category: string
          countries: string[]
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          min_reward: number
          name: string
          points_multiplier: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_reward?: number
          name: string
          points_multiplier?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_reward?: number
          name?: string
          points_multiplier?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          category: string
          countries: string[]
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          provider_id: string | null
          requirement: string | null
          reward_points: number | null
          sort_order: number
          title: string
          url: string | null
        }
        Insert: {
          category?: string
          countries?: string[]
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          provider_id?: string | null
          requirement?: string | null
          reward_points?: number | null
          sort_order?: number
          title: string
          url?: string | null
        }
        Update: {
          category?: string
          countries?: string[]
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          provider_id?: string | null
          requirement?: string | null
          reward_points?: number | null
          sort_order?: number
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "offer_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone_hash: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone_hash: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json
          reference: string | null
          status: string
          type: Database["public"]["Enums"]["ledger_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          status?: string
          type: Database["public"]["Enums"]["ledger_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          status?: string
          type?: Database["public"]["Enums"]["ledger_type"]
          user_id?: string
        }
        Relationships: []
      }
      postbacks: {
        Row: {
          accepted: boolean
          created_at: string
          external_transaction_id: string | null
          id: string
          ip_hash: string | null
          nonce: string | null
          payload: Json
          provider_id: string | null
          provider_slug: string | null
          reason: string | null
          signature_valid: boolean
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          ip_hash?: string | null
          nonce?: string | null
          payload?: Json
          provider_id?: string | null
          provider_slug?: string | null
          reason?: string | null
          signature_valid?: boolean
        }
        Update: {
          accepted?: boolean
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          ip_hash?: string | null
          nonce?: string | null
          payload?: Json
          provider_id?: string | null
          provider_slug?: string | null
          reason?: string | null
          signature_valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "postbacks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "offer_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          last_login_at: string | null
          phone_hash: string | null
          phone_verified: boolean
          referral_code: string
          referred_by: string | null
          signup_ip_hash: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_login_at?: string | null
          phone_hash?: string | null
          phone_verified?: boolean
          referral_code: string
          referred_by?: string | null
          signup_ip_hash?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_login_at?: string | null
          phone_hash?: string | null
          phone_verified?: boolean
          referral_code?: string
          referred_by?: string | null
          signup_ip_hash?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_secrets: {
        Row: {
          api_key: string | null
          api_secret: string | null
          callback_secret: string | null
          postback_url: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          callback_secret?: string | null
          postback_url?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          callback_secret?: string | null
          postback_url?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_secrets_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "offer_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          identity: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          identity: string
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          identity?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_points: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          risk_flag: string | null
          status: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          risk_flag?: string | null
          status?: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          risk_flag?: string | null
          status?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          severity: string
          signals: Json
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          severity?: string
          signals?: Json
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          severity?: string
          signals?: Json
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          level: string
          reasons: Json
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          level?: string
          reasons?: Json
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          level?: string
          reasons?: Json
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_methods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          min_points: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_points?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_points?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          created_at: string
          id: string
          method_id: string | null
          points: number
          review_note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method_id?: string | null
          points: number
          review_note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method_id?: string | null
          points?: number
          review_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_referral_code: { Args: never; Returns: string }
      get_balance: {
        Args: { _user_id: string }
        Returns: {
          pending: number
          today: number
          total: number
          week: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN"
      ledger_type:
        | "OFFER_COMPLETED"
        | "SURVEY_COMPLETED"
        | "REFERRAL_BONUS"
        | "ADMIN_ADJUSTMENT"
        | "WITHDRAWAL"
        | "REVERSAL"
        | "CHARGEBACK"
        | "SIGNUP_BONUS"
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
  public: {
    Enums: {
      app_role: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
      ledger_type: [
        "OFFER_COMPLETED",
        "SURVEY_COMPLETED",
        "REFERRAL_BONUS",
        "ADMIN_ADJUSTMENT",
        "WITHDRAWAL",
        "REVERSAL",
        "CHARGEBACK",
        "SIGNUP_BONUS",
      ],
    },
  },
} as const
