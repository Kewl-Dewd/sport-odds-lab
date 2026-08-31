ALTER TABLE public.class_lessons
  ADD COLUMN IF NOT EXISTS topic text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS curriculum_key text;

CREATE INDEX IF NOT EXISTS class_lessons_topic_idx ON public.class_lessons (class_id, topic, sort_order);