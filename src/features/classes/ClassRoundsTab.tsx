import { ANALYSIS_MODES, AnalysisStandings, SCORING_LABELS } from "@/features/classes/AnalysisStandings";
// Instructor: betting windows (weekend / semester / custom rounds) and contests.
import { useState } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  buildStandings, isRoundOpen, useCreateRound, useDeleteRound, useRoundBets,
  useRoundEntries, useRounds, useUpdateRound,
} from "@/features/classes/usePublishing";
import { useRoster } from "@/features/classes/useClasses";
import type { ClassRoundRow, RoundKind, RoundScoring } from "@/features/db";

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ClassRoundsTab({ classId, startingBankroll }: { classId: string; startingBankroll: number }) {
  const { data: rounds = [] } = useRounds(classId);
  const create = useCreateRound(classId);
  const update = useUpdateRound(classId);
  const remove = useDeleteRound(classId);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoundKind>("weekend");
  const [starts, setStarts] = useState(toLocalInput(new Date().toISOString()));
  const [ends, setEnds] = useState(toLocalInput(new Date(Date.now() + 3 * 864e5).toISOString()));
  const [bankroll, setBankroll] = useState(startingBankroll);
  const [isContest, setIsContest] = useState(true);
  const [scoring, setScoring] = useState<RoundScoring>("brier");
  const [maxStake, setMaxStake] = useState("");
  const [maxBets, setMaxBets] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return toast.error("Give the window a name.");
    if (new Date(ends) <= new Date(starts)) return toast.error("End must be after start.");
    try {
      await create.mutateAsync({
        name: name.trim(),
        kind,
        starts_at: new Date(starts).toISOString(),
        ends_at: new Date(ends).toISOString(),
        starting_bankroll: Number(bankroll) || 0,
        is_contest: isContest,
        scoring,
        max_stake_per_bet: maxStake ? Number(maxStake) : null,
        max_bets: maxBets ? Number(maxBets) : null,
      });
      toast.success("Window created.");
      setName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create window");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New betting window / contest</CardTitle>
          <CardDescription>
            A window controls when students may wager. Mark it as a contest to score it on its own leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Week 3 Weekend Contest" />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as RoundKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekend">Weekend</SelectItem>
                <SelectItem value="round">Custom round</SelectItem>
                <SelectItem value="semester">Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Opens</Label>
            <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Closes</Label>
            <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Starting bankroll</Label>
            <Input type="number" value={bankroll} onChange={(e) => setBankroll(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Max stake / bet</Label>
            <Input type="number" value={maxStake} onChange={(e) => setMaxStake(e.target.value)} placeholder="No cap" />
          </div>
          <div>
            <Label className="text-xs">Max bets</Label>
            <Input type="number" value={maxBets} onChange={(e) => setMaxBets(e.target.value)} placeholder="No cap" />
          </div>
          <div>
            <Label className="text-xs">Scoring</Label>
            <Select value={scoring} onValueChange={(v) => setScoring(v as RoundScoring)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brier">{SCORING_LABELS.brier}</SelectItem>
                <SelectItem value="clv">{SCORING_LABELS.clv}</SelectItem>
                <SelectItem value="journal">{SCORING_LABELS.journal}</SelectItem>
                <SelectItem value="profit">{SCORING_LABELS.profit}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={isContest} onCheckedChange={setIsContest} />
            <Label className="text-xs">Scored contest</Label>
          </div>
          <div className="pt-6">
            <Button size="sm" onClick={submit} disabled={create.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> Create window
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Windows ({rounds.length})</CardTitle></CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No betting windows yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Bankroll</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.name}
                      {r.is_contest && <Trophy className="ml-1.5 inline h-3.5 w-3.5 text-warning" />}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{r.kind}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(r.starts_at).toLocaleString()} → {new Date(r.ends_at).toLocaleString()}
                    </TableCell>
                    <TableCell>${Number(r.starting_bankroll).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={isRoundOpen(r) ? "default" : "outline"}>
                        {!r.is_active ? "paused" : isRoundOpen(r) ? "open" : new Date(r.starts_at) > new Date() ? "scheduled" : "closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        {openId === r.id ? "Hide" : "Standings"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: r.id, is_active: !r.is_active })}>
                        {r.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {openId && <StandingsCard classId={classId} round={rounds.find((r) => r.id === openId)!} />}
    </div>
  );
}

function StandingsCard({ classId, round }: { classId: string; round: ClassRoundRow }) {
  const { data: entries = [] } = useRoundEntries(round.id);
  const { data: bets = [] } = useRoundBets(round.id);
  const { data: roster = [] } = useRoster(classId);
  const nameFor = (uid: string) => {
    const m = roster.find((r) => r.user_id === uid);
    return m?.profile?.display_name ?? m?.profile?.email ?? uid.slice(0, 8);
  };
  const standings = buildStandings(bets, entries, round.scoring);
  if (ANALYSIS_MODES.includes(round.scoring)) {
    return <AnalysisStandings classId={classId} round={round} nameFor={(uid, fb) => nameFor(uid) || fb} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{round.name} — standings</CardTitle>
        <CardDescription>Scored by {SCORING_LABELS[round.scoring] ?? round.scoring}. {entries.length} entrant(s).</CardDescription>
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries or bets yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Bets</TableHead>
                <TableHead>Staked</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s, i) => (
                <TableRow key={s.userId}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{nameFor(s.userId)}</TableCell>
                  <TableCell>{s.bets}</TableCell>
                  <TableCell>${s.staked.toFixed(2)}</TableCell>
                  <TableCell className={s.profit >= 0 ? "text-success" : "text-destructive"}>
                    ${s.profit.toFixed(2)}
                  </TableCell>
                  <TableCell>{(s.roi * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
