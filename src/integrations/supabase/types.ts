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
      access_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          grant_days: number
          id: string
          is_active: boolean
          label: string
          owner_id: string | null
          seats_total: number | null
          seats_used: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          grant_days?: number
          id?: string
          is_active?: boolean
          label?: string
          owner_id?: string | null
          seats_total?: number | null
          seats_used?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          grant_days?: number
          id?: string
          is_active?: boolean
          label?: string
          owner_id?: string | null
          seats_total?: number | null
          seats_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      bet_journal: {
        Row: {
          bet_id: string
          class_id: string | null
          confidence: number | null
          created_at: string
          id: string
          outcome_reflection: string | null
          rationale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_id: string
          class_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          outcome_reflection?: string | null
          rationale: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_id?: string
          class_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          outcome_reflection?: string | null
          rationale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_journal_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: true
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_journal_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          bet_type: string
          class_id: string | null
          closing_odds: number | null
          id: string
          market_id: string
          market_title: string
          mode: string
          odds_decimal: number | null
          payout: number | null
          placed_at: string
          potential_payout: number | null
          raw: Json | null
          round_id: string | null
          selection: string
          settled_at: string | null
          stake: number
          status: string
          user_id: string
        }
        Insert: {
          bet_type?: string
          class_id?: string | null
          closing_odds?: number | null
          id: string
          market_id: string
          market_title?: string
          mode: string
          odds_decimal?: number | null
          payout?: number | null
          placed_at?: string
          potential_payout?: number | null
          raw?: Json | null
          round_id?: string | null
          selection?: string
          settled_at?: string | null
          stake: number
          status?: string
          user_id: string
        }
        Update: {
          bet_type?: string
          class_id?: string | null
          closing_odds?: number | null
          id?: string
          market_id?: string
          market_title?: string
          mode?: string
          odds_decimal?: number | null
          payout?: number | null
          placed_at?: string
          potential_payout?: number | null
          raw?: Json | null
          round_id?: string | null
          selection?: string
          settled_at?: string | null
          stake?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "class_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      class_invites: {
        Row: {
          accepted_at: string | null
          class_id: string
          created_at: string
          email: string
          id: string
          invited_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          class_id: string
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          class_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_invites_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_lesson_progress: {
        Row: {
          class_id: string
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          response?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_lesson_progress_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "class_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      class_lessons: {
        Row: {
          body_md: string
          class_id: string
          created_at: string
          created_by: string | null
          curriculum_key: string | null
          due_at: string | null
          estimated_minutes: number | null
          id: string
          is_published: boolean
          kind: string
          requires_ack: boolean
          sort_order: number
          source_rg_lesson_id: string | null
          title: string
          topic: string
          updated_at: string
          url: string | null
        }
        Insert: {
          body_md?: string
          class_id: string
          created_at?: string
          created_by?: string | null
          curriculum_key?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          kind?: string
          requires_ack?: boolean
          sort_order?: number
          source_rg_lesson_id?: string | null
          title: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          body_md?: string
          class_id?: string
          created_at?: string
          created_by?: string | null
          curriculum_key?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          kind?: string
          requires_ack?: boolean
          sort_order?: number
          source_rg_lesson_id?: string | null
          title?: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_lessons_source_rg_lesson_id_fkey"
            columns: ["source_rg_lesson_id"]
            isOneToOne: false
            referencedRelation: "rg_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          bankroll: number
          class_id: string
          id: string
          joined_at: string
          member_role: string
          user_id: string
        }
        Insert: {
          bankroll?: number
          class_id: string
          id?: string
          joined_at?: string
          member_role?: string
          user_id: string
        }
        Update: {
          bankroll?: number
          class_id?: string
          id?: string
          joined_at?: string
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_rounds: {
        Row: {
          class_id: string
          created_at: string
          description: string
          ends_at: string
          id: string
          is_active: boolean
          is_contest: boolean
          kind: string
          max_bets: number | null
          max_stake_per_bet: number | null
          name: string
          scoring: string
          starting_bankroll: number
          starts_at: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          is_contest?: boolean
          kind?: string
          max_bets?: number | null
          max_stake_per_bet?: number | null
          name: string
          scoring?: string
          starting_bankroll?: number
          starts_at?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          is_contest?: boolean
          kind?: string
          max_bets?: number | null
          max_stake_per_bet?: number | null
          name?: string
          scoring?: string
          starting_bankroll?: number
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_rounds_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          allow_self_join: boolean
          allowed_bet_kinds: string[] | null
          allowed_leagues: string[] | null
          allowed_sports: string[] | null
          created_at: string
          description: string
          id: string
          is_archived: boolean
          join_code: string
          market_publish_mode: string
          max_bets_per_day: number | null
          max_stake_per_bet: number | null
          name: string
          owner_id: string
          require_journal: boolean
          semester_end: string | null
          semester_start: string | null
          starting_bankroll: number
          term: string | null
          updated_at: string
        }
        Insert: {
          allow_self_join?: boolean
          allowed_bet_kinds?: string[] | null
          allowed_leagues?: string[] | null
          allowed_sports?: string[] | null
          created_at?: string
          description?: string
          id?: string
          is_archived?: boolean
          join_code?: string
          market_publish_mode?: string
          max_bets_per_day?: number | null
          max_stake_per_bet?: number | null
          name: string
          owner_id: string
          require_journal?: boolean
          semester_end?: string | null
          semester_start?: string | null
          starting_bankroll?: number
          term?: string | null
          updated_at?: string
        }
        Update: {
          allow_self_join?: boolean
          allowed_bet_kinds?: string[] | null
          allowed_leagues?: string[] | null
          allowed_sports?: string[] | null
          created_at?: string
          description?: string
          id?: string
          is_archived?: boolean
          join_code?: string
          market_publish_mode?: string
          max_bets_per_day?: number | null
          max_stake_per_bet?: number | null
          name?: string
          owner_id?: string
          require_journal?: boolean
          semester_end?: string | null
          semester_start?: string | null
          starting_bankroll?: number
          term?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          created_at: string
          granted_until: string | null
          id: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          granted_until?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          granted_until?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      odds_cache: {
        Row: {
          cache_key: string
          expires_at: string
          fetched_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          expires_at: string
          fetched_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          expires_at?: string
          fetched_at?: string
          payload?: Json
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      published_markets: {
        Row: {
          away_team: string
          bet_kinds: string[]
          class_id: string
          commence_at: string | null
          created_at: string
          external_event_id: string
          home_team: string
          id: string
          league_name: string
          league_slug: string
          note: string
          published_by: string | null
          round_id: string | null
          sport_name: string
          sport_slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          away_team?: string
          bet_kinds?: string[]
          class_id: string
          commence_at?: string | null
          created_at?: string
          external_event_id: string
          home_team?: string
          id?: string
          league_name?: string
          league_slug?: string
          note?: string
          published_by?: string | null
          round_id?: string | null
          sport_name?: string
          sport_slug?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          away_team?: string
          bet_kinds?: string[]
          class_id?: string
          commence_at?: string | null
          created_at?: string
          external_event_id?: string
          home_team?: string
          id?: string
          league_name?: string
          league_slug?: string
          note?: string
          published_by?: string | null
          round_id?: string | null
          sport_name?: string
          sport_slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_markets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_markets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "class_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rg_acknowledgments: {
        Row: {
          acknowledged_at: string
          class_id: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          class_id?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          class_id?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rg_acknowledgments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rg_acknowledgments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "rg_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      rg_lessons: {
        Row: {
          body_md: string
          created_at: string
          id: string
          is_published: boolean
          requires_ack: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string
          created_at?: string
          id?: string
          is_published?: boolean
          requires_ack?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          is_published?: boolean
          requires_ack?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      round_entries: {
        Row: {
          bankroll: number
          class_id: string
          created_at: string
          id: string
          round_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bankroll?: number
          class_id: string
          created_at?: string
          id?: string
          round_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bankroll?: number
          class_id?: string
          created_at?: string
          id?: string
          round_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_entries_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "class_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access: {
        Row: {
          amount_cents: number | null
          created_at: string
          expires_at: string | null
          last_payment_at: string | null
          source: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          expires_at?: string | null
          last_payment_at?: string | null
          source?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          expires_at?: string | null
          last_payment_at?: string | null
          source?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
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
      user_sessions: {
        Row: {
          active_seconds: number
          ended_at: string | null
          id: string
          last_seen_at: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          active_seconds?: number
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          active_seconds?: number
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      class_book_summary: {
        Args: { _class_id: string }
        Returns: {
          bet_count: number
          bettor_count: number
          book_pnl: number
          handle: number
          hold_pct: number
          open_liability: number
          open_stake: number
          paid_out: number
          settled_stake: number
        }[]
      }
      class_leaderboard: {
        Args: { _class_id: string }
        Returns: {
          bankroll: number
          bet_count: number
          display_name: string
          net_pnl: number
          open_liability: number
          open_stake: number
          returned: number
          roi_pct: number
          settled_count: number
          settled_stake: number
          staked: number
          starting_bankroll: number
          user_id: string
          wins: number
        }[]
      }
      generate_join_code: { Args: never; Returns: string }
      get_user_stats: {
        Args: never
        Returns: {
          display_name: string
          email: string
          joined_at: string
          last_seen_at: string
          role: Database["public"]["Enums"]["app_role"]
          total_actions: number
          total_seconds_on_site: number
          user_id: string
        }[]
      }
      grant_user_access: {
        Args: { _days?: number; _source?: string; _user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_member: { Args: { _class_id: string }; Returns: boolean }
      is_class_owner: { Args: { _class_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      join_class_by_code: { Args: { _code: string }; Returns: Json }
      platform_classes: {
        Args: never
        Returns: {
          bet_count: number
          class_id: string
          created_at: string
          is_archived: boolean
          join_code: string
          name: string
          owner_email: string
          owner_id: string
          owner_name: string
          student_count: number
          term: string
        }[]
      }
      platform_directory: {
        Args: never
        Returns: {
          bets_placed: number
          classes_joined: number
          classes_owned: number
          display_name: string
          email: string
          is_admin: boolean
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      redeem_access_code: { Args: { _code: string }; Returns: Json }
      set_user_access: {
        Args: {
          _platform_admin?: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      shares_class_with: { Args: { _user_id: string }; Returns: boolean }
      teaches_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "instructor" | "student"
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
      app_role: ["instructor", "student"],
    },
  },
} as const
