// Instructor: choose which odds-api markets are published to a class.
import { useEffect, useMemo, useState } from "react";
import { Loader2, Radio, Search, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchEvents, fetchSports, type OddsApiEvent, type OddsApiSport } from "@/lib/oddsApi";
import { useUpdateClass } from "@/features/classes/useClasses";
import {
  usePublishedMarkets, usePublishMarkets, useRounds, useUnpublishMarket,
  useUpdatePublishedMarket,
} from "@/features/classes/usePublishing";
import type { ClassRow } from "@/features/db";

const BET_KINDS = ["moneyline", "spread", "total"];

export function ClassMarketsTab({ klass }: { klass: ClassRow }) {
  const classId = klass.id;
  const updateClass = useUpdateClass(classId);
  const { data: rounds = [] } = useRounds(classId);
  const { data: published = [] } = usePublishedMarkets(classId);
  const publish = usePublishMarkets(classId);
  const updatePublished = useUpdatePublishedMarket(classId);
  const unpublish = useUnpublishMarket(classId);

  const [sports, setSports] = useState<OddsApiSport[]>([]);
  const [sport, setSport] = useState("football");
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(20);
  const [events, setEvents] = useState<OddsApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [roundId, setRoundId] = useState<string>("none");
  const [betKinds, setBetKinds] = useState<string[]>(["moneyline"]);

  useEffect(() => {
    fetchSports().then(setSports).catch(() => undefined);
  }, []);

  const allowedSports = klass.allowed_sports ?? [];
  const allowedLeagues = klass.allowed_leagues ?? [];

  const leagueOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events) if (e.league?.slug) map.set(e.league.slug, e.league.name);
    for (const p of published) if (p.league_slug) map.set(p.league_slug, p.league_name);
    for (const slug of allowedLeagues) if (!map.has(slug)) map.set(slug, slug);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [events, published, allowedLeagues]);

  const toggleList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const search = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const result = await fetchEvents({ sport, date: date || undefined, limit });
      setEvents(result);
      if (result.length === 0) toast.info("No upcoming events for that filter.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const publishSelected = async () => {
    const picks = events.filter((e) => selected.has(e.id));
    if (picks.length === 0) return toast.error("Select at least one event.");
    try {
      // Opening price snapshot: the line at the moment the game is published.
      const openings = await Promise.all(
        picks.map(async (e) => {
          try {
            const snap = moneylineSnapshot(await fetchOdds(e.id), e.home, e.away);
            return Object.keys(snap).length >= 2 ? snap : null;
          } catch {
            return null;
          }
        }),
      );
      const now = new Date().toISOString();
      await publish.mutateAsync(
        picks.map((e, i) => ({
          ...(openings[i] && !existingIds.has(String(e.id))
            ? { opening_snapshot: { moneyline: openings[i] }, opening_captured_at: now }
            : {}),
          external_event_id: String(e.id),
          round_id: roundId === "none" ? null : roundId,
          sport_slug: e.sport?.slug ?? sport,
          sport_name: e.sport?.name ?? sport,
          league_slug: e.league?.slug ?? "",
          league_name: e.league?.name ?? "",
          title: `${e.home} vs ${e.away}`,
          home_team: e.home,
          away_team: e.away,
          commence_at: e.date,
          bet_kinds: betKinds.length ? betKinds : ["moneyline"],
          status: "published" as const,
        })),
      );
      toast.success(`Published ${picks.length} market${picks.length === 1 ? "" : "s"} to students.`);
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What students may wager on</CardTitle>
          <CardDescription>
            Set a broad sport/league allowlist, then hand-pick individual events below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Publishing mode</Label>
            <Select
              value={klass.market_publish_mode ?? "both"}
              onValueChange={(v) => updateClass.mutate({ market_publish_mode: v })}
            >
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="allowlist">Allowlist only — any event in allowed leagues</SelectItem>
                <SelectItem value="curated">Hand-picked events only</SelectItem>
                <SelectItem value="both">Both — allowlist plus featured events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Allowed sports</Label>
            <div className="flex flex-wrap gap-2">
              {(sports.length ? sports : []).map((s) => {
                const on = allowedSports.includes(s.slug);
                return (
                  <Badge
                    key={s.slug}
                    variant={on ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      updateClass.mutate({ allowed_sports: toggleList(allowedSports, s.slug) })
                    }
                  >
                    {s.name}
                  </Badge>
                );
              })}
              {sports.length === 0 && (
                <span className="text-xs text-muted-foreground">Loading sports…</span>
              )}
            </div>
          </div>

          {leagueOptions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Allowed leagues (from searched / published events)</Label>
              <div className="flex flex-wrap gap-2">
                {leagueOptions.map(([slug, name]) => {
                  const on = allowedLeagues.includes(slug);
                  return (
                    <Badge
                      key={slug}
                      variant={on ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        updateClass.mutate({ allowed_leagues: toggleList(allowedLeagues, slug) })
                      }
                    >
                      {name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse + publish */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-info" /> Publish events from the live odds feed
          </CardTitle>
          <CardDescription>Pick the exact games your students can bet on.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label className="text-xs">Sport</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(sports.length ? sports : [{ name: "Football", slug: "football" }]).map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date (optional)</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Limit</Label>
              <Input
                type="number" min={1} max={50} value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Button size="sm" onClick={search} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
              Search events
            </Button>
            <div>
              <Label className="text-xs">Assign to window</Label>
              <Select value={roundId} onValueChange={setRoundId}>
                <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No window (always open)</SelectItem>
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              {BET_KINDS.map((k) => (
                <label key={k} className="flex items-center gap-1.5 text-xs capitalize">
                  <Checkbox
                    checked={betKinds.includes(k)}
                    onCheckedChange={() => setBetKinds((prev) => toggleList(prev, k))}
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>

          {events.length > 0 && (
            <div className="rounded-md border max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Starts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(e.id)}
                          onCheckedChange={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                              return next;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{e.home} vs {e.away}</TableCell>
                      <TableCell className="text-muted-foreground">{e.league?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.date ? new Date(e.date).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {events.length > 0 && (
            <Button size="sm" onClick={publishSelected} disabled={publish.isPending}>
              Publish {selected.size || ""} selected to students
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Published list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published to this class ({published.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {published.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing published yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {published.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.league_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.commence_at ? new Date(p.commence_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.round_id ?? "none"}
                        onValueChange={(v) =>
                          updatePublished.mutate({ id: p.id, round_id: v === "none" ? null : v })
                        }
                      >
                        <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No window</SelectItem>
                          {rounds.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "published" ? "default" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="icon" variant="ghost"
                        onClick={() =>
                          updatePublished.mutate({
                            id: p.id,
                            status: p.status === "published" ? "hidden" : "published",
                          })
                        }
                      >
                        {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => unpublish.mutate(p.id)}>
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
    </div>
  );
}
