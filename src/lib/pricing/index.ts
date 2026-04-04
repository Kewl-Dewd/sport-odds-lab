/**
 * Pricing Engine — Public API
 *
 * All pricing operations go through this module.
 * The rest of the app never imports individual engines directly.
 */

export type {
  PricingEngine,
  PricingEngineType,
  PricingEngineConfig,
  OutcomeState,
  TradeRequest,
  TradeEstimateResult,
  SettlementResult,
} from "./types";

export { DEFAULT_ENGINE_CONFIG, ENGINE_TYPE_OPTIONS } from "./types";
export { getEngine, getAllEngines, getEngineOptions } from "./registry";
export { linearImpactEngine } from "./linearImpactEngine";
export { lmsrEngine } from "./lmsrEngine";
