ALTER TABLE public.bets
  ADD COLUMN forecast_prob numeric,
  ADD COLUMN implied_prob numeric,
  ADD COLUMN no_vig_prob numeric,
  ADD COLUMN expected_value numeric,
  ADD COLUMN closing_no_vig_prob numeric,
  ADD COLUMN clv_pct numeric,
  ADD COLUMN closing_captured_at timestamptz,
  ADD COLUMN external_event_id text,
  ADD COLUMN event_starts_at timestamptz,
  ADD COLUMN published_market_id uuid REFERENCES public.published_markets(id) ON DELETE SET NULL;

CREATE INDEX bets_closing_pending_idx ON public.bets (external_event_id) WHERE closing_captured_at IS NULL;

CREATE OR REPLACE FUNCTION public.validate_bet_forecast()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.forecast_prob IS NOT NULL AND (NEW.forecast_prob < 0 OR NEW.forecast_prob > 1) THEN
    RAISE EXCEPTION 'forecast_prob must be between 0 and 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bets_validate_forecast
BEFORE INSERT OR UPDATE ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.validate_bet_forecast();

ALTER TABLE public.published_markets
  ADD COLUMN opening_snapshot jsonb,
  ADD COLUMN opening_captured_at timestamptz,
  ADD COLUMN closing_snapshot jsonb,
  ADD COLUMN closing_captured_at timestamptz;

ALTER TABLE public.class_rounds ALTER COLUMN scoring SET DEFAULT 'brier';

CREATE OR REPLACE FUNCTION public.class_analysis_leaderboard(_class_id uuid, _round_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, display_name text, positions bigint, forecasts bigint,
              brier numeric, avg_clv_pct numeric, clv_count bigint, journal_pct numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH allowed AS (
    SELECT (public.is_class_owner(_class_id) OR public.is_class_member(_class_id) OR public.is_platform_admin()) AS ok
  ),
  b AS (
    SELECT b.* FROM public.bets b
    WHERE b.class_id = _class_id
      AND (_round_id IS NULL OR b.round_id = _round_id)
      AND (SELECT ok FROM allowed)
  )
  SELECT
    b.user_id,
    COALESCE(NULLIF(p.display_name, ''), split_part(COALESCE(p.email, ''), '@', 1), 'Student'),
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE b.forecast_prob IS NOT NULL AND b.status IN ('won','lost'))::bigint,
    AVG(power(b.forecast_prob - CASE WHEN b.status = 'won' THEN 1 ELSE 0 END, 2))
      FILTER (WHERE b.forecast_prob IS NOT NULL AND b.status IN ('won','lost'))::numeric,
    AVG(b.clv_pct) FILTER (WHERE b.clv_pct IS NOT NULL)::numeric,
    COUNT(*) FILTER (WHERE b.clv_pct IS NOT NULL)::bigint,
    (COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.bet_journal j WHERE j.bet_id = b.id))::numeric
      / NULLIF(COUNT(*), 0) * 100)::numeric
  FROM b
  LEFT JOIN public.profiles p ON p.user_id = b.user_id
  GROUP BY b.user_id, p.display_name, p.email;
$$;

REVOKE EXECUTE ON FUNCTION public.class_analysis_leaderboard(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.class_analysis_leaderboard(uuid, uuid) TO authenticated;