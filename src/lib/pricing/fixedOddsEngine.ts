/**
 * Fixed-Odds Sportsbook Engine
 *
 * Real sportsbooks do not move the line because one customer bets $20.
 * They post a price that already contains the house margin (the "vig"),
 * and every ticket written before the next feed update gets that same price.
 *
 * This engine reproduces that behaviour:
 *  - prices come straight from the live odds feed and never move on a trade
 *  - prices are NOT normalized to sum to 1.00 — the overround above 1.00
 *    IS the book's vig
 *  - cost = stake at the posted price; payout = $1 per contract if it wins
 *
 * The book's theoretical hold on a balanced book is
 *   (sum(prices) - 1) / sum(prices).
 */

import type {
  PricingEngine,
  PricingEngineConfig,
  OutcomeState,
  TradeRequest,
  TradeEstimateResult,
  SettlementResult,
} from "./types";

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export const fixedOddsEngine: PricingEngine = {
  type: "fixed-odds",
  displayName: "Fixed Odds (Sportsbook)",
  description:
    "Posted odds come from the live feed and never move on a bet. The house margin (vig) is baked into the price.",

  estimateTrade(
    outcomes: OutcomeState[],
    request: TradeRequest,
    config: PricingEngineConfig
  ): TradeEstimateResult {
    const { outcomeId, quantity, type } = request;
    const idx = outcomes.findIndex((o) => o.id === outcomeId);
    if (idx === -1) throw new Error("Outcome not found");

    const price = outcomes[idx].price;
    const rawCost = round4(quantity * price);
    const fee = round4(Math.abs(rawCost) * (config.transactionFeePct ?? 0));
    const totalCost =
      type === "BUY" ? rawCost + fee : -(Math.abs(rawCost) - fee);

    const priceSum = outcomes.reduce((s, o) => s + o.price, 0);
    const implied = round4(price / Math.max(priceSum, 0.01));

    return {
      avgPrice: price,
      totalCost,
      // Line does not move — prices are unchanged.
      newPrices: outcomes.map((o) => ({ outcomeId: o.id, price: o.price })),
      priceBefore: price,
      priceAfter: price,
      fee,
      spread: 0,
      impliedProbBefore: implied,
      impliedProbAfter: implied,
    };
  },

  normalizePrices(outcomes: OutcomeState[]): OutcomeState[] {
    // Intentionally a no-op: the overround is the vig and must be preserved.
    return outcomes;
  },

  impliedProbability(price: number, outcomes: OutcomeState[]): number {
    const sum = outcomes.reduce((s, o) => s + o.price, 0);
    return round4(price / Math.max(sum, 0.01));
  },

  settleMarket(
    outcomes: OutcomeState[],
    winningOutcomeId: string
  ): SettlementResult {
    return {
      outcomeId: winningOutcomeId,
      finalPrices: outcomes.map((o) => ({
        outcomeId: o.id,
        price: o.id === winningOutcomeId ? 1.0 : 0.0,
      })),
      payoutPerShare: 1.0,
    };
  },

  validateTradeSize(quantity: number, config: PricingEngineConfig) {
    if (quantity > config.maxTradeSize) {
      return { valid: false, error: `Max bet size is ${config.maxTradeSize} contracts` };
    }
    return { valid: true };
  },
};

/** Theoretical house margin implied by a set of posted prices. */
export function bookVigPct(prices: number[]): number {
  const sum = prices.reduce((s, p) => s + p, 0);
  if (sum <= 0) return 0;
  return ((sum - 1) / sum) * 100;
}
