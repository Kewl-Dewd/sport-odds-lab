import { useMemo, useState } from "react";
import { NotebookPen, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveMembership } from "@/features/classes/useClasses";
import {
  computeStudentStats, useMyBets, useMyJournal, useUpsertJournalEntry,
} from "@/features/journal/useJournal";
import { HouseMoneyBanner } from "@/features/HouseMoneyBanner";
import type { BetRow } from "@/features/db";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  won: "default", lost: "destructive", open: "secondary",
  push: "outline", void: "outline", executed: "secondary",
};

const SETTLED = new Set(["won", "lost", "push", "void"]);

export default function JournalPage() {
  const { data: bets = [], isLoading } = useMyBets();
  const { data: journal = new Map() } = useMyJournal();
  const { data: membership } = useActiveMembership();
  const upsert = useUpsertJournalEntry();

  const [editing, setEditing] = useState<BetRow | null>(null);
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState<string>("");
  const [reflection, setReflection] = useState("");

  const stats = useMemo(() => computeStudentStats(bets, journal), [bets, journal]);
  const missing = bets.filter((b) => !journal.has(b.id)).length;
  const requireJournal = membership?.klass.require_journal ?? true;

  const openEditor = (bet: BetRow) => {
    const entry = journal.get(bet.id);
    setRationale(entry?.rationale ?? "");
    setConfidence(entry?.confidence ? String(entry.confidence) : "");
    setReflection(entry?.outcome_reflection ?? "");
    setEditing(bet);
  };

  const save = async () => {
    if (!editing || rationale.trim().length === 0) return;
    try {
      await upsert.mutateAsync({
        bet_id: editing.id,
        class_id: editing.class_id,
        rationale: rationale.trim(),
        confidence: confidence ? Number(confidence) : null,
        outcome_reflection: reflection.trim() || null,
      });
      toast.success("Journal entry saved");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save entry");
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <NotebookPen className="h-6 w-6 text-primary" /> Bet Journal
          </h1>
          <p className="text-sm text-muted-foreground">
            Log the reasoning behind every bet — this is the gradeable part of the lab.
          </p>
        </div>
        {requireJournal && missing > 0 && (
          <Badge variant="destructive">{missing} bet{missing === 1 ? "" : "s"} missing a rationale</Badge>
        )}
      </div>

      <HouseMoneyBanner />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Bets logged" value={String(stats.totalBets)} />
        <StatCard label="Journal completion" value={`${Math.round(stats.journalCompletion * 100)}%`} />
        <StatCard label="Record (settled)" value={`${stats.wins}–${stats.settled - stats.wins}`} />
        <StatCard
          label="ROI"
          value={stats.roi === null ? "—" : `${(stats.roi * 100).toFixed(1)}%`}
          accent={stats.roi === null ? undefined : stats.roi >= 0}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your bets…</p>
      ) : bets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No bets recorded yet. Place a bet in Markets and it will appear here for journaling.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {bets.map((bet) => {
            const entry = journal.get(bet.id);
            return (
              <Card key={bet.id}>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">{bet.market_title || bet.market_id}</span>
                      <Badge variant={STATUS_VARIANT[bet.status] ?? "secondary"}>{bet.status}</Badge>
                      <Badge variant="outline" className="capitalize">{bet.mode}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {bet.selection} · ${bet.stake.toFixed(2)}
                      {bet.odds_decimal ? ` @ ${bet.odds_decimal.toFixed(2)}` : ""}
                      {" · "}{new Date(bet.placed_at).toLocaleString()}
                    </p>
                    {entry ? (
                      <p className="mt-1 text-sm italic text-muted-foreground line-clamp-2">
                        &ldquo;{entry.rationale}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-destructive">No rationale logged yet.</p>
                    )}
                  </div>
                  <Button
                    variant={entry ? "outline" : "default"}
                    size="sm"
                    onClick={() => openEditor(bet)}
                  >
                    {entry ? "Edit entry" : "Add rationale"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Journal entry</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.market_title || editing.market_id} — ${editing.selection}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rationale">Why did you place this bet?</Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="The edge you saw, the data you used, what would change your mind…"
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confidence at placement</Label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger><SelectValue placeholder="1 (coin flip) – 5 (near certain)" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing && SETTLED.has(editing.status) && (
              <div className="space-y-1.5">
                <Label htmlFor="reflection">Post-settlement reflection (optional)</Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Was the process sound regardless of the result?"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending || rationale.trim().length === 0}>
              {upsert.isPending ? "Saving…" : "Save entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center gap-1.5 text-xl">
          {value}
          {accent === true && <TrendingUp className="h-4 w-4 text-primary" />}
          {accent === false && <TrendingDown className="h-4 w-4 text-destructive" />}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
