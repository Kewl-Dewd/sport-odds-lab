// Auto-loads a live sportsbook board (upcoming games + moneyline / spread /
// total lines) from the odds-api edge function so the Markets page is never
// empty. Responses are cached server-side, so a whole class shares one fetch.

import {
  fetchEvents,
  fetchOdds,
  normalizeImplied,
  type OddsApiEvent,
} from "@/lib/oddsApi";

export interface BoardLine {
  kind: "moneyline" | "spread" | "total";
  label: string;
  decimalOdds: number;
  point?: number;
  side: "home" | "away" | "over" | "under" | "draw";
}

export interface LiveBoardGame {
  event: OddsApiEvent;
  /** Moneyline decimal odds keyed by team name */
  moneyline: Record<string, number>;
  /** Vig-free implied probabilities keyed by team name */
  implied: Record<string, number>;
  lines: BoardLine[];
}

/** The major North American leagues we run the classroom board on. */
export interface MajorLeague {
  key: string;
  label: string;
  sport: string;
  league: string;
}

export const MAJOR_LEAGUES: MajorLeague[] = [
  { key: "usa-mlb", label: "MLB", sport: "baseball", league: "usa-mlb" },
  { key: "usa-nba", label: "NBA", sport: "basketball", league: "usa-nba" },
  { key: "usa-nfl", label: "NFL", sport: "american-football", league: "usa-nfl" },
  { key: "usa-nhl", label: "NHL", sport: "ice-hockey", league: "usa-nhl" },
  { key: "usa-mls", label: "MLS", sport: "football", league: "usa-mls" },
];

export const DEFAULT_BOARD_LEAGUES = MAJOR_LEAGUES.map((l) => l.key);

/** Legacy export kept for compatibility. */
export const DEFAULT_BOARD_SPORTS = MAJOR_LEAGUES.map((l) => l.sport);

/** True when `iso` falls within the next `days` local calendar days (0 = today only). */
function isWithinLocalDays(iso: string, days: number, ref = new Date()): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + days + 1); // exclusive end of the last included day
  return d >= start && d < end;
}


function isUpcoming(ev: OddsApiEvent): boolean {
  if (!ev.date) return false;
  const t = new Date(ev.date).getTime();
  if (!Number.isFinite(t)) return false;
  // Keep games that haven't finished: future, or started within the last 3h.
  return t > Date.now() - 3 * 60 * 60 * 1000 && ev.status !== "settled";
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 1 ? n : null;
};

/**
 * odds-api.io /v3/odds shape:
 * bookmakers: { DraftKings: [{ name: "ML"|"Spread"|"Totals", odds: [{home,away,hdp,points,over,under}] }] }
 * We average across the books we have access to.
 */
