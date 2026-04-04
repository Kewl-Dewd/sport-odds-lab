/**
 * Simple Linear Impact Pricing Engine
 *
 * Model: price_impact = quantity / liquidity
 * Cost = quantity × (old_price + new_price) / 2
 *
 * For binary markets: prices sum to 1.00
 * For multi-outcome: inverse impact distributed proportionally
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

export const linearImpactEngine: PricingEngine = {
  type: "linear-impact",
  displayName: "Simple Linear Impact",
  description: "Price moves linearly with trade size. Ideal for classroom demonstrations.",

  estimateTrade(
    outcomes: OutcomeState[],
    request: TradeRequest,
    config: PricingEngineConfig
  ): TradeEstimateResult {
    const { outcomeId, quantity, type } = request;
    const { liquidityParameter, priceFloor, priceCeiling } = config;
    const direction = type === "BUY" ? 1 : -1;

    const targetIdx = outcomes.findIndex((o) => o.id === outcomeId);
    if (targetIdx === -1) throw new Error("Outcome not found");

    const oldPrice = outcomes[targetIdx].price;
    const rawImpact = (quantity / liquidityParameter) * direction;
    const newTargetPrice = clamp(round4(oldPrice + rawImpact), priceFloor, priceCeiling);
    const actualImpact = newTargetPrice - oldPrice;

    const otherOutcomes = outcomes.filter((_, i) => i !== targetIdx);
    const otherPriceSum = otherOutcomes.reduce((s, o) => s + o.price, 0);

    const newPrices: { outcomeId: string; price: number }[] = [];

    if (outcomes.length === 2) {
      for (const o of outcomes) {
        if (o.id === outcomeId) {
          newPrices.push({ outcomeId: o.id, price: newTargetPrice });
        } else {
          newPrices.push({
            outcomeId: o.id,
            price: clamp(round4(1 - newTargetPrice), priceFloor, priceCeiling),
          });
        }
      }
    } else {
      for (const o of outcomes) {
        if (o.id === outcomeId) {
          newPrices.push({ outcomeId: o.id, price: newTargetPrice });
        } else {
          const weight = otherPriceSum > 0 ? o.price / otherPriceSum : 1 / otherOutcomes.length;
          const adjusted = clamp(round4(o.price - actualImpact * weight), priceFloor, priceCeiling);
          newPrices.push({ outcomeId: o.id, price: adjusted });
        }
      }
    }

    const avgPrice = round4((oldPrice + newTargetPrice) / 2);
    const totalCost = round4(quantity * avgPrice);

    return {
      avgPrice: Math.abs(avgPrice),
      totalCost: type === "BUY" ? totalCost : -totalCost,
      newPrices,
      priceBefore: oldPrice,
      priceAfter: newTargetPrice,
    };
  },

  normalizePrices(outcomes: OutcomeState[], config: PricingEngineConfig): OutcomeState[] {
    const sum = outcomes.reduce((s, o) => s + o.price, 0);
    if (Math.abs(sum - 1) < 0.001) return outcomes;
    return outcomes.map((o) => ({
      ...o,
      price: clamp(round4(o.price / sum), config.priceFloor, config.priceCeiling),
    }));
  },

  impliedProbability(price: number, _outcomes: OutcomeState[]): number {
    return price; // In linear model, price ≈ probability
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
