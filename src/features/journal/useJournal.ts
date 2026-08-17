// Hooks for persisted bets and the gradeable bet journal.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  db,
  unwrap,
  type BetRow,
  type BetJournalRow,
} from "@/features/db";

/** The current user's persisted bets, newest first. */
export function useMyBets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bets", "mine", user?.id],
    enabled: !!user,
    queryFn: async () =>
      unwrap<BetRow[]>(
        await db
          .from("bets")
          .select("*")
          .eq("user_id", user!.id)
          .order("placed_at", { ascending: false }),
      ),
  });
}

/** The current user's journal entries keyed by bet id. */
export function useMyJournal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const rows = unwrap<BetJournalRow[]>(
        await db.from("bet_journal").select("*").eq("user_id", user!.id),
      );
      return new Map(rows.map((r) => [r.bet_id, r]));
    },
  });
}

export function useUpsertJournalEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bet_id: string;
      class_id: string | null;
      rationale: string;
      confidence: number | null;
      outcome_reflection?: string | null;
    }) =>
      unwrap<BetJournalRow>(
        await db
          .from("bet_journal")
          .upsert({ ...input, user_id: user!.id }, { onConflict: "bet_id" })
          .select("*")
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });
}

// ── Instructor: class-wide views for grading ──────────────────────

export function useClassBets(classId: string | undefined) {
  return useQuery({
    queryKey: ["bets", "class", classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap<BetRow[]>(
        await db
          .from("bets")
          .select("*")
          .eq("class_id", classId!)
          .order("placed_at", { ascending: false }),
      ),
  });
}

export function useClassJournal(classId: string | undefined) {
  return useQuery({
    queryKey: ["journal", "class", classId],
    enabled: !!classId,
    queryFn: async () => {
      const rows = unwrap<BetJournalRow[]>(
        await db.from("bet_journal").select("*").eq("class_id", classId!),
      );
      return new Map(rows.map((r) => [r.bet_id, r]));
    },
  });
}

// ── Per-student summary stats (ROI etc.) ──────────────────────────

export interface StudentBetStats {
  totalBets: number;
  settled: number;
  wins: number;
  totalStaked: number;
  totalReturned: number;
  /** (returned - staked) / staked over settled bets; null if none settled. */
  roi: number | null;
  journalCompletion: number; // 0..1
}

export function computeStudentStats(
  bets: BetRow[],
  journal: Map<string, BetJournalRow>,
): StudentBetStats {
  const settledStatuses = new Set(["won", "lost", "push", "void"]);
  const settledBets = bets.filter((b) => settledStatuses.has(b.status));
  const totalStaked = settledBets.reduce((s, b) => s + b.stake, 0);
  const totalReturned = settledBets.reduce((s, b) => s + (b.payout ?? 0), 0);
  return {
    totalBets: bets.length,
    settled: settledBets.length,
    wins: settledBets.filter((b) => b.status === "won").length,
    totalStaked,
    totalReturned,
    roi: totalStaked > 0 ? (totalReturned - totalStaked) / totalStaked : null,
    journalCompletion:
      bets.length > 0
        ? bets.filter((b) => journal.has(b.id)).length / bets.length
        : 1,
  };
}
