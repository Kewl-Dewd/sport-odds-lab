/**
 * LMSR (Logarithmic Market Scoring Rule) Pricing Engine
 *
 * Based on Hanson's LMSR market maker:
 *   cost(q) = b × ln(Σ exp(q_i / b))
 *   price_i = exp(q_i / b) / Σ exp(q_j / b)
 *
 * Where b = liquidityParameter (higher = less price sensitivity)
 *
 * This is a working implementation that can be refined further.
 * The structure supports future enhancements like fees and volatility controls.
 */

import type {
  PricingEngine,
  PricingEngineConfig,
  OutcomeState,
  TradeRequest,
  TradeEstimateResult,
  SettlementResult,
} from "./types";

function clamp(value: number, floor: number, ceiling: number): number {
  return Math.min(ceiling, Math.max(floor, value));
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Convert prices to LMSR "quantities" (internal shares outstanding).
 * We invert: given price_i = exp(q_i/b) / Σexp(q_j/b),
 * we set q_i = b × ln(price_i) (up to a constant that cancels).
 */
function pricesToQuantities(prices: number[], b: number): number[] {
  return prices.map((p) => b * Math.log(Math.max(p, 0.001)));
}

/** Convert LMSR quantities back to prices */
function quantitiesToPrices(quantities: number[], b: number): number[] {
  const exps = quantities.map((q) => Math.exp(q / b));
  const sumExp = exps.reduce((s, e) => s + e, 0);
  return exps.map((e) => e / sumExp);
}

/** LMSR cost function: C(q) = b × ln(Σ exp(q_i / b)) */
function lmsrCost(quantities: number[], b: number): number {
  const exps = quantities.map((q) => Math.exp(q / b));
  const sumExp = exps.reduce((s, e) => s + e, 0);
  return b * Math.log(sumExp);
}

export const lmsrEngine: PricingEngine = {
  type: "lmsr",
  displayName: "LMSR Market Maker",
  description: "Logarithmic scoring rule with smooth price curves. More realistic market dynamics.",

  estimateTrade(
    outcomes: OutcomeState[],
    request: TradeRequest,
    config: PricingEngineConfig
  ): TradeEstimateResult {
    const { outcomeId, quantity, type } = request;
    const { liquidityParameter: b, priceFloor, priceCeiling } = config;

    const targetIdx = outcomes.findIndex((o) => o.id === outcomeId);
    if (targetIdx === -1) throw new Error("Outcome not found");

    const oldPrice = outcomes[targetIdx].price;
    const prices = outcomes.map((o) => o.price);
    const oldQuantities = pricesToQuantities(prices, b);

    // Apply trade: buying adds shares, selling removes
    const newQuantities = [...oldQuantities];
    const direction = type === "BUY" ? 1 : -1;
    newQuantities[targetIdx] += quantity * direction;

    // Cost = difference in cost function
    const costBefore = lmsrCost(oldQuantities, b);
    const costAfter = lmsrCost(newQuantities, b);
    const totalCost = round4(costAfter - costBefore);

    // New prices from updated quantities
    const rawNewPrices = quantitiesToPrices(newQuantities, b);

    const newPrices = outcomes.map((o, i) => ({
      outcomeId: o.id,
      price: clamp(round4(rawNewPrices[i]), priceFloor, priceCeiling),
    }));

    const newTargetPrice = newPrices[targetIdx].price;
    const avgPrice = quantity > 0 ? round4(Math.abs(totalCost) / quantity) : oldPrice;

    return {
      avgPrice,
      totalCost: type === "BUY" ? Math.abs(totalCost) : -Math.abs(totalCost),
      newPrices,
      priceBefore: oldPrice,
      priceAfter: newTargetPrice,
    };
  },

  normalizePrices(outcomes: OutcomeState[], config: PricingEngineConfig): OutcomeState[] {
    // LMSR prices naturally sum to 1.0, but clamp for safety
    const sum = outcomes.reduce((s, o) => s + o.price, 0);
    if (Math.abs(sum - 1) < 0.001) return outcomes;
    return outcomes.map((o) => ({
      ...o,
      price: clamp(round4(o.price / sum), config.priceFloor, config.priceCeiling),
    }));
  },

  impliedProbability(price: number, _outcomes: OutcomeState[]): number {
    // In LMSR, price IS the implied probability
    return price;
  },

  settleMarket(
    outcomes: OutcomeState[],
    winningOutcomeId: string,
    _config: PricingEngineConfig
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
      return { valid: false, error: `Max trade size is ${config.maxTradeSize} shares` };
    }
    return { valid: true };
  },
};
