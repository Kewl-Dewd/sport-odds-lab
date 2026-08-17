-- Multi-tenant core: class sections owned by instructors, student
-- memberships via join codes, and per-class configuration.
-- Data isolation is enforced with RLS keyed off two security-definer
-- helpers (is_class_owner / is_class_member) to avoid policy recursion.

-- Join codes: 6 chars, unambiguous alphabet (no 0/O/1/I).
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1),
    ''
  )
  FROM generate_series(1, 6);
$$;

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  term text,
  description text NOT NULL DEFAULT '',
  join_code text NOT NULL UNIQUE DEFAULT public.generate_join_code(),
  allow_self_join boolean NOT NULL DEFAULT true,
  starting_bankroll numeric NOT NULL DEFAULT 1000 CHECK (starting_bankroll > 0),
  max_stake_per_bet numeric CHECK (max_stake_per_bet IS NULL OR max_stake_per_bet > 0),
  max_bets_per_day integer CHECK (max_bets_per_day IS NULL OR max_bets_per_day > 0),
  allowed_sports text[],      -- NULL = all sports allowed
  allowed_bet_kinds text[],   -- NULL = all kinds (moneyline/spread/total/...)
  require_journal boolean NOT NULL DEFAULT true,
  semester_start date,
  semester_end date,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_owner_id ON public.classes (owner_id);

CREATE TRIGGER classes_set_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'student' CHECK (member_role IN ('student', 'ta')),
  -- Bankroll granted at join time (snapshot of the class setting).
  bankroll numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

CREATE INDEX idx_class_members_class_id ON public.class_members (class_id);
CREATE INDEX idx_class_members_user_id ON public.class_members (user_id);

-- Security-definer helpers so policies never query RLS-protected tables
-- from within their own policy checks.
CREATE OR REPLACE FUNCTION public.is_class_owner(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = auth.uid()
  );
$$;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage their own classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can view their classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.is_class_member(id));

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members visible to self, classmates, and class owner"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_class_owner(class_id)
    OR public.is_class_member(class_id)
  );

CREATE POLICY "Class owners can add members"
  ON public.class_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_class_owner(class_id));

CREATE POLICY "Class owners can update members"
  ON public.class_members FOR UPDATE
  TO authenticated
  USING (public.is_class_owner(class_id));

CREATE POLICY "Owners can remove members; students can leave"
  ON public.class_members FOR DELETE
  TO authenticated
  USING (public.is_class_owner(class_id) OR user_id = auth.uid());

-- Students join with a code; runs as definer so they never need SELECT
-- on classes they aren't in yet.
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.classes;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT * INTO c
  FROM public.classes
  WHERE upper(join_code) = upper(trim(_code))
    AND NOT is_archived
    AND allow_self_join;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or inactive join code');
  END IF;

  IF c.semester_end IS NOT NULL AND c.semester_end < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This class has ended');
  END IF;

  INSERT INTO public.class_members (class_id, user_id, bankroll)
  VALUES (c.id, auth.uid(), c.starting_bankroll)
  ON CONFLICT (class_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'class_id', c.id, 'class_name', c.name);
END;
$$;
