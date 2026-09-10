// Sportsbook engine: fixed-odds wagers locked at price-of-acceptance.
// Supports moneyline (h2h), point spread, and totals (over/under) lines.
// Pari-mutuel pool support lives in racetrackEngine.ts.

export type SportsbookMarketKind = "moneyline" | "spread" | "total";

export interface SportsbookLine {
  /** Stable id within the market */
  id: string;
  kind: SportsbookMarketKind;
  /** Display label e.g. "Lakers ML" / "Lakers -4.5" / "Over 218.5" */
  label: string;
  /** Decimal odds, must be > 1.00 */
  decimalOdds: number;
  /** Optional: spread points or total line for spread/total markets */
  point?: number;
  /** Optional: which side this line represents (home/away/over/under) */
  side?: "home" | "away" | "over" | "under" | "draw";
}

export interface SportsbookSurface {
  /** Whether this surface is active for trading */
  enabled: boolean;
  /** Source of the lines: API or instructor manual */
  source: "manual" | "odds-api";
  /** Snapshot of when the lines were last refreshed (ISO) */
  lastUpdated?: string;
  lines: SportsbookLine[];
  /** Optional override note shown to students */
  note?: string;
}

export interface SportsbookWager {
  id: string;
  userId: string;
  marketId: string;
  lineId: string;
  /** Locked at moment of placement */
  decimalOdds: number;
  stake: number;
  /** Snapshot of label for after-the-fact debrief */
  label: string;
  kind: SportsbookMarketKind;
  side?: "home" | "away" | "over" | "under" | "draw";
  point?: number;
  placedAt: string;
  /** Settlement state */
  status: "open" | "won" | "lost" | "push" | "void";
  /** Settled payout (stake returned + winnings) — 0 if lost; stake if pushed/voided */
  settledPayout?: number;
  settledAt?: string;
}

// ── Conversions ────────────────────────────────────────────────────

export function americanToDecimal(american: number): number {
  if (!Number.isFinite(american)) return 0;
  if (american > 0) return 1 + american / 100;
  if (american < 0) return 1 + 100 / Math.abs(american);
  return 0;
}

export function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0;
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return -Math.round(100 / (decimal - 1));
}

/** Implied probability from decimal odds. */
export function decimalToImpliedProb(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0;
  return 1 / decimal;
}

/** Format American odds with sign. */
export function formatAmerican(american: number): string {
  if (american === 0) return "—";
  return american > 0 ? `+${american}` : `${american}`;
}

// ── Validation ─────────────────────────────────────────────────────

export interface PlaceWagerRequest {
  userId: string;
  marketId: string;
  line: SportsbookLine;
  stake: number;
  /** User's current cash */
  cash: number;
  /** Max stake per wager (instructor-controlled) */
  maxStake?: number;
}

export interface WagerValidation {
  ok: boolean;
  error?: string;
  potentialPayout: number; // stake * decimalOdds
  potentialProfit: number; // payout - stake
}

export function validateWager(req: PlaceWagerRequest): WagerValidation {
  const { stake, cash, line, maxStake } = req;
  const payout = stake * line.decimalOdds;
  const profit = payout - stake;
  if (!Number.isFinite(stake) || stake <= 0) {
    return { ok: false, error: "Enter a positive stake amount", potentialPayout: 0, potentialProfit: 0 };
  }
  if (stake > cash) {
    return { ok: false, error: `Stake exceeds available cash ($${cash.toFixed(2)})`, potentialPayout: payout, potentialProfit: profit };
  }
  if (maxStake !== undefined && stake > maxStake) {
    return { ok: false, error: `Stake exceeds per-wager limit ($${maxStake.toFixed(2)})`, potentialPayout: payout, potentialProfit: profit };
  }
  if (line.decimalOdds <= 1) {
    return { ok: false, error: "Invalid odds — must be > 1.00", potentialPayout: 0, potentialProfit: 0 };
  }
  return { ok: true, potentialPayout: payout, potentialProfit: profit };
}

// ── Settlement ─────────────────────────────────────────────────────

export interface SportsbookGameResult {
  /** Final score for home team (or null if not applicable) */
  homeScore?: number;
  awayScore?: number;
  /** For non-team markets: which side(s) won. e.g. for moneyline, "home" or "away". */
  winningSide?: "home" | "away" | "over" | "under" | "push" | "void";
}

/**
 * Determine if a wager won/lost/pushed given a game result.
 * Returns settled payout (cash to credit back to user).
 */
export function settleWager(
  wager: SportsbookWager,
  result: SportsbookGameResult,
): { status: SportsbookWager["status"]; payout: number } {
  if (result.winningSide === "void") {
    return { status: "void", payout: wager.stake };
  }

  switch (wager.kind) {
    case "moneyline": {
      if (wager.side === result.winningSide) {
        return { status: "won", payout: wager.stake * wager.decimalOdds };
      }
      if (result.winningSide === "push") return { status: "push", payout: wager.stake };
      return { status: "lost", payout: 0 };
    }
    case "spread": {
      const home = result.homeScore ?? 0;
      const away = result.awayScore ?? 0;
      const point = wager.point ?? 0;
      // For "home -4.5", side=home, point=-4.5: home covers if (home - away) > 4.5
      // Adjusted score for the side
      const margin = wager.side === "home" ? home - away + point : away - home + point;
      if (Math.abs(margin) < 1e-9) return { status: "push", payout: wager.stake };
      if (margin > 0) return { status: "won", payout: wager.stake * wager.decimalOdds };
      return { status: "lost", payout: 0 };
    }
    case "total": {
      const total = (result.homeScore ?? 0) + (result.awayScore ?? 0);
      const line = wager.point ?? 0;
      if (Math.abs(total - line) < 1e-9) return { status: "push", payout: wager.stake };
      if (wager.side === "over" && total > line) return { status: "won", payout: wager.stake * wager.decimalOdds };
      if (wager.side === "under" && total < line) return { status: "won", payout: wager.stake * wager.decimalOdds };
      return { status: "lost", payout: 0 };
    }
    default:
      return { status: "void", payout: wager.stake };
  }
}
