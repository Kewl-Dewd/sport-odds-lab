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
  allowed_leagues: string[] | null;
  market_publish_mode: string;
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

// ── Instructor market publishing, rounds & contests ───────────────

export type RoundKind = "semester" | "weekend" | "round";
export type RoundScoring = "profit" | "roi" | "wins";

export interface ClassRoundRow {
  id: string;
  class_id: string;
  name: string;
  kind: RoundKind;
  description: string;
  starts_at: string;
  ends_at: string;
  starting_bankroll: number;
  is_contest: boolean;
  scoring: RoundScoring;
  max_stake_per_bet: number | null;
  max_bets: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoundEntryRow {
  id: string;
  round_id: string;
  class_id: string;
  user_id: string;
  bankroll: number;
  created_at: string;
  updated_at: string;
}

export interface PublishedMarketRow {
  id: string;
  class_id: string;
  round_id: string | null;
  external_event_id: string;
  sport_slug: string;
  sport_name: string;
  league_slug: string;
  league_name: string;
  title: string;
  home_team: string;
  away_team: string;
  commence_at: string | null;
  bet_kinds: string[];
  status: "published" | "hidden";
  note: string;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Course-in-a-box: coursework, progress, invites ────────────────

export type CourseworkKind = "lesson" | "link" | "rg" | "assignment";

export interface ClassLessonRow {
  id: string;
  class_id: string;
  kind: CourseworkKind;
  title: string;
  body_md: string;
  url: string | null;
  source_rg_lesson_id: string | null;
  requires_ack: boolean;
  due_at: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassLessonProgressRow {
  id: string;
  lesson_id: string;
  class_id: string;
  user_id: string;
  completed_at: string;
  response: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassInviteRow {
  id: string;
  class_id: string;
  email: string;
  invited_by: string | null;
  status: "sent" | "accepted" | "revoked";
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
