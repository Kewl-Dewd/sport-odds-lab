// Contest standings for analysis scoring modes: forecast accuracy (Brier),
// closing line value, and journal completion.
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { ClassRoundRow, RoundScoring } from "@/features/db";

export const ANALYSIS_MODES: RoundScoring[] = ["brier", "clv", "journal"];

export const SCORING_LABELS: Record<RoundScoring, string> = {
  brier: "Forecast accuracy (Brier score, lower is better)",
  clv: "Closing line value (average CLV)",
  journal: "Journal completion",
  profit: "Profit (for demonstration of variance)",
  roi: "ROI (for demonstration of variance)",
  wins: "Winning bets (for demonstration of variance)",
};

export interface AnalysisRow {
  user_id: string;
  display_name: string;
  positions: number;
  forecasts: number;
  brier: number | null;
  avg_clv_pct: number | null;
  clv_count: number;
  journal_pct: number | null;
}

export function useAnalysisLeaderboard(classId: string | undefined, roundId?: string | null) {
  return useQuery({
    queryKey: ["analysis-leaderboard", classId, roundId ?? null],
    enabled: !!classId,
    queryFn: async (): Promise<AnalysisRow[]> => {
      const { data, error } = await supabase.rpc("class_analysis_leaderboard", {
        _class_id: classId!,
        _round_id: roundId ?? undefined,
      });
      if (error) throw new Error(error.message);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        user_id: String(r.user_id),
        display_name: String(r.display_name ?? "Student"),
        positions: Number(r.positions ?? 0),
        forecasts: Number(r.forecasts ?? 0),
        brier: r.brier == null ? null : Number(r.brier),
        avg_clv_pct: r.avg_clv_pct == null ? null : Number(r.avg_clv_pct),
        clv_count: Number(r.clv_count ?? 0),
        journal_pct: r.journal_pct == null ? null : Number(r.journal_pct),
      }));
    },
  });
}

/** Rank rows for a mode; students with no scoreable data sort last. */
export function rankAnalysis(rows: AnalysisRow[], mode: RoundScoring): AnalysisRow[] {
  const key = (r: AnalysisRow) =>
    mode === "brier" ? r.brier : mode === "clv" ? r.avg_clv_pct : r.journal_pct;
  return [...rows].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (ka == null && kb == null) return 0;
    if (ka == null) return 1;
    if (kb == null) return -1;
    return mode === "brier" ? ka - kb : kb - ka;
  });
}

export function AnalysisStandings({
  classId, round, nameFor,
}: {
  classId: string;
  round: ClassRoundRow;
  nameFor: (userId: string, fallback: string) => string;
}) {
  const { data = [], isLoading } = useAnalysisLeaderboard(classId, round.id);
  const rows = rankAnalysis(data, round.scoring);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" /> {round.name} standings
        </CardTitle>
        <CardDescription>Scored by {SCORING_LABELS[round.scoring]}.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No positions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Brier</TableHead>
                  <TableHead>Avg CLV</TableHead>
                  <TableHead>Journaled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.user_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{nameFor(r.user_id, r.display_name)}</TableCell>
                    <TableCell>{r.positions}</TableCell>
                    <TableCell className="font-mono">
                      {r.brier == null ? "—" : r.brier.toFixed(3)}
                      {r.forecasts > 0 && <span className="text-muted-foreground text-xs"> ({r.forecasts})</span>}
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.avg_clv_pct == null ? "—" : `${r.avg_clv_pct >= 0 ? "+" : ""}${r.avg_clv_pct.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="font-mono">{r.journal_pct == null ? "—" : `${r.journal_pct.toFixed(0)}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Brier score measures how close forecasts were to results (0 is perfect, 0.25 is a coin-flip guess).
          CLV compares the price you locked to the fair closing price.
        </p>
      </CardContent>
    </Card>
  );
}
