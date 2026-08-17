// CSV export builders for instructor grading reports.
import type { BetRow, BetJournalRow } from "@/features/db";
import type { RosterEntry } from "@/features/classes/useClasses";
import { computeStudentStats } from "@/features/journal/useJournal";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** One row per bet, with journal rationale attached — the grading export. */
export function buildBetsCsv(
  bets: BetRow[],
  journal: Map<string, BetJournalRow>,
  nameByUserId: Map<string, string>,
): string {
  return toCsv(
    [
      "student", "mode", "market", "selection", "bet_type", "stake",
      "odds_decimal", "status", "payout", "placed_at", "settled_at",
      "rationale", "confidence", "reflection",
    ],
    bets.map((b) => {
      const j = journal.get(b.id);
      return [
        nameByUserId.get(b.user_id) ?? b.user_id,
        b.mode, b.market_title, b.selection, b.bet_type, b.stake,
        b.odds_decimal, b.status, b.payout, b.placed_at, b.settled_at,
        j?.rationale ?? "", j?.confidence ?? "", j?.outcome_reflection ?? "",
      ];
    }),
  );
}

/** One row per student: activity, ROI, journal completion — the summary export. */
export function buildStudentSummaryCsv(
  roster: RosterEntry[],
  bets: BetRow[],
  journal: Map<string, BetJournalRow>,
): string {
  return toCsv(
    [
      "student", "email", "joined_at", "total_bets", "settled_bets", "wins",
      "total_staked", "total_returned", "roi_pct", "journal_completion_pct",
    ],
    roster.map((m) => {
      const own = bets.filter((b) => b.user_id === m.user_id);
      const stats = computeStudentStats(own, journal);
      return [
        m.profile?.display_name ?? m.profile?.email ?? m.user_id,
        m.profile?.email ?? "",
        m.joined_at,
        stats.totalBets, stats.settled, stats.wins,
        stats.totalStaked.toFixed(2), stats.totalReturned.toFixed(2),
        stats.roi === null ? "" : (stats.roi * 100).toFixed(1),
        (stats.journalCompletion * 100).toFixed(0),
      ];
    }),
  );
}
