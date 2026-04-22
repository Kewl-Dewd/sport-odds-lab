-- Activity log: every meaningful action a user takes
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can delete activity"
  ON public.user_activity FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

-- Sessions: track sign-in / sign-out windows for time-on-site
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users and instructors can view sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can delete sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

-- Instructors can also see all profiles & roles (broaden existing policies)
CREATE POLICY "Instructors can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can manage roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

-- Aggregated user stats view (instructor-only)
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role public.app_role,
  joined_at timestamptz,
  total_actions bigint,
  total_seconds_on_site bigint,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = p.user_id ORDER BY ur.created_at LIMIT 1) AS role,
    p.created_at AS joined_at,
    COALESCE((SELECT COUNT(*) FROM public.user_activity ua WHERE ua.user_id = p.user_id), 0) AS total_actions,
    COALESCE((
      SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(s.ended_at, s.last_seen_at) - s.started_at)))::bigint
      FROM public.user_sessions s
      WHERE s.user_id = p.user_id
    ), 0) AS total_seconds_on_site,
    (SELECT MAX(s.last_seen_at) FROM public.user_sessions s WHERE s.user_id = p.user_id) AS last_seen_at
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'instructor');
$$;