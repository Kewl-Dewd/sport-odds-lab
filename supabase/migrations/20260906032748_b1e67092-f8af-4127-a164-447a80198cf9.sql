-- 1. Open bets were previously stored with the placeholder status 'executed',
--    which every aggregate treated as "settled with a $0 payout" (a loss).
UPDATE public.bets
SET status = 'open'
WHERE status = 'executed' AND settled_at IS NULL AND payout IS NULL;

-- 2. Book summary: treat 'executed' as open too, so nothing un-graded is
--    ever counted as house profit.
CREATE OR REPLACE FUNCTION public.class_book_summary(_class_id uuid)
 RETURNS TABLE(handle numeric, open_stake numeric, open_liability numeric, settled_stake numeric, paid_out numeric, book_pnl numeric, hold_pct numeric, bet_count bigint, bettor_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH b AS (
    SELECT * FROM public.bets
    WHERE class_id = _class_id
      AND (public.is_class_owner(_class_id) OR public.is_class_member(_class_id) OR public.is_platform_admin())
  )
  SELECT
    COALESCE(SUM(stake), 0)::numeric AS handle,
    COALESCE(SUM(stake) FILTER (WHERE status IN ('open','executed')), 0)::numeric AS open_stake,
    COALESCE(SUM(GREATEST(COALESCE(potential_payout, stake) - stake, 0)) FILTER (WHERE status IN ('open','executed')), 0)::numeric AS open_liability,
    COALESCE(SUM(stake) FILTER (WHERE status NOT IN ('open','executed')), 0)::numeric AS settled_stake,
    COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status NOT IN ('open','executed')), 0)::numeric AS paid_out,
    (COALESCE(SUM(stake) FILTER (WHERE status NOT IN ('open','executed')), 0) - COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status NOT IN ('open','executed')), 0))::numeric AS book_pnl,
    CASE WHEN COALESCE(SUM(stake) FILTER (WHERE status NOT IN ('open','executed')), 0) > 0
      THEN ((COALESCE(SUM(stake) FILTER (WHERE status NOT IN ('open','executed')), 0) - COALESCE(SUM(COALESCE(payout, 0)) FILTER (WHERE status NOT IN ('open','executed')), 0))
            / SUM(stake) FILTER (WHERE status NOT IN ('open','executed')) * 100)::numeric
      ELSE 0::numeric END AS hold_pct,
    COUNT(*)::bigint AS bet_count,
    COUNT(DISTINCT user_id)::bigint AS bettor_count
  FROM b;
$function$;

REVOKE EXECUTE ON FUNCTION public.class_book_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.class_book_summary(uuid) TO authenticated;

-- 3. Per-student standings for a class, derived from the durable bet record
--    so every surface (dashboard, my bets, leaderboard) agrees.
CREATE OR REPLACE FUNCTION public.class_leaderboard(_class_id uuid)
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   starting_bankroll numeric,
   bet_count bigint,
   staked numeric,
   open_stake numeric,
   open_liability numeric,
   settled_stake numeric,
   returned numeric,
   wins bigint,
   settled_count bigint,
   bankroll numeric,
   net_pnl numeric,
   roi_pct numeric
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH allowed AS (
    SELECT (public.is_class_owner(_class_id)
            OR public.is_class_member(_class_id)
            OR public.is_platform_admin()) AS ok
  ),
  members AS (
    SELECT cm.user_id, c.starting_bankroll
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.class_id = _class_id AND (SELECT ok FROM allowed)
  ),
  b AS (
    SELECT * FROM public.bets
    WHERE class_id = _class_id AND (SELECT ok FROM allowed)
  )
  SELECT
    m.user_id,
    COALESCE(NULLIF(p.display_name, ''), split_part(COALESCE(p.email, ''), '@', 1), 'Student') AS display_name,
    m.starting_bankroll,
    COUNT(b.id)::bigint AS bet_count,
    COALESCE(SUM(b.stake), 0)::numeric AS staked,
    COALESCE(SUM(b.stake) FILTER (WHERE b.status IN ('open','executed')), 0)::numeric AS open_stake,
    COALESCE(SUM(GREATEST(COALESCE(b.potential_payout, b.stake) - b.stake, 0)) FILTER (WHERE b.status IN ('open','executed')), 0)::numeric AS open_liability,
    COALESCE(SUM(b.stake) FILTER (WHERE b.status NOT IN ('open','executed')), 0)::numeric AS settled_stake,
    COALESCE(SUM(COALESCE(b.payout, 0)) FILTER (WHERE b.status NOT IN ('open','executed')), 0)::numeric AS returned,
    COUNT(*) FILTER (WHERE b.status = 'won')::bigint AS wins,
    COUNT(*) FILTER (WHERE b.id IS NOT NULL AND b.status NOT IN ('open','executed'))::bigint AS settled_count,
    (m.starting_bankroll
      - COALESCE(SUM(b.stake), 0)
      + COALESCE(SUM(COALESCE(b.payout, 0)) FILTER (WHERE b.status NOT IN ('open','executed')), 0))::numeric AS bankroll,
    (COALESCE(SUM(COALESCE(b.payout, 0)) FILTER (WHERE b.status NOT IN ('open','executed')), 0)
      - COALESCE(SUM(b.stake), 0))::numeric AS net_pnl,
    CASE WHEN m.starting_bankroll > 0 THEN
      ((COALESCE(SUM(COALESCE(b.payout, 0)) FILTER (WHERE b.status NOT IN ('open','executed')), 0)
        - COALESCE(SUM(b.stake), 0)) / m.starting_bankroll * 100)::numeric
      ELSE 0::numeric END AS roi_pct
  FROM members m
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  LEFT JOIN b ON b.user_id = m.user_id
  GROUP BY m.user_id, p.display_name, p.email, m.starting_bankroll;
$function$;

REVOKE EXECUTE ON FUNCTION public.class_leaderboard(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.class_leaderboard(uuid) TO authenticated;