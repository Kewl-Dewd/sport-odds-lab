// Hand-off of forecast data from the bet slip to the bet persistence layer.
// The slip records metadata keyed by the engine trade id right after
// placement; PersistenceBridge reads it when writing the bet row.
export interface ForecastMeta {
  forecast_prob: number;
  implied_prob: number;
  no_vig_prob: number;
  expected_value: number;
  external_event_id: string | null;
  event_starts_at: string | null;
}

const store = new Map<string, ForecastMeta>();

export function setForecastMeta(tradeId: string, meta: ForecastMeta) {
  store.set(tradeId, meta);
}

export function getForecastMeta(tradeId: string): ForecastMeta | undefined {
  return store.get(tradeId);
}
