// Hooks for instructor market publishing, betting windows (rounds) and contests.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  db,
  unwrap,
  type BetRow,
  type ClassRoundRow,
  type PublishedMarketRow,
  type RoundEntryRow,
} from "@/features/db";

// ── Rounds ────────────────────────────────────────────────────────

export function useRounds(classId: string | undefined) {
  return useQuery({
    queryKey: ["rounds", classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap<ClassRoundRow[]>(
        await db
          .from("class_rounds")
          .select("*")
          .eq("class_id", classId!)
          .order("starts_at", { ascending: true }),
      ),
  });
}

export function useCreateRound(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ClassRoundRow>) =>
      unwrap<ClassRoundRow>(
        await db
          .from("class_rounds")
          .insert({ ...input, class_id: classId })
          .select("*")
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rounds", classId] }),
  });
}

export function useUpdateRound(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClassRoundRow> & { id: string }) =>
      unwrap<ClassRoundRow>(
        await db.from("class_rounds").update(updates).eq("id", id).select("*").single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rounds", classId] }),
  });
}

export function useDeleteRound(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("class_rounds").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rounds", classId] }),
  });
}

/** True when `now` sits inside the round window and the round is active. */
export function isRoundOpen(round: ClassRoundRow, now = new Date()): boolean {
  if (!round.is_active) return false;
  return new Date(round.starts_at) <= now && now < new Date(round.ends_at);
}

// ── Published markets ─────────────────────────────────────────────

export function usePublishedMarkets(classId: string | undefined, onlyPublished = false) {
  return useQuery({
    queryKey: ["published-markets", classId, onlyPublished],
    enabled: !!classId,
    queryFn: async () => {
      let q = db
        .from("published_markets")
        .select("*")
        .eq("class_id", classId!)
        .order("commence_at", { ascending: true });
      if (onlyPublished) q = q.eq("status", "published");
      return unwrap<PublishedMarketRow[]>(await q);
    },
  });
}

export function usePublishMarkets(classId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Partial<PublishedMarketRow>[]) => {
      const payload = rows.map((r) => ({
        ...r,
        class_id: classId,
        published_by: user?.id ?? null,
      }));
      const { error } = await db
        .from("published_markets")
        .upsert(payload, { onConflict: "class_id,external_event_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["published-markets"] }),
  });
}

export function useUpdatePublishedMarket(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PublishedMarketRow> & { id: string }) => {
      const { error } = await db.from("published_markets").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["published-markets"] }),
  });
}

export function useUnpublishMarket(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("published_markets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["published-markets"] }),
  });
}

// ── Round entries + contest scoring ───────────────────────────────

export function useRoundEntries(roundId: string | undefined) {
  return useQuery({
    queryKey: ["round-entries", roundId],
    enabled: !!roundId,
    queryFn: async () =>
      unwrap<RoundEntryRow[]>(
        await db.from("round_entries").select("*").eq("round_id", roundId!),
      ),
  });
}

export function useEnterRound(classId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (round: ClassRoundRow) =>
      unwrap<RoundEntryRow>(
        await db
          .from("round_entries")
          .upsert(
            {
              round_id: round.id,
              class_id: classId,
              user_id: user!.id,
              bankroll: round.starting_bankroll,
            },
            { onConflict: "round_id,user_id", ignoreDuplicates: true },
          )
          .select("*")
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["round-entries"] }),
  });
}

export function useRoundBets(roundId: string | undefined) {
  return useQuery({
    queryKey: ["bets", "round", roundId],
    enabled: !!roundId,
    queryFn: async () =>
      unwrap<BetRow[]>(
        await db.from("bets").select("*").eq("round_id", roundId!),
      ),
  });
}

export interface ContestStanding {
  userId: string;
  bets: number;
  staked: number;
  returned: number;
  profit: number;
  roi: number;
  wins: number;
  score: number;
}

export function buildStandings(
  bets: BetRow[],
  entries: RoundEntryRow[],
  scoring: "profit" | "roi" | "wins",
): ContestStanding[] {
  const byUser = new Map<string, ContestStanding>();
  const blank = (userId: string): ContestStanding => ({
    userId, bets: 0, staked: 0, returned: 0, profit: 0, roi: 0, wins: 0, score: 0,
  });
  for (const e of entries) byUser.set(e.user_id, blank(e.user_id));
  for (const b of bets) {
    const row = byUser.get(b.user_id) ?? blank(b.user_id);
    const isOpen = b.status === "open" || b.status === "executed";
    row.bets += 1;
    row.staked += Number(b.stake) || 0;
    if (!isOpen) {
      row.returned += Number(b.payout) || 0;
      if (b.status === "won") row.wins += 1;
    }
    byUser.set(b.user_id, row);
  }
  const rows = [...byUser.values()].map((r) => {
    const settledStake = r.staked;
    r.profit = r.returned - settledStake;
    r.roi = settledStake > 0 ? r.profit / settledStake : 0;
    r.score = scoring === "roi" ? r.roi : scoring === "wins" ? r.wins : r.profit;
    return r;
  });
  return rows.sort((a, b) => b.score - a.score);
}

// ── The class book (house P&L) ────────────────────────────────────

export interface BookSummary {
  handle: number;
  open_stake: number;
  open_liability: number;
  settled_stake: number;
  paid_out: number;
  book_pnl: number;
  hold_pct: number;
  bet_count: number;
  bettor_count: number;
}

/** House-side economics for a class: what the book took in, paid out and kept. */
export function useBookSummary(classId: string | undefined) {
  return useQuery({
    queryKey: ["book-summary", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await db.rpc("class_book_summary", { _class_id: classId! });
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
      const num = (v: unknown) => Number(v ?? 0);
      return {
        handle: num(row?.handle),
        open_stake: num(row?.open_stake),
        open_liability: num(row?.open_liability),
        settled_stake: num(row?.settled_stake),
        paid_out: num(row?.paid_out),
        book_pnl: num(row?.book_pnl),
        hold_pct: num(row?.hold_pct),
        bet_count: num(row?.bet_count),
        bettor_count: num(row?.bettor_count),
      } satisfies BookSummary;
    },
  });
}
