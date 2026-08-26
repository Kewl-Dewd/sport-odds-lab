// Instructor "run the book" dashboard: every bet the class placed, what the
// house paid out, and what the book kept. Designed to be projected in class.
import { useMemo, useState } from "react";
import { Download, Landmark, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { BetRow } from "@/features/db";
import { BookSummaryCard } from "@/features/classes/BookSummaryCard";
import { downloadCsv } from "@/features/exports";

const SETTLED = new Set(["won", "lost", "push", "void"]);

const money = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** What the house made on a single bet. Open bets have no result yet. */
function bookPnl(bet: BetRow): number | null {
  if (!SETTLED.has(bet.status)) return null;
  return bet.stake - (bet.payout ?? 0);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "won") return "destructive"; // a student win is a book loss
  if (status === "lost") return "default";
  if (status === "open") return "secondary";
  return "outline";
}

interface Props {
  classId: string;
  className: string;
  bets: BetRow[];
  nameByUserId: Map<string, string>;
}

export function ClassBookLedger({ classId, className, bets, nameByUserId }: Props) {
  const [status, setStatus] = useState<string>("all");
  const [student, setStudent] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bets.filter((b) => {
      if (status === "settled" ? !SETTLED.has(b.status) : status !== "all" && b.status !== status) {
        return false;
      }
      if (student !== "all" && b.user_id !== student) return false;
      if (q && !`${b.market_title} ${b.selection} ${nameByUserId.get(b.user_id) ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [bets, status, student, search, nameByUserId]);

  const totals = useMemo(() => {
    let staked = 0, paid = 0, houseNet = 0, open = 0, liability = 0;
    for (const b of filtered) {
      staked += b.stake;
      if (SETTLED.has(b.status)) {
        paid += b.payout ?? 0;
        houseNet += b.stake - (b.payout ?? 0);
      } else {
        open += b.stake;
        liability += Math.max((b.potential_payout ?? b.stake) - b.stake, 0);
      }
    }
    return { staked, paid, houseNet, open, liability };
  }, [filtered]);

  const byStudent = useMemo(() => {
    const map = new Map<string, { name: string; bets: number; staked: number; returned: number; houseNet: number }>();
    for (const b of bets) {
      const key = b.user_id;
      const row = map.get(key) ?? {
        name: nameByUserId.get(key) ?? "Unknown student",
        bets: 0, staked: 0, returned: 0, houseNet: 0,
      };
      row.bets += 1;
      row.staked += b.stake;
      if (SETTLED.has(b.status)) {
        row.returned += b.payout ?? 0;
        row.houseNet += b.stake - (b.payout ?? 0);
      }
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.houseNet - a.houseNet);
  }, [bets, nameByUserId]);

  const byMarket = useMemo(() => {
    const map = new Map<string, { title: string; bets: number; staked: number; houseNet: number; openLiability: number }>();
    for (const b of bets) {
      const row = map.get(b.market_id) ?? {
        title: b.market_title, bets: 0, staked: 0, houseNet: 0, openLiability: 0,
      };
      row.bets += 1;
      row.staked += b.stake;
      if (SETTLED.has(b.status)) row.houseNet += b.stake - (b.payout ?? 0);
      else row.openLiability += Math.max((b.potential_payout ?? b.stake) - b.stake, 0);
      map.set(b.market_id, row);
    }
    return [...map.values()].sort((a, b) => b.staked - a.staked).slice(0, 12);
  }, [bets]);

  const students = useMemo(
    () => [...new Set(bets.map((b) => b.user_id))]
      .map((id) => ({ id, name: nameByUserId.get(id) ?? id.slice(0, 8) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [bets, nameByUserId],
  );

  const exportLedger = () => {
    const rows = [
      ["Placed", "Student", "Market", "Selection", "Type", "Stake", "Odds", "Status", "Payout", "Book P&L"],
      ...filtered.map((b) => [
        new Date(b.placed_at).toISOString(),
        nameByUserId.get(b.user_id) ?? b.user_id,
        b.market_title,
        b.selection,
        b.bet_type,
        b.stake.toFixed(2),
        b.odds_decimal?.toFixed(3) ?? "",
        b.status,
        b.payout?.toFixed(2) ?? "",
        bookPnl(b)?.toFixed(2) ?? "",
      ]),
    ];
    downloadCsv(
      `${className.replace(/\W+/g, "-")}-book-ledger.csv`,
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"),
    );
  };

  return (
    <div className="space-y-6">
      <BookSummaryCard classId={classId} audience="instructor" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Who the book is beating
          </CardTitle>
          <CardDescription>
            Book P&amp;L per student on settled bets — positive means the house is up on that bettor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byStudent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No bets recorded yet. Once students place bets they show up here instantly.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Bets</TableHead>
                  <TableHead className="text-right">Wagered</TableHead>
                  <TableHead className="text-right">Paid out</TableHead>
                  <TableHead className="text-right">Book P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStudent.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.bets}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(s.staked)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(s.returned)}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-semibold ${
                        s.houseNet >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {money(s.houseNet)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" /> Exposure by game
          </CardTitle>
          <CardDescription>Where the class action is concentrated, and what the book still owes if those bets win.</CardDescription>
        </CardHeader>
        <CardContent>
          {byMarket.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No action on the board yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead className="text-right">Bets</TableHead>
                  <TableHead className="text-right">Handle</TableHead>
                  <TableHead className="text-right">Open liability</TableHead>
                  <TableHead className="text-right">Book P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byMarket.map((m) => (
                  <TableRow key={m.title}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.bets}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(m.staked)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(m.openLiability)}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-semibold ${
                        m.houseNet >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {money(m.houseNet)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Bet ledger</CardTitle>
              <CardDescription>Every bet placed in this class, with the payout and what the book kept.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportLedger}>
              <Download className="mr-1.5 h-4 w-4" /> Export ledger CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search game, selection or student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
            <Select value={student} onValueChange={setStudent}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Handle (filtered)", value: money(totals.staked) },
              { label: "Paid out", value: money(totals.paid) },
              { label: "Open action", value: `${money(totals.open)} · ${money(totals.liability)} liability` },
              { label: "Book P&L", value: money(totals.houseNet), accent: true },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    s.accent ? (totals.houseNet >= 0 ? "text-success" : "text-destructive") : ""
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No bets match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placed</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Selection</TableHead>
                    <TableHead className="text-right">Stake</TableHead>
                    <TableHead className="text-right">Odds</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="text-right">Book P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 300).map((b) => {
                    const pnl = bookPnl(b);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(b.placed_at).toLocaleString([], {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{nameByUserId.get(b.user_id) ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{b.market_title}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {b.selection}
                          <span className="ml-1 text-xs text-muted-foreground">{b.bet_type}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{money(b.stake)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.odds_decimal ? b.odds_decimal.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.payout === null || b.payout === undefined ? "—" : money(b.payout)}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-medium ${
                            pnl === null ? "text-muted-foreground" : pnl >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {pnl === null ? "open" : money(pnl)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length > 300 && (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Showing the 300 most recent of {filtered.length} bets — export the CSV for the full ledger.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
