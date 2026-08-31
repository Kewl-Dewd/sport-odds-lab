/**
 * Pricing Engine Interface — The contract all pricing engines must implement.
 *
 * This interface is designed for extensibility:
 * - Swap engines per market without touching app logic
 * - Future support for limit orders, order books, fees, volatility controls
 */

export type PricingEngineType = "linear-impact" | "lmsr" | "fixed-odds";

export interface PricingEngineConfig {
  type: PricingEngineType;
  liquidityParameter: number;
  maxTradeSize: number;
  priceFloor: number;
  priceCeiling: number;
  /** Transaction fee as a fraction (e.g. 0.01 = 1%) */
  transactionFeePct: number;
  /** Spread/friction in price units (e.g. 0.005 = 0.5¢) */
  spread: number;
  /** Reserved for future engine-specific settings */
  custom?: Record<string, unknown>;
}

export interface OutcomeState {
  id: string;
  name: string;
  price: number;
}

export interface TradeRequest {
  outcomeId: string;
  quantity: number;
  type: "BUY" | "SELL";
}

export interface TradeEstimateResult {
  avgPrice: number;
  totalCost: number;
  newPrices: { outcomeId: string; price: number }[];
  priceBefore: number;
  priceAfter: number;
  fee: number;
  spread: number;
  impliedProbBefore: number;
  impliedProbAfter: number;
}

export interface SettlementResult {
  outcomeId: string;
  finalPrices: { outcomeId: string; price: number }[];
  payoutPerShare: number; // typically 1.0 for winning outcome
}

/**
 * Every pricing engine must implement this interface.
 * The engine receives immutable state and returns new state — pure functions only.
 */
export interface PricingEngine {
  readonly type: PricingEngineType;
  readonly displayName: string;
  readonly description: string;

  /** Estimate a trade without mutating state */
  estimateTrade(
    outcomes: OutcomeState[],
    request: TradeRequest,
    config: PricingEngineConfig
  ): TradeEstimateResult;

  /** Normalize prices so they sum to 1.0 (or close to it) */
  normalizePrices(outcomes: OutcomeState[], config: PricingEngineConfig): OutcomeState[];

  /** Calculate implied probability from price */
  impliedProbability(price: number, outcomes: OutcomeState[]): number;

  /** Calculate settlement payouts */
  settleMarket(
    outcomes: OutcomeState[],
    winningOutcomeId: string,
    config: PricingEngineConfig
  ): SettlementResult;

  /** Validate a trade request against engine-specific rules */
  validateTradeSize(quantity: number, config: PricingEngineConfig): { valid: boolean; error?: string };
}

/** Default config values */
export const DEFAULT_ENGINE_CONFIG: PricingEngineConfig = {
  type: "linear-impact",
  liquidityParameter: 100,
  maxTradeSize: 500,
  priceFloor: 0.01,
  priceCeiling: 0.99,
  transactionFeePct: 0,
  spread: 0,
};

/** Available engine type labels for UI */
export const ENGINE_TYPE_OPTIONS: { value: PricingEngineType; label: string; description: string }[] = [
  {
    value: "linear-impact",
    label: "Simple Linear Impact",
    description: "Price moves linearly with trade size. Good for classroom demos.",
  },
  {
    value: "lmsr",
    label: "LMSR Market Maker",
    description: "Logarithmic scoring rule. More realistic price curves.",
  },
  {
    value: "fixed-odds",
    label: "Fixed Odds (Sportsbook)",
    description: "Posted odds never move on a bet. The house vig is baked into the price.",
  },
];
