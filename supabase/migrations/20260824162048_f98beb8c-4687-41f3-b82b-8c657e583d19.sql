CREATE OR REPLACE FUNCTION public.class_book_summary(_class_id uuid)
RETURNS TABLE(
  handle numeric,
  open_stake numeric,
  open_liability numeric,
  settled_stake numeric,
  paid_out numeric,
  book_pnl numeric,
  hold_pct numeric,
  bet_count bigint,
  bettor_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH b AS (
    SELECT * FROM public.bets
    WHERE class_id = _class_id
      AND (public.is_class_owner(_class_id) OR public.is_class_member(_class_id) OR public.is_platform_admin())
  )
  SELECT
    COALESCE(SUM(stake), 0)::numeric AS handle,
    COALESCE(SUM(stake) FILTER (WHERE status = 'open'), 0)::numeric AS open_stake,
    COALESCE(SUM(GREATEST(COALESCE(potential_payout, stake) - stake, 0)) FILTER (WHERE status = 'open'), 0)::numeric AS open_liability,
    COALESCE(SUM(stake) FILTER (WHERE status <> 'open'), 0)::numeric AS settled_stake,
    COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status <> 'open'), 0)::numeric AS paid_out,
    (COALESCE(SUM(stake) FILTER (WHERE status <> 'open'), 0) - COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status <> 'open'), 0))::numeric AS book_pnl,
    CASE WHEN COALESCE(SUM(stake) FILTER (WHERE status <> 'open'), 0) > 0
      THEN ((COALESCE(SUM(stake) FILTER (WHERE status <> 'open'), 0) - COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status <> 'open'), 0))
            / SUM(stake) FILTER (WHERE status <> 'open') * 100)::numeric
      ELSE 0::numeric END AS hold_pct,
    COUNT(*)::bigint AS bet_count,
    COUNT(DISTINCT user_id)::bigint AS bettor_count
  FROM b;
$$;

REVOKE EXECUTE ON FUNCTION public.class_book_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_book_summary(uuid) TO authenticated;