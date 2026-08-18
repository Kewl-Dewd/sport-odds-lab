-- Three-tier access model for commercial multi-institution use:
--   platform admin  → sees every instructor, class, and student
--   instructor      → owns class sections; sees only their own students
--   student         → belongs to one or more classes
--
-- Platform admin is a SYSTEM role, deliberately kept out of the
-- app_role enum (which describes a person's role inside a classroom).
-- A dedicated table also avoids the ALTER TYPE ... ADD VALUE
-- transaction restrictions that make enum changes awkward to migrate.
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
$$;

-- Only platform admins can see or change the admin list itself.
CREATE POLICY "Platform admins view the admin list"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage the admin list"
  ON public.platform_admins FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Does the current user teach _user_id in any class they own?
CREATE OR REPLACE FUNCTION public.teaches_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.user_id = _user_id AND c.owner_id = auth.uid()
  );
$$;

-- Does the current user share any class with _user_id?
CREATE OR REPLACE FUNCTION public.shares_class_with(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members mine
    JOIN public.class_members theirs ON theirs.class_id = mine.class_id
    WHERE mine.user_id = auth.uid() AND theirs.user_id = _user_id
  );
$$;

-- Seed the founding platform admin. Idempotent, and a no-op if the
-- account does not exist yet (it is granted on first signup instead —
-- see handle_new_user below).
INSERT INTO public.platform_admins (user_id, note)
SELECT id, 'Founding administrator'
FROM auth.users
WHERE lower(email) = 'kurtspady@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Make sure the founding admin also holds the instructor classroom role.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'instructor'::public.app_role
FROM auth.users
WHERE lower(email) = 'kurtspady@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- New signups are students by default. The founding admin address still
-- self-provisions so the account can be recreated from scratch; every
-- other instructor is promoted deliberately from the admin console.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF lower(NEW.email) = 'kurtspady@gmail.com' THEN
    assigned_role := 'instructor';
    INSERT INTO public.platform_admins (user_id, note)
    VALUES (NEW.id, 'Founding administrator')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    assigned_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

-- ── Platform-admin visibility across tenants ──────────────────────

CREATE POLICY "Platform admins view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all memberships"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all journal entries"
  ON public.bet_journal FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ── Close cross-tenant leaks in the single-class-era policies ─────
-- Each of these previously granted ANY instructor visibility into
-- EVERY user's data, which is correct for one classroom and wrong the
-- moment a second institution exists.

DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
CREATE POLICY "Activity visible to self, own instructor, platform admin"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.teaches_user(user_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "Instructors can delete activity" ON public.user_activity;
CREATE POLICY "Own instructor or platform admin can delete activity"
  ON public.user_activity FOR DELETE
  TO authenticated
  USING (public.teaches_user(user_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "Users and instructors can view sessions" ON public.user_sessions;
CREATE POLICY "Sessions visible to self, own instructor, platform admin"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.teaches_user(user_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "Instructors can delete sessions" ON public.user_sessions;
CREATE POLICY "Own instructor or platform admin can delete sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (public.teaches_user(user_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "Acks visible to owner and instructors" ON public.rg_acknowledgments;
CREATE POLICY "Acks visible to self, own instructor, platform admin"
  ON public.rg_acknowledgments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.teaches_user(user_id)
    OR public.is_platform_admin()
  );

-- Responsible-gambling lessons are product content, not per-class
-- content: only the platform owner edits them.
DROP POLICY IF EXISTS "Instructors manage lessons" ON public.rg_lessons;
DROP POLICY IF EXISTS "Instructors update lessons" ON public.rg_lessons;
DROP POLICY IF EXISTS "Instructors delete lessons" ON public.rg_lessons;
DROP POLICY IF EXISTS "Published lessons readable by all authenticated" ON public.rg_lessons;

CREATE POLICY "Published lessons readable by all authenticated"
  ON public.rg_lessons FOR SELECT
  TO authenticated
  USING (is_published OR public.is_platform_admin());

CREATE POLICY "Platform admins manage lessons"
  ON public.rg_lessons FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Profiles carry student names and emails. Previously every signed-in
-- user could read every profile platform-wide.
DROP POLICY IF EXISTS "Profiles are viewable by everyone authenticated" ON public.profiles;
CREATE POLICY "Profiles visible to self, classmates, instructor, admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_platform_admin()
    OR public.teaches_user(user_id)
    OR public.shares_class_with(user_id)
  );

DROP POLICY IF EXISTS "Instructors can delete profiles" ON public.profiles;
CREATE POLICY "Platform admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- Role changes are a platform-admin action, not something one
-- instructor can perform on another tenant's users.
DROP POLICY IF EXISTS "Instructors can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Instructors can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Instructors can delete roles" ON public.user_roles;

CREATE POLICY "Platform admins insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- ── Scoped rewrite of the instructor stats function ───────────────
-- Platform admin sees everyone; an instructor sees only the students
-- enrolled in classes they own (plus themselves).
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
  WHERE
    public.is_platform_admin()
    OR p.user_id = auth.uid()
    OR (public.has_role(auth.uid(), 'instructor') AND public.teaches_user(p.user_id));
$$;

-- ── Platform-wide directory for the admin console ─────────────────
-- Returns one row per user with their role and teaching/enrollment
-- counts. Platform admins only; anyone else gets an empty set.
CREATE OR REPLACE FUNCTION public.platform_directory()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role public.app_role,
  is_admin boolean,
  joined_at timestamptz,
  classes_owned bigint,
  classes_joined bigint,
  bets_placed bigint
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
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p.user_id) AS is_admin,
    p.created_at AS joined_at,
    (SELECT COUNT(*) FROM public.classes c WHERE c.owner_id = p.user_id) AS classes_owned,
    (SELECT COUNT(*) FROM public.class_members cm WHERE cm.user_id = p.user_id) AS classes_joined,
    (SELECT COUNT(*) FROM public.bets b WHERE b.user_id = p.user_id) AS bets_placed
  FROM public.profiles p
  WHERE public.is_platform_admin()
  ORDER BY p.created_at DESC;
$$;

-- Every class on the platform with owner and enrollment counts.
CREATE OR REPLACE FUNCTION public.platform_classes()
RETURNS TABLE (
  class_id uuid,
  name text,
  term text,
  owner_id uuid,
  owner_email text,
  owner_name text,
  join_code text,
  is_archived boolean,
  student_count bigint,
  bet_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS class_id,
    c.name,
    c.term,
    c.owner_id,
    op.email AS owner_email,
    op.display_name AS owner_name,
    c.join_code,
    c.is_archived,
    (SELECT COUNT(*) FROM public.class_members cm WHERE cm.class_id = c.id) AS student_count,
    (SELECT COUNT(*) FROM public.bets b WHERE b.class_id = c.id) AS bet_count,
    c.created_at
  FROM public.classes c
  LEFT JOIN public.profiles op ON op.user_id = c.owner_id
  WHERE public.is_platform_admin()
  ORDER BY c.created_at DESC;
$$;

-- Promote / demote an instructor and grant or revoke platform admin.
-- Guards against an admin removing their own admin rights.
CREATE OR REPLACE FUNCTION public.set_user_access(
  _user_id uuid,
  _role public.app_role,
  _platform_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Platform administrator access required');
  END IF;

  IF _user_id = auth.uid() AND NOT _platform_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You cannot remove your own administrator access');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _platform_admin THEN
    INSERT INTO public.platform_admins (user_id, note)
    VALUES (_user_id, 'Granted from admin console')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.platform_admins WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;