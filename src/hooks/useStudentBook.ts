// The single source of truth for a student's money.
//
// Every student-facing money view (Dashboard, My Bets, Leaderboard) reads
// from the durable `bets` table and the class's configured starting
// bankroll — the same records the Bet Journal and the instructor's Book
// Dashboard use — so the numbers can never disagree.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useActiveClass } from "@/context/ClassContext";
import { db, unwrap, type BetRow } from "@/features/db";

/** A bet is only settled once a real result has been recorded. */
export const OPEN_STATUSES = new Set(["open", "executed"]);
export const isOpenBet = (status: string) => OPEN_STATUSES.has(status);

export interface StudentBook {
  startingBankroll: number;
  bankroll: number;
  staked: number;
  atRisk: number;
  toWin: number;
  returned: number;
  netPnl: number;
  roiPct: number;
  openBets: BetRow[];
  settledBets: BetRow[];
  bets: BetRow[];
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  isLoading: boolean;
  classId: string | null;
  enrolled: boolean;
}

export function useStudentBook(): StudentBook {
  const { user } = useAuth();
  const { activeEnrollment, isLoading: classLoading } = useActiveClass();
  const classId = activeEnrollment?.klass.id ?? null;
  const startingBankroll = activeEnrollment?.klass.starting_bankroll ?? 0;

  const query = useQuery({
    queryKey: ["student-book", user?.id, classId],
    enabled: !!user,
    queryFn: async (): Promise<BetRow[]> => {
      let q = db
        .from("bets")
        .select("*")
        .eq("user_id", user!.id)
        .order("placed_at", { ascending: false });
      if (classId) q = q.eq("class_id", classId);
      return unwrap<BetRow[]>(await q);
    },
  });

  return useMemo(() => {
    const bets = query.data ?? [];
    const openBets = bets.filter((b) => isOpenBet(b.status));
    const settledBets = bets.filter((b) => !isOpenBet(b.status));

    const staked = bets.reduce((s, b) => s + Number(b.stake ?? 0), 0);
    const atRisk = openBets.reduce((s, b) => s + Number(b.stake ?? 0), 0);
    const toWin = openBets.reduce(
      (s, b) => s + Math.max(0, Number(b.potential_payout ?? b.stake ?? 0) - Number(b.stake ?? 0)),
      0,
    );
    const returned = settledBets.reduce((s, b) => s + Number(b.payout ?? 0), 0);
    const bankroll = startingBankroll - staked + returned;
    // P&L only counts graded bets — money still riding on an open bet is
    // neither a win nor a loss yet.
    const settledStake = settledBets.reduce((s, b) => s + Number(b.stake ?? 0), 0);
    const netPnl = returned - settledStake;
    const wins = settledBets.filter((b) => b.status === "won").length;
    const losses = settledBets.filter((b) => b.status === "lost").length;
    const pushes = settledBets.filter((b) => b.status === "push" || b.status === "void").length;

    return {
      startingBankroll,
      bankroll,
      staked,
      atRisk,
      toWin,
      returned,
      netPnl,
      roiPct: startingBankroll > 0 ? (netPnl / startingBankroll) * 100 : 0,
      openBets,
      settledBets,
      bets,
      wins,
      losses,
      pushes,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      isLoading: query.isLoading || classLoading,
      classId,
      enrolled: !!classId,
    };
  }, [query.data, query.isLoading, classLoading, startingBankroll, classId]);
}

export interface StandingRow {
  user_id: string;
  display_name: string;
  starting_bankroll: number;
  bet_count: number;
  staked: number;
  open_stake: number;
  open_liability: number;
  settled_stake: number;
  returned: number;
  wins: number;
  settled_count: number;
  bankroll: number;
  net_pnl: number;
  roi_pct: number;
}

/** Class standings, computed server-side from the same bet records. */
export function useClassStandings(classIdOverride?: string | null) {
  const { activeEnrollment } = useActiveClass();
  const classId = classIdOverride ?? activeEnrollment?.klass.id ?? null;

  return useQuery({
    queryKey: ["class-standings", classId],
    enabled: !!classId,
    queryFn: async (): Promise<StandingRow[]> => {
      const { data, error } = await db.rpc("class_leaderboard", { _class_id: classId });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as StandingRow[];
      return [...rows].sort((a, b) => Number(b.bankroll) - Number(a.bankroll));
    },
  });
}