function parseBook(payload: unknown, event: OddsApiEvent): { moneyline: Record<string, number>; lines: BoardLine[] } {
  const books = (payload as { bookmakers?: Record<string, unknown> })?.bookmakers;
  const ml: Record<string, { sum: number; n: number }> = {};
  const spread: Record<string, { sum: number; n: number; point: number }> = {};
  const totals: Record<string, { sum: number; n: number; point: number }> = {};

  if (books && typeof books === "object") {
    for (const entries of Object.values(books)) {
      if (!Array.isArray(entries)) continue;
      for (const market of entries) {
        const name = String((market as { name?: string })?.name ?? "").toLowerCase();
        const rows = (market as { odds?: unknown[] })?.odds;
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const row = rows[0] as Record<string, unknown>;

        if (name === "ml" || name === "moneyline" || name === "1x2") {
          const h = num(row.home), a = num(row.away);
          // Soccer (MLS) prices a three-way market: home / draw / away.
          const d = num(row.draw ?? row.x);
          if (h) (ml[event.home] ??= { sum: 0, n: 0 }), (ml[event.home].sum += h, ml[event.home].n += 1);
          if (a) (ml[event.away] ??= { sum: 0, n: 0 }), (ml[event.away].sum += a, ml[event.away].n += 1);
          if (d) (ml["Draw"] ??= { sum: 0, n: 0 }), (ml["Draw"].sum += d, ml["Draw"].n += 1);
        } else if (name === "spread" || name === "handicap") {
          const point = Number(row.hdp);
          const h = num(row.home), a = num(row.away);
          if (Number.isFinite(point)) {
            if (h) (spread.home ??= { sum: 0, n: 0, point }), (spread.home.sum += h, spread.home.n += 1);
            if (a) (spread.away ??= { sum: 0, n: 0, point: -point }), (spread.away.sum += a, spread.away.n += 1);
          }
        } else if (name === "totals" || name === "total" || name === "over/under") {
          const point = Number(row.points ?? row.hdp ?? row.total);
          const o = num(row.over), u = num(row.under);
          if (Number.isFinite(point)) {
            if (o) (totals.over ??= { sum: 0, n: 0, point }), (totals.over.sum += o, totals.over.n += 1);
            if (u) (totals.under ??= { sum: 0, n: 0, point }), (totals.under.sum += u, totals.under.n += 1);
          }
        }
      }
    }
  }

  const moneyline: Record<string, number> = {};
  for (const [team, v] of Object.entries(ml)) if (v.n > 0) moneyline[team] = v.sum / v.n;

  const lines: BoardLine[] = [];
  for (const [team, dec] of Object.entries(moneyline)) {
    lines.push({
      kind: "moneyline",
      label: team === "Draw" ? "Draw" : `${team} ML`,
      decimalOdds: dec,
      side: team === event.home ? "home" : team === event.away ? "away" : "draw",
    });
  }
  for (const side of ["home", "away"] as const) {
    const s = spread[side];
    if (s && s.n > 0) {
      const team = side === "home" ? event.home : event.away;
      lines.push({
        kind: "spread",
        label: `${team} ${s.point > 0 ? "+" : ""}${s.point}`,
        decimalOdds: s.sum / s.n,
        point: s.point,
        side,
      });
    }
  }
  for (const side of ["over", "under"] as const) {
    const t = totals[side];
    if (t && t.n > 0) {
      lines.push({
        kind: "total",
        label: `${side === "over" ? "Over" : "Under"} ${t.point}`,
        decimalOdds: t.sum / t.n,
        point: t.point,
        side,
      });
    }
  }

  return { moneyline, lines };
}

/** Fetch a handful of upcoming games that actually have priced lines. */
export async function loadLiveBoard(opts?: {
  /** League keys from MAJOR_LEAGUES; defaults to all four. */
  leagues?: string[];
  perLeague?: number;
  maxGames?: number;
  maxLookups?: number;
  /** How many extra calendar days past today to include. Defaults to 2 (today + next 2 days). */
  daysAhead?: number;
}): Promise<LiveBoardGame[]> {
  const keys = opts?.leagues?.length ? opts.leagues : DEFAULT_BOARD_LEAGUES;
  const leagues = MAJOR_LEAGUES.filter((l) => keys.includes(l.key));
  const perLeague = opts?.perLeague ?? 40;
  const maxGames = opts?.maxGames ?? 36;
  const daysAhead = opts?.daysAhead ?? 2;
  // Cap upstream odds lookups; the provider's free tier allows 100 req/hour.
  const maxLookups = opts?.maxLookups ?? 42;


  const eventLists = await Promise.all(
    leagues.map((l) =>
      fetchEvents({ sport: l.sport, league: l.league, limit: perLeague }).catch(
        () => [] as OddsApiEvent[],
      ),
    ),
  );

  // Interleave leagues so the board isn't all one league.
  const candidates: OddsApiEvent[] = [];
  for (let i = 0; i < perLeague; i += 1) {
    for (const [idx, list] of eventLists.entries()) {
      const ev = list[i];
      if (!ev || !isUpcoming(ev)) continue;
      // Defensive: the upstream filter can be loose, so pin the league.
      if (ev.league?.slug && ev.league.slug !== leagues[idx].league) continue;
      if (!isWithinLocalDays(ev.date, daysAhead)) continue;
      candidates.push(ev);
    }
  }
  // Soonest games first so the board reads today → tomorrow → day after.
  candidates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  const games: LiveBoardGame[] = [];
  const batchSize = 6;
  const pool = candidates.slice(0, maxLookups);
  for (let i = 0; i < pool.length && games.length < maxGames; i += batchSize) {
    const batch = pool.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (event) => {
        try {
          const odds = await fetchOdds(event.id);
          const { moneyline, lines } = parseBook(odds, event);
          if (Object.keys(moneyline).length < 2) return null;
          return { event, moneyline, implied: normalizeImplied(moneyline), lines } as LiveBoardGame;
        } catch {
          return null;
        }
      }),
    );
    for (const g of results) {
      if (g && games.length < maxGames) games.push(g);
    }
  }

  return games;
}
