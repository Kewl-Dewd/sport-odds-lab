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
  side: "home" | "away" | "over" | "under";
}

export interface LiveBoardGame {
  event: OddsApiEvent;
  /** Moneyline decimal odds keyed by team name */
  moneyline: Record<string, number>;
  /** Vig-free implied probabilities keyed by team name */
  implied: Record<string, number>;
  lines: BoardLine[];
}

/** Sports we pull for the default classroom board, in priority order. */
export const DEFAULT_BOARD_SPORTS = [
  "american-football",
  "basketball",
  "baseball",
  "ice-hockey",
  "football",
  "tennis",
];

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
          if (h) (ml[event.home] ??= { sum: 0, n: 0 }), (ml[event.home].sum += h, ml[event.home].n += 1);
          if (a) (ml[event.away] ??= { sum: 0, n: 0 }), (ml[event.away].sum += a, ml[event.away].n += 1);
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
      label: `${team} ML`,
      decimalOdds: dec,
      side: team === event.home ? "home" : "away",
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
  sports?: string[];
  perSport?: number;
  maxGames?: number;
  maxLookups?: number;
}): Promise<LiveBoardGame[]> {
  const sports = opts?.sports ?? DEFAULT_BOARD_SPORTS;
  const perSport = opts?.perSport ?? 25;
  const maxGames = opts?.maxGames ?? 12;
  // Cap upstream odds lookups; many minor fixtures carry no priced lines.
  const maxLookups = opts?.maxLookups ?? 60;

  const eventLists = await Promise.all(
    sports.map((sport) =>
      fetchEvents({ sport, limit: perSport }).catch(() => [] as OddsApiEvent[]),
    ),
  );

  // Interleave sports so the board isn't all one league.
  const candidates: OddsApiEvent[] = [];
  for (let i = 0; i < perSport; i += 1) {
    for (const list of eventLists) {
      const ev = list[i];
      if (ev && isUpcoming(ev)) candidates.push(ev);
    }
  }

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
