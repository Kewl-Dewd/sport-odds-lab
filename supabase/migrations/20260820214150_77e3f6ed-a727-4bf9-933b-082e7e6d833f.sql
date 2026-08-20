ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS allowed_leagues text[],
  ADD COLUMN IF NOT EXISTS market_publish_mode text NOT NULL DEFAULT 'both';

CREATE TABLE IF NOT EXISTS public.class_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'round',
  description text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  starting_bankroll numeric NOT NULL DEFAULT 1000,
  is_contest boolean NOT NULL DEFAULT false,
  scoring text NOT NULL DEFAULT 'profit',
  max_stake_per_bet numeric,
  max_bets integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_rounds_window_valid CHECK (ends_at > starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_rounds TO authenticated;
GRANT ALL ON public.class_rounds TO service_role;
ALTER TABLE public.class_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class owners manage rounds"
  ON public.class_rounds FOR ALL TO authenticated
  USING (public.is_class_owner(class_id))
  WITH CHECK (public.is_class_owner(class_id));

CREATE POLICY "Class members view rounds"
  ON public.class_rounds FOR SELECT TO authenticated
  USING (public.is_class_member(class_id) OR public.is_platform_admin());

CREATE TRIGGER class_rounds_set_updated_at
  BEFORE UPDATE ON public.class_rounds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS class_rounds_class_idx ON public.class_rounds(class_id);

CREATE TABLE IF NOT EXISTS public.round_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.class_rounds(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bankroll numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.round_entries TO authenticated;
GRANT ALL ON public.round_entries TO service_role;
ALTER TABLE public.round_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class owners manage round entries"
  ON public.round_entries FOR ALL TO authenticated
  USING (public.is_class_owner(class_id))
  WITH CHECK (public.is_class_owner(class_id));

CREATE POLICY "Members view round entries"
  ON public.round_entries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_class_member(class_id) OR public.is_platform_admin());

CREATE POLICY "Students enter rounds themselves"
  ON public.round_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_class_member(class_id));

CREATE TRIGGER round_entries_set_updated_at
  BEFORE UPDATE ON public.round_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.published_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.class_rounds(id) ON DELETE SET NULL,
  external_event_id text NOT NULL,
  sport_slug text NOT NULL DEFAULT '',
  sport_name text NOT NULL DEFAULT '',
  league_slug text NOT NULL DEFAULT '',
  league_name text NOT NULL DEFAULT '',
  title text NOT NULL,
  home_team text NOT NULL DEFAULT '',
  away_team text NOT NULL DEFAULT '',
  commence_at timestamptz,
  bet_kinds text[] NOT NULL DEFAULT ARRAY['moneyline']::text[],
  status text NOT NULL DEFAULT 'published',
  note text NOT NULL DEFAULT '',
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, external_event_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_markets TO authenticated;
GRANT ALL ON public.published_markets TO service_role;
ALTER TABLE public.published_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class owners manage published markets"
  ON public.published_markets FOR ALL TO authenticated
  USING (public.is_class_owner(class_id))
  WITH CHECK (public.is_class_owner(class_id));

CREATE POLICY "Class members view published markets"
  ON public.published_markets FOR SELECT TO authenticated
  USING ((public.is_class_member(class_id) AND status = 'published') OR public.is_platform_admin());

CREATE TRIGGER published_markets_set_updated_at
  BEFORE UPDATE ON public.published_markets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS published_markets_class_idx ON public.published_markets(class_id);
CREATE INDEX IF NOT EXISTS published_markets_round_idx ON public.published_markets(round_id);

ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS round_id uuid REFERENCES public.class_rounds(id) ON DELETE SET NULL;