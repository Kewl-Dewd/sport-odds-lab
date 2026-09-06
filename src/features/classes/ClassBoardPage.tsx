// Student: the markets their instructor published, the open betting window,
// and the contest standings for that window.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useActiveMembership } from "@/features/classes/useClasses";
import {
  buildStandings, isRoundOpen, useEnterRound, usePublishedMarkets, useRoundBets,
  useRoundEntries, useRounds,
} from "@/features/classes/usePublishing";
import { BookSummaryCard } from "@/features/classes/BookSummaryCard";
import { db, type ClassRoundRow, type PublishedMarketRow } from "@/features/db";
import { extractMoneyline, fetchOdds } from "@/lib/oddsApi";
import { useQueryClient } from "@tanstack/react-query";

export default function ClassBoardPage() {
  const { user } = useAuth();
  const { data: membership, isLoading } = useActiveMembership();
  const classId = membership?.klass.id;
  const { data: rounds = [] } = useRounds(classId);
  const { data: markets = [] } = usePublishedMarkets(classId, true);

  const openRounds = rounds.filter((r) => isRoundOpen(r));
  const [roundId, setRoundId] = useState<string>("");
  const activeRound = rounds.find((r) => r.id === roundId) ?? openRounds[0] ?? null;

  useEffect(() => {
    if (!roundId && openRounds[0]) setRoundId(openRounds[0].id);
  }, [openRounds, roundId]);

  const enter = useEnterRound(classId ?? "");
  const { data: entries = [] } = useRoundEntries(activeRound?.id);
  const myEntry = entries.find((e) => e.user_id === user?.id);

  const visible = useMemo(
    () => markets.filter((m) => !activeRound || !m.round_id || m.round_id === activeRound.id),
    [markets, activeRound],
  );

  if (isLoading) return <div className="container py-8 text-sm text-muted-foreground">Loading…</div>;

  if (!membership) {
    return (
      <div className="container py-8 space-y-3">
        <h1 className="text-2xl font-bold">Class board</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re not in a class yet. Join with your instructor&apos;s code to see published markets.
        </p>
        <Button asChild size="sm"><Link to="/join">Join a class</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{membership.klass.name} — class board</h1>
        <p className="text-sm text-muted-foreground">
          Only markets your instructor published are wagerable here.
        </p>
      </div>

      <BookSummaryCard classId={membership.klass.id} audience="student" />

      {/* Window selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Betting window
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          {rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No windows set — bets are open whenever a market is published.
            </p>
          ) : (
            <>
              <div>
                <Label className="text-xs">Window</Label>
                <Select value={activeRound?.id ?? ""} onValueChange={setRoundId}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Pick a window" /></SelectTrigger>
                  <SelectContent>
                    {rounds.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} {isRoundOpen(r) ? "(open)" : "(closed)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeRound && (
                <div className="text-xs text-muted-foreground">
                  {new Date(activeRound.starts_at).toLocaleString()} →{" "}
                  {new Date(activeRound.ends_at).toLocaleString()}
                  {activeRound.is_contest && (
                    <Badge className="ml-2"><Trophy className="mr-1 h-3 w-3" />Contest</Badge>
                  )}
                </div>
              )}
              {activeRound && !myEntry && isRoundOpen(activeRound) && (
                <Button size="sm" onClick={() => enter.mutate(activeRound)}>
                  Enter this window (${Number(activeRound.starting_bankroll).toLocaleString()})
                </Button>
              )}
              {myEntry && (
                <Badge variant="outline">
                  Round bankroll: ${Number(myEntry.bankroll).toFixed(2)}
                </Badge>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Published markets */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">
            Your instructor hasn&apos;t featured any specific games here yet. If the class board is
            open, you can still bet every game in the leagues your instructor allows on the{" "}
            <Link to="/markets" className="text-primary underline">Markets</Link> page.
          </CardContent></Card>
        ) : (
          visible.map((m) => (
            <PublishedMarketCard
              key={m.id}
              market={m}
              round={activeRound}
              classId={membership.klass.id}
              canBet={!activeRound || (isRoundOpen(activeRound) && !!myEntry)}
              bankroll={myEntry?.bankroll ?? null}
              entryId={myEntry?.id ?? null}
            />
          ))
        )}
      </div>

      {activeRound?.is_contest && <ContestStandings round={activeRound} />}
    </div>
  );
}

