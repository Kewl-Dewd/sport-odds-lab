ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS active_seconds integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_user_stats()
 RETURNS TABLE(user_id uuid, email text, display_name text, role app_role, joined_at timestamp with time zone, total_actions bigint, total_seconds_on_site bigint, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = p.user_id ORDER BY ur.created_at LIMIT 1) AS role,
    p.created_at AS joined_at,
    COALESCE((SELECT COUNT(*) FROM public.user_activity ua WHERE ua.user_id = p.user_id), 0) AS total_actions,
    COALESCE((
      SELECT SUM(
        CASE
          WHEN s.active_seconds > 0 THEN s.active_seconds
          -- Legacy sessions recorded before active-time tracking: fall back to
          -- the sign-in window, capped at 2h so an abandoned tab can't skew it.
          ELSE LEAST(
            EXTRACT(EPOCH FROM (COALESCE(s.ended_at, s.last_seen_at) - s.started_at)),
            7200
          )
        END
      )::bigint
      FROM public.user_sessions s
      WHERE s.user_id = p.user_id
    ), 0) AS total_seconds_on_site,
    (SELECT MAX(s.last_seen_at) FROM public.user_sessions s WHERE s.user_id = p.user_id) AS last_seen_at
  FROM public.profiles p
  WHERE
    public.is_platform_admin()
    OR p.user_id = auth.uid()
    OR (public.has_role(auth.uid(), 'instructor') AND public.teaches_user(p.user_id));
$function$;