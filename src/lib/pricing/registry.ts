/**
 * Pricing Engine Registry
 *
 * Central lookup for all available pricing engines.
 * To add a new engine:
 *   1. Implement the PricingEngine interface
 *   2. Register it here
 *   3. It becomes available in the admin UI automatically
 */

import type { PricingEngine, PricingEngineType } from "./types";
import { linearImpactEngine } from "./linearImpactEngine";
import { lmsrEngine } from "./lmsrEngine";
import { fixedOddsEngine } from "./fixedOddsEngine";

const engines = new Map<PricingEngineType, PricingEngine>();

engines.set("linear-impact", linearImpactEngine);
engines.set("lmsr", lmsrEngine);
engines.set("fixed-odds", fixedOddsEngine);

export function getEngine(type: PricingEngineType): PricingEngine {
  const engine = engines.get(type);
  if (!engine) throw new Error(`Unknown pricing engine: ${type}`);
  return engine;
}

export function getAllEngines(): PricingEngine[] {
  return Array.from(engines.values());
}

export function getEngineOptions() {
  return getAllEngines().map((e) => ({
    value: e.type,
    label: e.displayName,
    description: e.description,
  }));
}
