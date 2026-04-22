import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Radio, Search, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import {
  fetchEvents, fetchSports, type OddsApiEvent, type OddsApiSport,
} from "@/lib/oddsApi";
import { useMarket } from "@/context/MarketContext";
import { DEFAULT_LIQUIDITY } from "@/lib/tradingEngine";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LiveFixtureImporter({ open, onClose }: Props) {
  const { createMarket } = useMarket();

  const [sports, setSports] = useState<OddsApiSport[]>([]);
  const [sport, setSport] = useState<string>("football");
  const [date, setDate] = useState<string>("");
  const [limit, setLimit] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [loadingSports, setLoadingSports] = useState(false);
  const [events, setEvents] = useState<OddsApiEvent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [liquidity, setLiquidity] = useState<number>(DEFAULT_LIQUIDITY);
  const [includeDraw, setIncludeDraw] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load sports list once when dialog opens
  useEffect(() => {
    if (!open || sports.length > 0) return;
    setLoadingSports(true);
    fetchSports()
      .then((s) => setSports(s))
      .catch((e) => {
        console.error(e);
        setError(e.message ?? "Failed to load sports");
      })
      .finally(() => setLoadingSports(false));
  }, [open, sports.length]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const result = await fetchEvents({
        sport,
        date: date || undefined,
        limit,
      });
      setEvents(result);
      if (result.length === 0) toast.info("No upcoming events found for that filter.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch events";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = events.length > 0 && events.every((e) => selected.has(e.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(events.map((e) => e.id)));
  };

  const selectedEvents = useMemo(
    () => events.filter((e) => selected.has(e.id)),
    [events, selected],
  );

  const handleImport = () => {
    if (selectedEvents.length === 0) {
      toast.error("Select at least one event to import.");
      return;
    }
    let count = 0;
    for (const ev of selectedEvents) {
      const outcomes = includeDraw
        ? [ev.home, "Draw", ev.away]
        : [ev.home, ev.away];
      const dateLabel = formatEventDate(ev.date);
      createMarket(
        `${ev.home} vs ${ev.away}`,
        ev.league?.name ?? sport,
        ev.sport?.name ?? sport,
        dateLabel,
        `${ev.league?.name ?? "Match"} fixture imported from odds-api.io. ${ev.bookmakerCount ?? 0} bookmakers tracking.`,
        outcomes,
        liquidity,
        "linear-impact",
        undefined, undefined, undefined, undefined, undefined,
        {
          category: "game-winner",
          difficultyLevel: "beginner",
          eventDate: ev.date,
          teamNames: [ev.home, ev.away],
          dataSource: "odds-api",
          externalEventId: String(ev.id),
          externalSport: ev.sport?.slug ?? sport,
          externalLeague: ev.league?.slug,
        },
      );
      count += 1;
    }
    toast.success(`Imported ${count} live market${count === 1 ? "" : "s"}.`);
    setSelected(new Set());
    setEvents([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-info" />
            Import live fixtures
          </DialogTitle>
          <DialogDescription>
            Pull upcoming games from odds-api.io and create classroom markets in one click.
            Imported markets are tagged as “Live data”.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Sport</Label>
            <Select value={sport} onValueChange={setSport} disabled={loadingSports}>
              <SelectTrigger><SelectValue placeholder="Select a sport" /></SelectTrigger>
              <SelectContent>
                {(sports.length > 0 ? sports : FALLBACK_SPORTS).map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />Date (optional)</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Limit</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSearch} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Search className="h-4 w-4 mr-1.5" />}
            Search fixtures
          </Button>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Liquidity</Label>
            <Input
              type="number"
              min={10}
              className="w-24 h-8"
              value={liquidity}
              onChange={(e) => setLiquidity(Math.max(10, Number(e.target.value) || DEFAULT_LIQUIDITY))}
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={includeDraw} onCheckedChange={(v) => setIncludeDraw(!!v)} />
            Include “Draw” outcome (soccer)
          </label>
        </div>

        {error && (
          <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded p-2">
            {error}
          </div>
        )}

        {/* Results */}
        {events.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted text-xs">
              <label className="flex items-center gap-2 font-medium">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                {selected.size} of {events.length} selected
              </label>
              <span className="text-muted-foreground">{sport}</span>
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {events.map((ev) => (
                <label key={ev.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer">
                  <Checkbox
                    checked={selected.has(ev.id)}
                    onCheckedChange={() => toggle(ev.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{ev.home} vs {ev.away}</span>
                      <Badge variant="outline" className="text-[10px]">{ev.league?.name ?? "—"}</Badge>
                      {ev.bookmakerCount != null && (
                        <span className="text-[10px] text-muted-foreground">{ev.bookmakerCount} books</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatEventDate(ev.date)} · {ev.status}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={selected.size === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Import {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FALLBACK_SPORTS: OddsApiSport[] = [
  { name: "Football", slug: "football" },
  { name: "Basketball", slug: "basketball" },
  { name: "Tennis", slug: "tennis" },
  { name: "Baseball", slug: "baseball" },
  { name: "Hockey", slug: "hockey" },
];

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
