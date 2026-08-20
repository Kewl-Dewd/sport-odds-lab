import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Copy, Download, RefreshCw, Trash2, UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClass, useRegenerateJoinCode, useRemoveMember, useResetClassBets,
  useRoster, useUpdateClass, type RosterEntry,
} from "@/features/classes/useClasses";
import type { BetRow, BetJournalRow } from "@/features/db";
import { useClassBets, useClassJournal, computeStudentStats } from "@/features/journal/useJournal";
import { buildBetsCsv, buildStudentSummaryCsv, downloadCsv } from "@/features/exports";
import { ClassMarketsTab } from "@/features/classes/ClassMarketsTab";
import { ClassRoundsTab } from "@/features/classes/ClassRoundsTab";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: klass, isLoading } = useClass(id);
  const { data: roster = [] } = useRoster(id);
  const { data: bets = [] } = useClassBets(id);
  const { data: journal = new Map() } = useClassJournal(id);

  if (isLoading) {
    return <div className="container py-8 text-sm text-muted-foreground">Loading class…</div>;
  }
  if (!klass) {
    return (
      <div className="container py-8 space-y-2">
        <p className="text-sm text-muted-foreground">Class not found (or you don&apos;t own it).</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/instructor/classes"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to classes</Link>
        </Button>
      </div>
    );
  }

  const nameByUserId = new Map(
    roster.map((m) => [m.user_id, m.profile?.display_name ?? m.profile?.email ?? m.user_id]),
  );

  const exportBets = () => {
    downloadCsv(
      `${klass.name.replace(/\W+/g, "-")}-bets.csv`,
      buildBetsCsv(bets, journal, nameByUserId),
    );
  };
  const exportSummary = () => {
    downloadCsv(
      `${klass.name.replace(/\W+/g, "-")}-students.csv`,
      buildStudentSummaryCsv(roster, bets, journal),
    );
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/instructor/classes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {klass.name}
              {klass.is_archived && <Badge variant="outline">Archived</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {roster.length} student{roster.length === 1 ? "" : "s"} · {bets.length} recorded bet{bets.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportSummary}>
            <Download className="mr-1.5 h-4 w-4" /> Student summary CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportBets}>
            <Download className="mr-1.5 h-4 w-4" /> Bets + journal CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="rounds">Windows &amp; contests</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="journal">Journal review</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab klass={klass} />
        </TabsContent>

        <TabsContent value="markets" className="mt-4">
          <ClassMarketsTab klass={klass} />
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
          <ClassRoundsTab classId={klass.id} startingBankroll={Number(klass.starting_bankroll)} />
        </TabsContent>

        <TabsContent value="roster" className="mt-4">
          <RosterTab classId={klass.id} roster={roster} bets={bets} journal={journal} />
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <JournalTab bets={bets} journal={journal} nameByUserId={nameByUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────

type Klass = NonNullable<ReturnType<typeof useClass>["data"]>;

function SettingsTab({ klass }: { klass: Klass }) {
  const updateClass = useUpdateClass(klass.id);
  const regenCode = useRegenerateJoinCode(klass.id);
  const resetBets = useResetClassBets(klass.id);

  const [form, setForm] = useState({
    name: klass.name,
    term: klass.term ?? "",
    starting_bankroll: String(klass.starting_bankroll),
    max_stake_per_bet: klass.max_stake_per_bet ? String(klass.max_stake_per_bet) : "",
    max_bets_per_day: klass.max_bets_per_day ? String(klass.max_bets_per_day) : "",
    allowed_sports: (klass.allowed_sports ?? []).join(", "),
    semester_start: klass.semester_start ?? "",
    semester_end: klass.semester_end ?? "",
  });
  useEffect(() => {
    setForm({
      name: klass.name,
      term: klass.term ?? "",
      starting_bankroll: String(klass.starting_bankroll),
      max_stake_per_bet: klass.max_stake_per_bet ? String(klass.max_stake_per_bet) : "",
      max_bets_per_day: klass.max_bets_per_day ? String(klass.max_bets_per_day) : "",
      allowed_sports: (klass.allowed_sports ?? []).join(", "),
      semester_start: klass.semester_start ?? "",
      semester_end: klass.semester_end ?? "",
    });
  }, [klass]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    try {
      const sports = form.allowed_sports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateClass.mutateAsync({
        name: form.name.trim() || klass.name,
        term: form.term.trim() || null,
        starting_bankroll: Number(form.starting_bankroll) || klass.starting_bankroll,
        max_stake_per_bet: form.max_stake_per_bet ? Number(form.max_stake_per_bet) : null,
        max_bets_per_day: form.max_bets_per_day ? Number(form.max_bets_per_day) : null,
        allowed_sports: sports.length > 0 ? sports : null,
        semester_start: form.semester_start || null,
        semester_end: form.semester_end || null,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    }
  };

  const toggle = async (updates: Record<string, boolean>) => {
    try {
      await updateClass.mutateAsync(updates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class name">
              <Input value={form.name} onChange={set("name")} />
            </Field>
            <Field label="Term">
              <Input value={form.term} onChange={set("term")} placeholder="Fall 2026" />
            </Field>
            <Field label="Starting bankroll ($)">
              <Input type="number" min={1} value={form.starting_bankroll} onChange={set("starting_bankroll")} />
            </Field>
            <Field label="Max stake per bet ($, blank = none)">
              <Input type="number" min={1} value={form.max_stake_per_bet} onChange={set("max_stake_per_bet")} />
            </Field>
            <Field label="Max bets per day (blank = none)">
              <Input type="number" min={1} value={form.max_bets_per_day} onChange={set("max_bets_per_day")} />
            </Field>
            <Field label="Allowed sports (comma-sep, blank = all)">
              <Input value={form.allowed_sports} onChange={set("allowed_sports")} placeholder="basketball, hockey" />
            </Field>
            <Field label="Semester start">
              <Input type="date" value={form.semester_start} onChange={set("semester_start")} />
            </Field>
            <Field label="Semester end">
              <Input type="date" value={form.semester_end} onChange={set("semester_end")} />
            </Field>
          </div>
          <Button onClick={save} disabled={updateClass.isPending}>
            {updateClass.isPending ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite students</CardTitle>
            <CardDescription>
              Share the link (one click to join) or have students enter the code at /join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                {`${window.location.origin}/join/${klass.join_code}`}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${klass.join_code}`);
                  toast.success("Invite link copied");
                }}
                title="Copy invite link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-lg tracking-widest">
              {klass.join_code}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { navigator.clipboard.writeText(klass.join_code); toast.success("Copied"); }}
              title="Copy code"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => regenCode.mutate(undefined, {
                onSuccess: () => toast.success("New join code generated"),
                onError: (e) => toast.error(e.message),
              })}
              title="Regenerate code (old code and link stop working)"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              label="Allow self-join with code"
              checked={klass.allow_self_join}
              onChange={(v) => toggle({ allow_self_join: v })}
            />
            <ToggleRow
              label="Require journal rationale per bet"
              checked={klass.require_journal}
              onChange={(v) => toggle({ require_journal: v })}
            />
            <ToggleRow
              label="Archived (read-only, hidden from students)"
              checked={klass.is_archived}
              onChange={(v) => toggle({ is_archived: v })}
            />
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Reset deletes every recorded bet and journal entry for this class. Export first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Reset class data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all class bet data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes all persisted bets and journal entries for
                    &ldquo;{klass.name}&rdquo;. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => resetBets.mutate(undefined, {
                      onSuccess: () => toast.success("Class bet data reset"),
                      onError: (e) => toast.error(e.message),
                    })}
                  >
                    Yes, reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Roster ────────────────────────────────────────────────────────

function RosterTab({ classId, roster, bets, journal }: {
  classId: string;
  roster: RosterEntry[];
  bets: BetRow[];
  journal: Map<string, BetJournalRow>;
}) {
  const removeMember = useRemoveMember(classId);

  if (roster.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No students yet — share the join code and they&apos;ll appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Bets</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead className="text-right">Journal</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map((m) => {
              const own = bets.filter((b) => b.user_id === m.user_id);
              const stats = computeStudentStats(own, journal);
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.profile?.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.profile?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">{stats.totalBets}</TableCell>
                  <TableCell className="text-right">
                    {stats.roi === null ? "—" : `${(stats.roi * 100).toFixed(1)}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(stats.journalCompletion * 100)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove from class"
                      onClick={() => removeMember.mutate(m.id, {
                        onSuccess: () => toast.success("Student removed"),
                        onError: (e) => toast.error(e.message),
                      })}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Journal review ────────────────────────────────────────────────

function JournalTab({ bets, journal, nameByUserId }: {
  bets: BetRow[];
  journal: Map<string, BetJournalRow>;
  nameByUserId: Map<string, string>;
}) {
  if (bets.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No bets recorded for this class yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {bets.map((bet) => {
        const entry = journal.get(bet.id);
        return (
          <Card key={bet.id}>
            <CardContent className="space-y-1.5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{nameByUserId.get(bet.user_id) ?? bet.user_id}</span>
                <span className="text-muted-foreground">·</span>
                <span>{bet.market_title || bet.market_id}</span>
                <Badge variant="outline" className="capitalize">{bet.mode}</Badge>
                <Badge variant={bet.status === "won" ? "default" : bet.status === "lost" ? "destructive" : "secondary"}>
                  {bet.status}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  ${bet.stake.toFixed(2)}{bet.odds_decimal ? ` @ ${bet.odds_decimal.toFixed(2)}` : ""}
                  {" · "}{new Date(bet.placed_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{bet.selection}</p>
              {entry ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="italic">&ldquo;{entry.rationale}&rdquo;</p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    {entry.confidence && <span>Confidence: {entry.confidence}/5</span>}
                    {entry.outcome_reflection && <span>Reflection: {entry.outcome_reflection}</span>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">No journal entry.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
