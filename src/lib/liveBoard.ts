// Auto-loads a live sportsbook board (upcoming games + moneyline odds) from
// the odds-api edge function so the Markets page is never empty.

import {
  fetchEvents,
  fetchOdds,
  extractMoneyline,
  normalizeImplied,
  type OddsApiEvent,
} from "@/lib/oddsApi";

export interface LiveBoardGame {
  event: OddsApiEvent;
  /** Outcome name → decimal odds (home / away, and Draw when present) */
  odds: Record<string, number>;
  /** Outcome name → vig-free implied probability */
  implied: Record<string, number>;
}

/** Sports we pull for the default classroom board, in priority order. */
export const DEFAULT_BOARD_SPORTS = [
  "american-football",
  "basketball",
  "baseball",
  "ice-hockey",
];

function isUpcoming(ev: OddsApiEvent): boolean {
  if (!ev.date) return false;
  const t = new Date(ev.date).getTime();
  if (!Number.isFinite(t)) return false;
  // Keep games that haven't finished: future, or started within the last 3h.
  return t > Date.now() - 3 * 60 * 60 * 1000 && ev.status !== "settled";
}

/** Map raw bookmaker outcome keys (1/X/2, team names) onto the event teams. */
function mapOutcomes(
  ev: OddsApiEvent,
  ml: { outcome: string; decimal: number }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { outcome, decimal } of ml) {
    const key = outcome.trim().toLowerCase();
    if (key === "1" || key === "home" || key === ev.home.toLowerCase()) out[ev.home] = decimal;
    else if (key === "2" || key === "away" || key === ev.away.toLowerCase()) out[ev.away] = decimal;
    else if (key === "x" || key === "draw" || key === "tie") out["Draw"] = decimal;
  }
  return out;
}

/**
 * Fetch a handful of upcoming games with moneyline prices.
 * Responses are cached server-side, so repeated calls across a class are cheap.
 */
export async function loadLiveBoard(opts?: {
  sports?: string[];
  perSport?: number;
  maxGames?: number;
}): Promise<LiveBoardGame[]> {
  const sports = opts?.sports ?? DEFAULT_BOARD_SPORTS;
  const perSport = opts?.perSport ?? 6;
  const maxGames = opts?.maxGames ?? 12;

  const eventLists = await Promise.all(
    sports.map((sport) =>
      fetchEvents({ sport, limit: perSport }).catch(() => [] as OddsApiEvent[]),
    ),
  );

  const candidates: OddsApiEvent[] = [];
  // Interleave sports so the board isn't all one league.
  for (let i = 0; i < perSport; i += 1) {
    for (const list of eventLists) {
      const ev = list[i];
      if (ev && isUpcoming(ev)) candidates.push(ev);
    }
  }

  const picked = candidates.slice(0, maxGames);

  const games = await Promise.all(
    picked.map(async (event): Promise<LiveBoardGame | null> => {
      try {
        const odds = await fetchOdds(event.id);
        const ml = extractMoneyline(odds);
        if (!ml) return null;
        const mapped = mapOutcomes(event, ml);
        if (Object.keys(mapped).length < 2) return null;
        return { event, odds: mapped, implied: normalizeImplied(mapped) };
      } catch {
        return null;
      }
    }),
  );

  return games.filter((g): g is LiveBoardGame => g !== null);
}
