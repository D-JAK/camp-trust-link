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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          note: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          note?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      camp_checkins: {
        Row: {
          camp_id: string
          created_at: string
          day: string
          id: string
          ip_hash: string
          is_open: boolean
          latitude: number | null
          longitude: number | null
          note: string | null
          phone: string
        }
        Insert: {
          camp_id: string
          created_at?: string
          day?: string
          id?: string
          ip_hash: string
          is_open?: boolean
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          phone: string
        }
        Update: {
          camp_id?: string
          created_at?: string
          day?: string
          id?: string
          ip_hash?: string
          is_open?: boolean
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_checkins_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_sources: {
        Row: {
          camp_id: string
          created_at: string
          source_id: string
        }
        Insert: {
          camp_id: string
          created_at?: string
          source_id: string
        }
        Update: {
          camp_id?: string
          created_at?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_sources_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      camps: {
        Row: {
          building_type: Database["public"]["Enums"]["building_type"] | null
          camp_incharge_name: string | null
          camp_phone_primary: string | null
          camp_phone_secondary: string | null
          checkin_count: number
          created_at: string
          district_code: string
          duplicate_of: string | null
          id: string
          landmark: string | null
          last_checkin_at: string | null
          latitude: number | null
          location_accuracy_m: number | null
          longitude: number | null
          lsg_name: string
          lsg_type: Database["public"]["Enums"]["lsg_type"]
          name: string
          name_ml: string | null
          report_count: number
          reported_urgency: Database["public"]["Enums"]["urgency_level"] | null
          reported_urgency_reason: string | null
          source_published_at: string | null
          status: Database["public"]["Enums"]["camp_status"]
          status_last_confirmed_at: string | null
          taluk: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          verification_method:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_note: string | null
          verification_state: Database["public"]["Enums"]["verification_state"]
          verified_at: string | null
          verified_by: string | null
          village_or_locality: string | null
        }
        Insert: {
          building_type?: Database["public"]["Enums"]["building_type"] | null
          camp_incharge_name?: string | null
          camp_phone_primary?: string | null
          camp_phone_secondary?: string | null
          checkin_count?: number
          created_at?: string
          district_code: string
          duplicate_of?: string | null
          id?: string
          landmark?: string | null
          last_checkin_at?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          longitude?: number | null
          lsg_name: string
          lsg_type: Database["public"]["Enums"]["lsg_type"]
          name: string
          name_ml?: string | null
          report_count?: number
          reported_urgency?: Database["public"]["Enums"]["urgency_level"] | null
          reported_urgency_reason?: string | null
          source_published_at?: string | null
          status?: Database["public"]["Enums"]["camp_status"]
          status_last_confirmed_at?: string | null
          taluk: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          verification_method?:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_note?: string | null
          verification_state?: Database["public"]["Enums"]["verification_state"]
          verified_at?: string | null
          verified_by?: string | null
          village_or_locality?: string | null
        }
        Update: {
          building_type?: Database["public"]["Enums"]["building_type"] | null
          camp_incharge_name?: string | null
          camp_phone_primary?: string | null
          camp_phone_secondary?: string | null
          checkin_count?: number
          created_at?: string
          district_code?: string
          duplicate_of?: string | null
          id?: string
          landmark?: string | null
          last_checkin_at?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          longitude?: number | null
          lsg_name?: string
          lsg_type?: Database["public"]["Enums"]["lsg_type"]
          name?: string
          name_ml?: string | null
          report_count?: number
          reported_urgency?: Database["public"]["Enums"]["urgency_level"] | null
          reported_urgency_reason?: string | null
          source_published_at?: string | null
          status?: Database["public"]["Enums"]["camp_status"]
          status_last_confirmed_at?: string | null
          taluk?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          verification_method?:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_note?: string | null
          verification_state?: Database["public"]["Enums"]["verification_state"]
          verified_at?: string | null
          verified_by?: string | null
          village_or_locality?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camps_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "camps_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          code: string
          latitude: number | null
          longitude: number | null
          name: string
          name_ml: string | null
          sort_order: number
        }
        Insert: {
          code: string
          latitude?: number | null
          longitude?: number | null
          name: string
          name_ml?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_ml?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          active: boolean
          district_code: string | null
          id: string
          label: string
          label_ml: string | null
          last_verified_at: string | null
          phone: string
          scope: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          district_code?: string | null
          id?: string
          label: string
          label_ml?: string | null
          last_verified_at?: string | null
          phone: string
          scope: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          district_code?: string | null
          id?: string
          label?: string
          label_ml?: string | null
          last_verified_at?: string | null
          phone?: string
          scope?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
        ]
      }
      lsg_bodies: {
        Row: {
          district_code: string
          id: string
          lsg_type: Database["public"]["Enums"]["lsg_type"]
          name: string
          name_ml: string | null
          taluk_name: string | null
          verified_source: boolean
        }
        Insert: {
          district_code: string
          id?: string
          lsg_type: Database["public"]["Enums"]["lsg_type"]
          name: string
          name_ml?: string | null
          taluk_name?: string | null
          verified_source?: boolean
        }
        Update: {
          district_code?: string
          id?: string
          lsg_type?: Database["public"]["Enums"]["lsg_type"]
          name?: string
          name_ml?: string | null
          taluk_name?: string | null
          verified_source?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lsg_bodies_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
        ]
      }
      otp_challenges: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          delivery_failed: boolean
          expires_at: string
          id: string
          ip_hash: string | null
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          delivery_failed?: boolean
          expires_at: string
          id?: string
          ip_hash?: string | null
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          delivery_failed?: boolean
          expires_at?: string
          id?: string
          ip_hash?: string | null
          phone?: string
        }
        Relationships: []
      }
      report_images: {
        Row: {
          blur_score: number | null
          brightness_score: number | null
          camp_id: string | null
          created_at: string
          exif_captured_at: string | null
          exif_lat: number | null
          exif_lng: number | null
          file_size_bytes: number | null
          height: number | null
          hidden: boolean
          id: string
          quality_reasons: Json
          quality_status: Database["public"]["Enums"]["image_quality_status"]
          report_id: string
          sha256: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          blur_score?: number | null
          brightness_score?: number | null
          camp_id?: string | null
          created_at?: string
          exif_captured_at?: string | null
          exif_lat?: number | null
          exif_lng?: number | null
          file_size_bytes?: number | null
          height?: number | null
          hidden?: boolean
          id?: string
          quality_reasons?: Json
          quality_status?: Database["public"]["Enums"]["image_quality_status"]
          report_id: string
          sha256?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          blur_score?: number | null
          brightness_score?: number | null
          camp_id?: string | null
          created_at?: string
          exif_captured_at?: string | null
          exif_lat?: number | null
          exif_lng?: number | null
          file_size_bytes?: number | null
          height?: number | null
          hidden?: boolean
          id?: string
          quality_reasons?: Json
          quality_status?: Database["public"]["Enums"]["image_quality_status"]
          report_id?: string
          sha256?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_images_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          auto_flags: Json
          camp_id: string | null
          correction_note: string | null
          device_location_granted: boolean
          id: string
          ip_hash: string | null
          is_correction: boolean
          payload: Json
          phone_unverified: boolean
          phone_verified_at: string | null
          reference_code: string
          reported_status: Database["public"]["Enums"]["camp_status"]
          reported_urgency: Database["public"]["Enums"]["urgency_level"]
          reported_urgency_reason: string | null
          reporter_gender: Database["public"]["Enums"]["reporter_gender"] | null
          reporter_name: string
          reporter_phone_primary: string
          reporter_phone_secondary: string | null
          reporter_relationship:
            | Database["public"]["Enums"]["reporter_relationship"]
            | null
          submitted_at: string
          submitted_lat: number | null
          submitted_lng: number | null
        }
        Insert: {
          auto_flags?: Json
          camp_id?: string | null
          correction_note?: string | null
          device_location_granted?: boolean
          id?: string
          ip_hash?: string | null
          is_correction?: boolean
          payload?: Json
          phone_unverified?: boolean
          phone_verified_at?: string | null
          reference_code: string
          reported_status?: Database["public"]["Enums"]["camp_status"]
          reported_urgency?: Database["public"]["Enums"]["urgency_level"]
          reported_urgency_reason?: string | null
          reporter_gender?:
            | Database["public"]["Enums"]["reporter_gender"]
            | null
          reporter_name: string
          reporter_phone_primary: string
          reporter_phone_secondary?: string | null
          reporter_relationship?:
            | Database["public"]["Enums"]["reporter_relationship"]
            | null
          submitted_at?: string
          submitted_lat?: number | null
          submitted_lng?: number | null
        }
        Update: {
          auto_flags?: Json
          camp_id?: string | null
          correction_note?: string | null
          device_location_granted?: boolean
          id?: string
          ip_hash?: string | null
          is_correction?: boolean
          payload?: Json
          phone_unverified?: boolean
          phone_verified_at?: string | null
          reference_code?: string
          reported_status?: Database["public"]["Enums"]["camp_status"]
          reported_urgency?: Database["public"]["Enums"]["urgency_level"]
          reported_urgency_reason?: string | null
          reporter_gender?:
            | Database["public"]["Enums"]["reporter_gender"]
            | null
          reporter_name?: string
          reporter_phone_primary?: string
          reporter_phone_secondary?: string | null
          reporter_relationship?:
            | Database["public"]["Enums"]["reporter_relationship"]
            | null
          submitted_at?: string
          submitted_lat?: number | null
          submitted_lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          label: string
          reliability_note: string | null
          type: Database["public"]["Enums"]["source_type"]
          url_or_reference: string | null
        }
        Insert: {
          active?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          label: string
          reliability_note?: string | null
          type: Database["public"]["Enums"]["source_type"]
          url_or_reference?: string | null
        }
        Update: {
          active?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          label?: string
          reliability_note?: string | null
          type?: Database["public"]["Enums"]["source_type"]
          url_or_reference?: string | null
        }
        Relationships: []
      }
      taluks: {
        Row: {
          district_code: string
          id: string
          name: string
          name_ml: string | null
        }
        Insert: {
          district_code: string
          id?: string
          name: string
          name_ml?: string | null
        }
        Update: {
          district_code?: string
          id?: string
          name?: string
          name_ml?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taluks_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      building_type:
        | "school"
        | "college"
        | "community_hall"
        | "place_of_worship"
        | "government_building"
        | "other"
      camp_status: "active" | "inactive"
      image_quality_status: "pass" | "warn" | "fail"
      lsg_type: "panchayat" | "municipality" | "corporation"
      reporter_gender: "male" | "female" | "other" | "prefer_not_to_say"
      reporter_relationship:
        | "resident"
        | "volunteer"
        | "camp_staff"
        | "official"
        | "other"
      source_type:
        | "public_submission"
        | "official_pdf"
        | "ksdma_release"
        | "news_report"
        | "whatsapp_group"
        | "phone_tipoff"
        | "internal_volunteer"
      urgency_level: "normal" | "high" | "critical"
      verification_method:
        | "phone_call"
        | "official_document"
        | "site_visit"
        | "known_contact"
        | "cross_reference"
      verification_state:
        | "unverified"
        | "verified"
        | "duplicate_held"
        | "rejected"
        | "removed"
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
    Enums: {
      building_type: [
        "school",
        "college",
        "community_hall",
        "place_of_worship",
        "government_building",
        "other",
      ],
      camp_status: ["active", "inactive"],
      image_quality_status: ["pass", "warn", "fail"],
      lsg_type: ["panchayat", "municipality", "corporation"],
      reporter_gender: ["male", "female", "other", "prefer_not_to_say"],
      reporter_relationship: [
        "resident",
        "volunteer",
        "camp_staff",
        "official",
        "other",
      ],
      source_type: [
        "public_submission",
        "official_pdf",
        "ksdma_release",
        "news_report",
        "whatsapp_group",
        "phone_tipoff",
        "internal_volunteer",
      ],
      urgency_level: ["normal", "high", "critical"],
      verification_method: [
        "phone_call",
        "official_document",
        "site_visit",
        "known_contact",
        "cross_reference",
      ],
      verification_state: [
        "unverified",
        "verified",
        "duplicate_held",
        "rejected",
        "removed",
      ],
    },
  },
} as const
