// Client-side helpers for the `odds-api` Supabase edge function.
// The actual ODDS_API_KEY never touches the browser.

import { supabase } from "@/integrations/supabase/client";

export interface OddsApiSport {
  name: string;
  slug: string;
}

export interface OddsApiEvent {
  id: number;
  home: string;
  away: string;
  homeId?: number;
  awayId?: number;
  date: string;
  status: string;
  bookmakerCount?: number;
  league: { name: string; slug: string };
  sport: { name: string; slug: string };
  scores?: {
    home: number | null;
    away: number | null;
    periods?: Record<string, unknown>;
  };
}

export interface OddsApiBookmakerOdds {
  // Free-form: structure varies by bookmaker / market. We treat values opaquely
  // and parse the common 1X2 / moneyline shape when present.
  [marketKey: string]: unknown;
}

export interface OddsApiOddsResponse extends OddsApiEvent {
  bookmakers?: Record<string, OddsApiBookmakerOdds>;
  bookmakerIds?: Record<string, number>;
  urls?: Record<string, string>;
}

type Action = "sports" | "events" | "odds" | "scores";

interface CallParams {
  action: Action;
  sport?: string;
  league?: string;
  date?: string;
  limit?: number;
  eventId?: string | number;
  status?: string;
}

// Several cards on a page ask for the same event's odds at once. Share a
// single in-flight request per parameter set and hold the answer briefly so
// one page view doesn't fire the same call a dozen times.
const CACHE_TTL_MS = 60_000;
const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, { at: number; value: unknown }>();

async function callOddsApi<T>(params: CallParams): Promise<T> {
  const key = JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const run = requestOddsApi<T>(params)
    .then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}

async function requestOddsApi<T>(params: CallParams): Promise<T> {
  const { data, error } = await supabase.functions.invoke("odds-api", {
    body: params,
  });
  if (error) throw new Error(error.message ?? "odds-api request failed");
  if (!data || typeof data !== "object") throw new Error("odds-api: empty response");
  if ("error" in data && data.error) throw new Error(String(data.error));
  return (data as { data: T }).data;
}

export function fetchSports() {
  return callOddsApi<OddsApiSport[]>({ action: "sports" });
}

export function fetchEvents(opts: {
  sport?: string;
  league?: string;
  date?: string;
  limit?: number;
}) {
  return callOddsApi<OddsApiEvent[]>({ action: "events", ...opts });
}

export function fetchOdds(eventId: string | number) {
  return callOddsApi<OddsApiOddsResponse>({ action: "odds", eventId });
}

export function fetchFinishedEvents(opts: { sport?: string; league?: string; limit?: number }) {
  return callOddsApi<OddsApiEvent[]>({ action: "scores", status: "finished", ...opts });
}

// ── Odds → implied probability helpers ────────────────────────────

/** Convert decimal odds (e.g. 1.85) to implied probability (0–1). */
export function decimalToImplied(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0;
  return 1 / decimal;
}

/**
 * Given a record of outcome name → decimal odds, return a normalized
 * implied-probability map (vig removed via simple proportional scaling).
 */
export function normalizeImplied(
  oddsByOutcome: Record<string, number>,
): Record<string, number> {
  const raw: Record<string, number> = {};
  let sum = 0;
  for (const [name, dec] of Object.entries(oddsByOutcome)) {
    const p = decimalToImplied(dec);
    raw[name] = p;
    sum += p;
  }
  if (sum <= 0) return raw;
  const out: Record<string, number> = {};
  for (const [name, p] of Object.entries(raw)) out[name] = p / sum;
  return out;
}

/**
 * Pull a best-effort moneyline (1X2 / h2h) snapshot out of the odds payload.
 * Returns averages across bookmakers so a single book can't skew the picture.
 */
export function extractMoneyline(
  odds: OddsApiOddsResponse,
): { outcome: string; decimal: number; implied: number }[] | null {
  const books = odds.bookmakers;
  if (!books || typeof books !== "object") return null;

  const accum: Record<string, { sum: number; count: number }> = {};

  for (const bookOdds of Object.values(books)) {
    if (!bookOdds || typeof bookOdds !== "object") continue;
    const ml = pickMoneylineMarket(bookOdds);
    if (!ml) continue;
    for (const [outcome, decimal] of Object.entries(ml)) {
      if (typeof decimal !== "number" || decimal <= 1) continue;
      if (!accum[outcome]) accum[outcome] = { sum: 0, count: 0 };
      accum[outcome].sum += decimal;
      accum[outcome].count += 1;
    }
  }

  const averaged: Record<string, number> = {};
  for (const [outcome, { sum, count }] of Object.entries(accum)) {
    if (count > 0) averaged[outcome] = sum / count;
  }
  if (Object.keys(averaged).length === 0) return null;

  const implied = normalizeImplied(averaged);
  return Object.entries(averaged).map(([outcome, decimal]) => ({
    outcome,
    decimal,
    implied: implied[outcome] ?? 0,
  }));
}

// Try a few common shapes to find a moneyline / 1X2 market on a bookmaker.
function pickMoneylineMarket(
  bookOdds: Record<string, unknown>,
): Record<string, number> | null {
  const candidates = ["moneyline", "h2h", "1x2", "match_winner", "ml", "winner"];
  for (const key of candidates) {
    const v = bookOdds[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const flat = flattenOddsObject(v as Record<string, unknown>);
      if (flat) return flat;
    }
  }
  // Fallback: first nested object that looks like { name: number }
  for (const v of Object.values(bookOdds)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const flat = flattenOddsObject(v as Record<string, unknown>);
      if (flat) return flat;
    }
  }
  return null;
}

function flattenOddsObject(
  obj: Record<string, unknown>,
): Record<string, number> | null {
  const out: Record<string, number> = {};
  let hits = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number" && v > 1) {
      out[k] = v;
      hits += 1;
    } else if (v && typeof v === "object" && "odds" in (v as Record<string, unknown>)) {
      const inner = (v as Record<string, unknown>).odds;
      if (typeof inner === "number" && inner > 1) {
        out[k] = inner;
        hits += 1;
      }
    }
  }
  return hits >= 2 ? out : null;
}
