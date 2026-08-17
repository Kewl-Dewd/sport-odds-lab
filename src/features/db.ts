// Data access for tables added by the course-in-a-box layer.
//
// The generated Database type in src/integrations/supabase/types.ts is
// Lovable-managed and doesn't know about these tables, so we re-cast the
// shared client (same auth session, same connection) to an untyped one
// and keep row shapes honest with the interfaces below.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const db = supabase as unknown as SupabaseClient;

// ── Row shapes (mirror supabase/migrations) ───────────────────────

export interface ClassRow {
  id: string;
  owner_id: string;
  name: string;
  term: string | null;
  description: string;
  join_code: string;
  allow_self_join: boolean;
  starting_bankroll: number;
  max_stake_per_bet: number | null;
  max_bets_per_day: number | null;
  allowed_sports: string[] | null;
  allowed_bet_kinds: string[] | null;
  require_journal: boolean;
  semester_start: string | null;
  semester_end: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassMemberRow {
  id: string;
  class_id: string;
  user_id: string;
  member_role: "student" | "ta";
  bankroll: number;
  joined_at: string;
}

export type BetMode = "prediction" | "sportsbook" | "racetrack";
export type BetStatus = "open" | "won" | "lost" | "push" | "void" | "executed";

export interface BetRow {
  id: string;
  class_id: string | null;
  user_id: string;
  mode: BetMode;
  market_id: string;
  market_title: string;
  selection: string;
  bet_type: string;
  stake: number;
  odds_decimal: number | null;
  potential_payout: number | null;
  status: BetStatus;
  payout: number | null;
  closing_odds: number | null;
  placed_at: string;
  settled_at: string | null;
  raw: unknown;
}

export interface BetJournalRow {
  id: string;
  bet_id: string;
  class_id: string | null;
  user_id: string;
  rationale: string;
  confidence: number | null;
  outcome_reflection: string | null;
  created_at: string;
  updated_at: string;
}

export interface RgLessonRow {
  id: string;
  slug: string;
  title: string;
  body_md: string;
  sort_order: number;
  requires_ack: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface RgAckRow {
  id: string;
  lesson_id: string;
  user_id: string;
  class_id: string | null;
  acknowledged_at: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface JoinClassResult {
  ok: boolean;
  error?: string;
  class_id?: string;
  class_name?: string;
}

/** Throw a readable error when a PostgREST call fails. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Empty response");
  return result.data;
}