function PublishedMarketCard({
  market, round, classId, canBet, bankroll, entryId,
}: {
  market: PublishedMarketRow;
  round: ClassRoundRow | null;
  classId: string;
  canBet: boolean;
  bankroll: number | null;
  entryId: string | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [lines, setLines] = useState<{ outcome: string; decimal: number; implied: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [stake, setStake] = useState("25");
  const [placing, setPlacing] = useState(false);

  const loadOdds = async () => {
    setLoading(true);
    try {
      const odds = await fetchOdds(market.external_event_id);
      setLines(extractMoneyline(odds));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load odds");
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async () => {
    if (!pick || !lines) return;
    const line = lines.find((l) => l.outcome === pick);
    if (!line) return;
    const amount = Number(stake);
    if (!amount || amount <= 0) return toast.error("Enter a stake.");
    if (round?.max_stake_per_bet && amount > Number(round.max_stake_per_bet)) {
      return toast.error(`Max stake for this window is $${round.max_stake_per_bet}.`);
    }
    if (bankroll !== null && amount > bankroll) return toast.error("Stake exceeds your round bankroll.");

    setPlacing(true);
    try {
      const { error } = await db.from("bets").insert({
        id: crypto.randomUUID(),
        class_id: classId,
        round_id: round?.id ?? null,
        user_id: user!.id,
        mode: "sportsbook",
        market_id: market.external_event_id,
        market_title: market.title,
        selection: pick,
        bet_type: "moneyline",
        stake: amount,
        odds_decimal: line.decimal,
        potential_payout: amount * line.decimal,
        status: "open",
        raw: { source: "class-board", published_market_id: market.id },
      });
      if (error) throw new Error(error.message);
      if (entryId && bankroll !== null) {
        await db.from("round_entries").update({ bankroll: bankroll - amount }).eq("id", entryId);
      }
      toast.success(`Bet placed: ${pick} for $${amount.toFixed(2)}`);
      setPick(null);
      qc.invalidateQueries({ queryKey: ["bets"] });
      qc.invalidateQueries({ queryKey: ["round-entries"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place bet");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{market.title}</CardTitle>
            <CardDescription>
              {market.league_name || market.sport_name}
              {market.commence_at && ` · ${new Date(market.commence_at).toLocaleString()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {market.bet_kinds.map((k) => (
              <Badge key={k} variant="outline" className="capitalize">{k}</Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!lines ? (
          <Button size="sm" variant="outline" onClick={loadOdds} disabled={loading}>
            {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Show odds
          </Button>
        ) : lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No moneyline odds available right now.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lines.map((l) => (
              <Button
                key={l.outcome}
                size="sm"
                variant={pick === l.outcome ? "default" : "outline"}
                onClick={() => setPick(l.outcome)}
                disabled={!canBet}
              >
                {l.outcome} · {l.decimal.toFixed(2)} ({(l.implied * 100).toFixed(0)}%)
              </Button>
            ))}
          </div>
        )}

        {!canBet && (
          <p className="text-xs text-muted-foreground">
            {round ? "This window is closed or you haven't entered it yet." : "Betting unavailable."}
          </p>
        )}

        {pick && canBet && (
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">Stake</Label>
              <Input className="w-28" type="number" value={stake} onChange={(e) => setStake(e.target.value)} />
            </div>
            <Button size="sm" onClick={placeBet} disabled={placing}>
              Place bet on {pick}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContestStandings({ round }: { round: ClassRoundRow }) {
  const { data: entries = [] } = useRoundEntries(round.id);
  const { data: bets = [] } = useRoundBets(round.id);
  const { user } = useAuth();
  const standings = buildStandings(bets, entries, round.scoring);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" /> {round.name} standings
        </CardTitle>
        <CardDescription>Scored by {round.scoring}.</CardDescription>
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Bets</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s, i) => (
                <TableRow key={s.userId}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.userId === user?.id ? "You" : `Student ${s.userId.slice(0, 6)}`}</TableCell>
                  <TableCell>{s.bets}</TableCell>
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
