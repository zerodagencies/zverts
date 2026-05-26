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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_user: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user?: string | null
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
      notification_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          ai_suggestions: boolean
          comeback: boolean
          gamification: boolean
          max_per_day: number
          mute_all: boolean
          quiet_hours_end: number
          quiet_hours_start: number
          study_reminders: boolean
          system_alerts: boolean
          timezone_offset_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_suggestions?: boolean
          comeback?: boolean
          gamification?: boolean
          max_per_day?: number
          mute_all?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          study_reminders?: boolean
          system_alerts?: boolean
          timezone_offset_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_suggestions?: boolean
          comeback?: boolean
          gamification?: boolean
          max_per_day?: number
          mute_all?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          study_reminders?: boolean
          system_alerts?: boolean
          timezone_offset_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          dedupe_key: string | null
          deep_link: string | null
          dismissed_at: string | null
          id: string
          payload: Json
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          scheduled_for: string | null
          sent_at: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          dismissed_at?: string | null
          id?: string
          payload?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          deep_link?: string | null
          dismissed_at?: string | null
          id?: string
          payload?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          credits: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          package_type: Database["public"]["Enums"]["package_type"]
          refund_note: string | null
          refund_reason: string | null
          refund_requested_at: string | null
          refunded: boolean
          refunded_at: string | null
          refunded_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          sender_number: string
          status: Database["public"]["Enums"]["payment_status"]
          trx_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credits: number
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          package_type: Database["public"]["Enums"]["package_type"]
          refund_note?: string | null
          refund_reason?: string | null
          refund_requested_at?: string | null
          refunded?: boolean
          refunded_at?: string | null
          refunded_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          sender_number: string
          status?: Database["public"]["Enums"]["payment_status"]
          trx_id: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credits?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          package_type?: Database["public"]["Enums"]["package_type"]
          refund_note?: string | null
          refund_reason?: string | null
          refund_requested_at?: string | null
          refunded?: boolean
          refunded_at?: string | null
          refunded_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          sender_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          trx_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_enabled: boolean
          avatar_url: string | null
          certificate_name: string | null
          convert_credits: number
          created_at: string
          current_streak: number
          daily_goal_minutes: number
          email: string | null
          free_playlist_used: number
          id: string
          is_paid_user: boolean
          last_active: string
          last_attendance_date: string | null
          locked: boolean
          longest_streak: number
          name: string | null
          notify_completion: boolean
          notify_email: boolean
          notify_inactivity: boolean
          preferred_language: string
          profile_public: boolean
          study_reminders_enabled: boolean
          total_gems: number
          total_paid: number
          total_xp: number
        }
        Insert: {
          ai_enabled?: boolean
          avatar_url?: string | null
          certificate_name?: string | null
          convert_credits?: number
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email?: string | null
          free_playlist_used?: number
          id: string
          is_paid_user?: boolean
          last_active?: string
          last_attendance_date?: string | null
          locked?: boolean
          longest_streak?: number
          name?: string | null
          notify_completion?: boolean
          notify_email?: boolean
          notify_inactivity?: boolean
          preferred_language?: string
          profile_public?: boolean
          study_reminders_enabled?: boolean
          total_gems?: number
          total_paid?: number
          total_xp?: number
        }
        Update: {
          ai_enabled?: boolean
          avatar_url?: string | null
          certificate_name?: string | null
          convert_credits?: number
          created_at?: string
          current_streak?: number
          daily_goal_minutes?: number
          email?: string | null
          free_playlist_used?: number
          id?: string
          is_paid_user?: boolean
          last_active?: string
          last_attendance_date?: string | null
          locked?: boolean
          longest_streak?: number
          name?: string | null
          notify_completion?: boolean
          notify_email?: boolean
          notify_inactivity?: boolean
          preferred_language?: string
          profile_public?: boolean
          study_reminders_enabled?: boolean
          total_gems?: number
          total_paid?: number
          total_xp?: number
        }
        Relationships: []
      }
      user_behavior: {
        Row: {
          avg_session_minutes: number | null
          favorite_subject: string | null
          last_lesson_at: string | null
          last_quiz_at: string | null
          most_active_hour: number | null
          pattern: string | null
          streak_risk: boolean | null
          total_study_minutes: number | null
          updated_at: string
          user_id: string
          weak_topic: string | null
        }
        Insert: {
          avg_session_minutes?: number | null
          favorite_subject?: string | null
          last_lesson_at?: string | null
          last_quiz_at?: string | null
          most_active_hour?: number | null
          pattern?: string | null
          streak_risk?: boolean | null
          total_study_minutes?: number | null
          updated_at?: string
          user_id: string
          weak_topic?: string | null
        }
        Update: {
          avg_session_minutes?: number | null
          favorite_subject?: string | null
          last_lesson_at?: string | null
          last_quiz_at?: string | null
          most_active_hour?: number | null
          pattern?: string | null
          streak_risk?: boolean | null
          total_study_minutes?: number | null
          updated_at?: string
          user_id?: string
          weak_topic?: string | null
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
      admin_adjust_credits: {
        Args: { _delta: number; _reason: string; _target: string }
        Returns: undefined
      }
      admin_broadcast_notification: {
        Args: {
          _body: string
          _deep_link?: string
          _priority?: string
          _title: string
        }
        Returns: Json
      }
      admin_list_users: {
        Args: { _limit?: number; _search?: string }
        Returns: {
          ai_enabled: boolean
          convert_credits: number
          created_at: string
          email: string
          free_playlist_used: number
          id: string
          is_paid_user: boolean
          last_active: string
          locked: boolean
          name: string
          total_paid: number
        }[]
      }
      admin_set_locked: {
        Args: { _locked: boolean; _reason?: string; _target: string }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          _email: string
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      approve_payment: { Args: { _payment_id: string }; Returns: Json }
      award_achievement: {
        Args: { _code: string; _gems?: number; _user_id: string; _xp?: number }
        Returns: boolean
      }
      award_progress: {
        Args: { _gems: number; _user_id: string; _xp: number }
        Returns: undefined
      }
      check_achievements: { Args: never; Returns: Json }
      consume_conversion: { Args: never; Returns: Json }
      dismiss_notification: { Args: { _id: string }; Returns: undefined }
      dispatch_notification: {
        Args: {
          _body: string
          _category: Database["public"]["Enums"]["notification_category"]
          _cooldown_hours?: number
          _dedupe_key?: string
          _deep_link?: string
          _payload?: Json
          _priority?: Database["public"]["Enums"]["notification_priority"]
          _title: string
          _user_id: string
        }
        Returns: string
      }
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
      list_admin_users: {
        Args: never
        Returns: {
          email: string
          name: string
          roles: string[]
          user_id: string
        }[]
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
      log_notification_event: {
        Args: { _id: string; _type: string }
        Returns: undefined
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_attendance: { Args: never; Returns: Json }
      mark_notification_read: { Args: { _id: string }; Returns: undefined }
      process_refund: {
        Args: { _approve: boolean; _note?: string; _payment_id: string }
        Returns: Json
      }
      reject_payment: {
        Args: { _note?: string; _payment_id: string }
        Returns: Json
      }
      request_refund: {
        Args: { _payment_id: string; _reason: string }
        Returns: Json
      }
      reset_my_progress: { Args: never; Returns: undefined }
      submit_daily_challenge: {
        Args: { _module_id: string; _score: number; _total: number }
        Returns: Json
      }
      submit_mcq: {
        Args: { _answers: Json; _module_id: string }
        Returns: Json
      }
      submit_payment: {
        Args: {
          _method: Database["public"]["Enums"]["payment_method"]
          _package: Database["public"]["Enums"]["package_type"]
          _sender_number: string
          _trx_id: string
        }
        Returns: string
      }
      unread_notification_count: { Args: never; Returns: number }
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
      app_role: "admin" | "student" | "super_admin"
      notification_category:
        | "lesson_completed"
        | "module_unlocked"
        | "course_completed"
        | "playlist_ready"
        | "xp_gain"
        | "level_up"
        | "streak_milestone"
        | "streak_risk"
        | "badge_unlocked"
        | "ai_summary"
        | "ai_quiz"
        | "ai_recommendation"
        | "weak_topic"
        | "system_success"
        | "system_failure"
        | "payment"
        | "subscription"
        | "comeback_1d"
        | "comeback_3d"
        | "comeback_7d"
        | "comeback_14d"
        | "morning_push"
        | "afternoon_push"
        | "evening_push"
        | "night_push"
        | "unfinished_lesson"
        | "quiz_reminder"
      notification_priority: "critical" | "high" | "normal" | "low"
      package_type: "single" | "mini" | "pro"
      payment_method: "bkash" | "nagad" | "rocket"
      payment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "refund_pending"
        | "refunded"
        | "refund_rejected"
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
      app_role: ["admin", "student", "super_admin"],
      notification_category: [
        "lesson_completed",
        "module_unlocked",
        "course_completed",
        "playlist_ready",
        "xp_gain",
        "level_up",
        "streak_milestone",
        "streak_risk",
        "badge_unlocked",
        "ai_summary",
        "ai_quiz",
        "ai_recommendation",
        "weak_topic",
        "system_success",
        "system_failure",
        "payment",
        "subscription",
        "comeback_1d",
        "comeback_3d",
        "comeback_7d",
        "comeback_14d",
        "morning_push",
        "afternoon_push",
        "evening_push",
        "night_push",
        "unfinished_lesson",
        "quiz_reminder",
      ],
      notification_priority: ["critical", "high", "normal", "low"],
      package_type: ["single", "mini", "pro"],
      payment_method: ["bkash", "nagad", "rocket"],
      payment_status: [
        "pending",
        "approved",
        "rejected",
        "refund_pending",
        "refunded",
        "refund_rejected",
      ],
    },
  },
} as const
