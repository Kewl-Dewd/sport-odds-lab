ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS quiz_grading text NOT NULL DEFAULT 'scored';

CREATE TABLE public.class_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quiz_key text NOT NULL,
  score numeric NOT NULL,
  correct integer NOT NULL,
  total integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX class_quiz_attempts_class_user_idx ON public.class_quiz_attempts(class_id, user_id);

GRANT SELECT, INSERT ON public.class_quiz_attempts TO authenticated;
GRANT ALL ON public.class_quiz_attempts TO service_role;
ALTER TABLE public.class_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own quiz attempts" ON public.class_quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.is_class_member(class_id) OR public.is_class_owner(class_id)));
CREATE POLICY "Students read own quiz attempts" ON public.class_quiz_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Instructors read class quiz attempts" ON public.class_quiz_attempts
  FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_platform_admin());

UPDATE public.class_lessons SET topic = 'using-the-app' WHERE topic = 'intro';
UPDATE public.class_lessons SET topic = 'canadian-industry' WHERE topic = 'alberta-law';