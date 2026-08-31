import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { BetRow, BetJournalRow } from "@/features/db";
import { computeStudentStats } from "@/features/journal/useJournal";
import type { RosterEntry } from "@/features/classes/useClasses";
import { useClassLessons, useClassCourseworkProgress } from "@/features/coursework/useCoursework";

interface Props {
  classId: string;
  roster: RosterEntry[];
  bets: BetRow[];
  journal: Map<string, BetJournalRow>;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function ClassProgressTab({ classId, roster, bets, journal }: Props) {
  const { data: lessons = [] } = useClassLessons(classId, { publishedOnly: true });
  const { data: progress = [] } = useClassCourseworkProgress(classId);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const betsByUser = new Map<string, BetRow[]>();
    for (const b of bets) {
      const list = betsByUser.get(b.user_id) ?? [];
      list.push(b);
      betsByUser.set(b.user_id, list);
    }
    const doneByUser = new Map<string, Set<string>>();
    for (const p of progress) {
      const set = doneByUser.get(p.user_id) ?? new Set<string>();
      set.add(p.lesson_id);
      doneByUser.set(p.user_id, set);
    }
    return roster.map((m) => {
      const myBets = betsByUser.get(m.user_id) ?? [];
      const stats = computeStudentStats(myBets, journal);
      const done = doneByUser.get(m.user_id) ?? new Set<string>();
      const lessonsDone = lessons.filter((l) => done.has(l.id)).length;
      return {
        userId: m.user_id,
        name: m.profile?.display_name ?? m.profile?.email ?? m.user_id.slice(0, 8),
        email: m.profile?.email ?? "",
        bankroll: Number(m.bankroll),
        lessonsDone,
        lessonPct: lessons.length > 0 ? lessonsDone / lessons.length : null,
        done,
        stats,
        lastBetAt: myBets.reduce<string | null>(
          (acc, b) => (!acc || b.placed_at > acc ? b.placed_at : acc),
          null,
        ),
      };
    });
  }, [roster, bets, journal, lessons, progress]);

  const filtered = rows.filter(
    (r) =>
      !q.trim() ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.email.toLowerCase().includes(q.toLowerCase()),
  );

  const classLessonPct =
    lessons.length > 0 && rows.length > 0
      ? rows.reduce((s, r) => s + (r.lessonPct ?? 0), 0) / rows.length
      : null;
  const noBets = rows.filter((r) => r.stats.totalBets === 0).length;
  const noLessons = rows.filter((r) => r.lessonsDone === 0).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average coursework completion</CardDescription>
            <CardTitle className="text-2xl">
              {classLessonPct === null ? "—" : `${Math.round(classLessonPct * 100)}%`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {lessons.length} published lesson{lessons.length === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Students with no bets yet</CardDescription>
            <CardTitle className="text-2xl">{noBets}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">of {rows.length} enrolled</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Students with no coursework done</CardDescription>
            <CardTitle className="text-2xl">{noLessons}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">of {rows.length} enrolled</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Student progress</CardTitle>
            <CardDescription>Learning completion and betting activity side by side.</CardDescription>
          </div>
          <Input
            placeholder="Search students…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-[220px]"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No students match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Coursework</TableHead>
                  <TableHead className="text-right">Bets</TableHead>
                  <TableHead className="text-right">Settled</TableHead>
                  <TableHead className="text-right">Win rate</TableHead>
                  <TableHead className="text-right">Staked</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Journal</TableHead>
                  <TableHead className="text-right">Bankroll</TableHead>
                  <TableHead className="text-right">Last bet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      {lessons.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No lessons assigned</span>
                      ) : (
                        <div className="space-y-1">
                          <Progress value={(r.lessonPct ?? 0) * 100} className="h-1.5" />
                          <span className="text-xs text-muted-foreground">
                            {r.lessonsDone}/{lessons.length} complete
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.stats.totalBets}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.stats.settled}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.stats.settled > 0
                        ? `${Math.round((r.stats.wins / r.stats.settled) * 100)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.stats.totalStaked)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.stats.roi === null ? (
                        "—"
                      ) : (
                        <span className={r.stats.roi >= 0 ? "text-emerald-600" : "text-destructive"}>
                          {(r.stats.roi * 100).toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(r.stats.journalCompletion * 100)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.bankroll)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.lastBetAt ? new Date(r.lastBetAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {lessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completion by lesson</CardTitle>
            <CardDescription>Who has finished each assigned item.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead>Not yet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((l) => {
                  const doneRows = rows.filter((r) => r.done.has(l.id));
                  const pending = rows.filter((r) => !r.done.has(l.id));
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.title}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {doneRows.length}/{rows.length}
                      </TableCell>
                      <TableCell>
                        {pending.length === 0 ? (
                          <Badge variant="outline">Everyone done</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {pending.slice(0, 8).map((p) => (
                              <Badge key={p.userId} variant="secondary" className="font-normal">
                                {p.name}
                              </Badge>
                            ))}
                            {pending.length > 8 && (
                              <Badge variant="outline">+{pending.length - 8} more</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
