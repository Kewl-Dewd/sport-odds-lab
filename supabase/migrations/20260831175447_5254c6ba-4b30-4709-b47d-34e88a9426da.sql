-- Coursework items for a class ("course in a box")
CREATE TABLE public.class_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'lesson',
  title text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  url text,
  source_rg_lesson_id uuid REFERENCES public.rg_lessons(id) ON DELETE SET NULL,
  requires_ack boolean NOT NULL DEFAULT false,
  due_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_lessons TO authenticated;
GRANT ALL ON public.class_lessons TO service_role;
ALTER TABLE public.class_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage class coursework"
  ON public.class_lessons FOR ALL TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_platform_admin())
  WITH CHECK (public.is_class_owner(class_id) OR public.is_platform_admin());

CREATE POLICY "Members read published coursework"
  ON public.class_lessons FOR SELECT TO authenticated
  USING (is_published AND public.is_class_member(class_id));

CREATE TRIGGER class_lessons_set_updated_at
  BEFORE UPDATE ON public.class_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX class_lessons_class_idx ON public.class_lessons(class_id, sort_order);

-- Student progress on coursework
CREATE TABLE public.class_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.class_lessons(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_lesson_progress TO authenticated;
GRANT ALL ON public.class_lesson_progress TO service_role;
ALTER TABLE public.class_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own progress"
  ON public.class_lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_class_member(class_id));

CREATE POLICY "Owners read class progress"
  ON public.class_lesson_progress FOR SELECT TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_platform_admin());

CREATE TRIGGER class_lesson_progress_set_updated_at
  BEFORE UPDATE ON public.class_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Email invitations
CREATE TABLE public.class_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid,
  status text NOT NULL DEFAULT 'sent',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_invites TO authenticated;
GRANT ALL ON public.class_invites TO service_role;
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage class invites"
  ON public.class_invites FOR ALL TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_platform_admin())
  WITH CHECK (public.is_class_owner(class_id) OR public.is_platform_admin());

CREATE POLICY "Invitee reads own invite"
  ON public.class_invites FOR SELECT TO authenticated
  USING (lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), '')));

CREATE TRIGGER class_invites_set_updated_at
  BEFORE UPDATE ON public.class_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();