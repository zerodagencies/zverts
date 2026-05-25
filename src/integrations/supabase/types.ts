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
      achievements: {
        Row: {
          code: string
          id: string
          metadata: Json | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          course_id: string
          course_title: string
          id: string
          issued_at: string
          issued_to_name: string
          user_id: string
        }
        Insert: {
          certificate_code: string
          course_id: string
          course_title: string
          id?: string
          issued_at?: string
          issued_to_name: string
          user_id: string
        }
        Update: {
          certificate_code?: string
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string
          issued_to_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          author_channel_id: string | null
          author_channel_url: string | null
          author_name: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          is_system: boolean
          source_playlist_id: string | null
          source_playlist_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_channel_id?: string | null
          author_channel_url?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_system?: boolean
          source_playlist_id?: string | null
          source_playlist_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_channel_id?: string | null
          author_channel_url?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_system?: boolean
          source_playlist_id?: string | null
          source_playlist_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          created_at: string
          date: string
          id: string
          module_id: string | null
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          module_id?: string | null
          passed?: boolean
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          module_id?: string | null
          passed?: boolean
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          status: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          status: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          status?: string
        }
        Relationships: []
      }
      mcq_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          module_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          module_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          module_id: string
          options: Json
          position: number
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          module_id: string
          options: Json
          position: number
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          mcq_passed: boolean
          module_id: string
          percent_watched: number
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mcq_passed?: boolean
          module_id: string
          percent_watched?: number
          updated_at?: string
          user_id: string
          watch_time_seconds?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mcq_passed?: boolean
          module_id?: string
          percent_watched?: number
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          duration_seconds: number
          id: string
          position: number
          thumbnail_url: string | null
          title: string
          youtube_video_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_seconds?: number
          id?: string
          position: number
          thumbnail_url?: string | null
          title: string
          youtube_video_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          position?: number
          thumbnail_url?: string | null
          title?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          module_id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          module_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          module_id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          certificate_name: string | null
          created_at: string
          current_streak: number
          daily_goal_minutes: number
          email: string | null
          id: string
          last_active: string
          last_attendance_date: string | null
          longest_streak: number
          name: string | null
          notify_completion: boolean
          notify_email: boolean
          notify_inactivity: boolean
          preferred_language: string
          profile_public: boolean
          study_reminders_enabled: boolean
          total_gems: number
          total_xp: number
        }
        Insert: {
          avatar_url?: string | null
          certificate_name?: string | null
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email?: string | null
          id: string
          last_active?: string
          last_attendance_date?: string | null
          longest_streak?: number
          name?: string | null
          notify_completion?: boolean
          notify_email?: boolean
          notify_inactivity?: boolean
          preferred_language?: string
          profile_public?: boolean
          study_reminders_enabled?: boolean
          total_gems?: number
          total_xp?: number
        }
        Update: {
          avatar_url?: string | null
          certificate_name?: string | null
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email?: string | null
          id?: string
          last_active?: string
          last_attendance_date?: string | null
          longest_streak?: number
          name?: string | null
          notify_completion?: boolean
          notify_email?: boolean
          notify_inactivity?: boolean
          preferred_language?: string
          profile_public?: boolean
          study_reminders_enabled?: boolean
          total_gems?: number
          total_xp?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_achievement: {
        Args: { _code: string; _gems?: number; _user_id: string; _xp?: number }
        Returns: boolean
      }
      award_progress: {
        Args: { _gems: number; _user_id: string; _xp: number }
        Returns: undefined
      }
      check_achievements: { Args: never; Returns: Json }
      get_mcq_questions: {
        Args: { _limit?: number; _module_ids: string[] }
        Returns: {
          module_id: string
          options: Json
          q_id: string
          q_position: number
          question: string
        }[]
      }
      grade_and_submit_daily_challenge: {
        Args: { _answers: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_module_unlocked: {
        Args: { _module_id: string; _user_id: string }
        Returns: boolean
      }
      is_profile_public: { Args: { _uid: string }; Returns: boolean }
      issue_certificate: {
        Args: { _course_id: string }
        Returns: {
          certificate_code: string
          course_id: string
          course_title: string
          id: string
          issued_at: string
          issued_to_name: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_public_profiles: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          certificate_name: string
          created_at: string
          current_streak: number
          id: string
          last_active: string
          longest_streak: number
          name: string
          profile_public: boolean
          total_gems: number
          total_xp: number
        }[]
      }
      mark_attendance: { Args: never; Returns: Json }
      reset_my_progress: { Args: never; Returns: undefined }
      submit_daily_challenge: {
        Args: { _module_id: string; _score: number; _total: number }
        Returns: Json
      }
      submit_mcq: {
        Args: { _answers: Json; _module_id: string }
        Returns: Json
      }
      update_module_progress: {
        Args: {
          _force_complete?: boolean
          _module_id: string
          _watch_time: number
        }
        Returns: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          mcq_passed: boolean
          module_id: string
          percent_watched: number
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        SetofOptions: {
          from: "*"
          to: "module_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          certificate_code: string
          course_title: string
          issued_at: string
          issued_to_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
