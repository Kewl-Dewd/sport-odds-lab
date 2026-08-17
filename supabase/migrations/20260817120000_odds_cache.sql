-- Shared cache for odds-api.io responses so the whole class hits one
-- upstream request instead of one per student. Free tier = 100 req/hr.
-- Only the odds-api edge function (service role) touches this table:
-- RLS is enabled with no policies, so anon/authenticated clients are locked out.
CREATE TABLE public.odds_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.odds_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_odds_cache_expires_at ON public.odds_cache (expires_at);
