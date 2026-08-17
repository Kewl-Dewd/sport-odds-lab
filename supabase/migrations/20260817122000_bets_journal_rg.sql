-- Persisted bet records, the gradeable bet journal, and the
-- responsible-gambling module (lessons + acknowledgment checkpoints).

-- Durable record of every bet/trade placed in any mode. Ids are the
-- client-generated engine ids so the sync layer can upsert idempotently.
CREATE TABLE public.bets (
  id text PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('prediction', 'sportsbook', 'racetrack')),
  market_id text NOT NULL,
  market_title text NOT NULL DEFAULT '',
  selection text NOT NULL DEFAULT '',
  bet_type text NOT NULL DEFAULT '',
  stake numeric NOT NULL CHECK (stake >= 0),
  odds_decimal numeric,
  potential_payout numeric,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost', 'push', 'void', 'executed')),
  payout numeric,
  closing_odds numeric, -- filled at market close when available, for CLV
  placed_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  raw jsonb
);

CREATE INDEX idx_bets_user_id ON public.bets (user_id);
CREATE INDEX idx_bets_class_id ON public.bets (class_id);
CREATE INDEX idx_bets_placed_at ON public.bets (placed_at DESC);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own bets"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own bets"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Bets visible to owner and class instructor"
  ON public.bets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_class_owner(class_id));

CREATE POLICY "Class instructor can delete bets (class reset)"
  ON public.bets FOR DELETE
  TO authenticated
  USING (public.is_class_owner(class_id));

-- The gradeable artifact: one journal entry per bet, with rationale
-- required and an optional post-settlement reflection.
CREATE TABLE public.bet_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id text NOT NULL UNIQUE REFERENCES public.bets(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rationale text NOT NULL CHECK (char_length(rationale) > 0),
  confidence integer CHECK (confidence BETWEEN 1 AND 5),
  outcome_reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bet_journal_user_id ON public.bet_journal (user_id);
CREATE INDEX idx_bet_journal_class_id ON public.bet_journal (class_id);

CREATE TRIGGER bet_journal_set_updated_at
  BEFORE UPDATE ON public.bet_journal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bet_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own journal entries"
  ON public.bet_journal FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Class instructor can read journal entries"
  ON public.bet_journal FOR SELECT
  TO authenticated
  USING (public.is_class_owner(class_id));

-- Responsible-gambling module: short lessons with acknowledgment
-- checkpoints. Content is instructor-supplied; these tables are the
-- structure plus starter placeholders.
CREATE TABLE public.rg_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  requires_ack boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER rg_lessons_set_updated_at
  BEFORE UPDATE ON public.rg_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rg_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published lessons readable by all authenticated"
  ON public.rg_lessons FOR SELECT
  TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors manage lessons"
  ON public.rg_lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors update lessons"
  ON public.rg_lessons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors delete lessons"
  ON public.rg_lessons FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

CREATE TABLE public.rg_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.rg_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);

CREATE INDEX idx_rg_acknowledgments_user_id ON public.rg_acknowledgments (user_id);

ALTER TABLE public.rg_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users record their own acknowledgments"
  ON public.rg_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Acks visible to owner and instructors"
  ON public.rg_acknowledgments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'instructor'));

-- Starter lessons. Placeholder copy — the instructor replaces body_md
-- with their RGC-aligned course content.
INSERT INTO public.rg_lessons (slug, title, body_md, sort_order) VALUES
(
  'house-money',
  'This Is Not Real Money',
  E'Everything you wager in this course is simulated house money. No deposits, no withdrawals, no real-world value — ever.\n\nThat framing matters: the point of this lab is to study how betting markets price information, not to practice gambling. Treat your bankroll like lab equipment, not like a wallet.\n\nKey ideas:\n- Your balance is a score, not savings. Losing it costs you nothing but pride.\n- Decisions here should be driven by analysis you can defend in your journal, not by the thrill of the sweat.\n- If you notice yourself wanting the real-money version of this feeling, that is worth paying attention to — see the "If Gambling Stops Being a Game" lesson.',
  1
),
(
  'house-edge',
  'The House Always Has an Edge',
  E'Every real sportsbook builds a margin — the vig — into its odds. Add up the implied probabilities of every outcome of a game at your favorite book: they will sum to more than 100%. That extra is the operator''s cut.\n\nWhat this means in practice:\n- A bettor breaking even on picks still loses money over time to the vig.\n- "Winning" long-term requires beating the closing line by more than the margin — something even professionals rarely sustain.\n- The industry is profitable because, in aggregate, customers lose. That is the business model, not an accident.',
  2
),
(
  'chasing-losses',
  'Chasing Losses',
  E'The single most reliable warning sign of gambling harm is chasing: increasing stakes to win back what was lost.\n\nIn this course you may feel the pull of it even with fake money — a bad week on the leaderboard, a "sure thing" to get back to even. Notice it. That pull is the mechanism, and feeling it in a safe environment is part of the curriculum.\n\nIn your journal, flag any bet where recovering a previous loss was part of your reasoning. Those entries will be some of the most valuable material for class discussion.',
  3
),
(
  'getting-help',
  'If Gambling Stops Being a Game',
  E'This course uses simulated money, but real gambling is widely available and heavily marketed to people your age.\n\nSigns worth taking seriously — in yourself or a friend:\n- Betting more than planned, or with money needed for essentials\n- Hiding gambling activity from people close to you\n- Chasing losses, or feeling restless when not betting\n- Gambling to escape stress or low mood\n\nHelp is free and confidential. In Canada: your provincial problem-gambling helpline (in Alberta: 1-866-332-2322, 24/7). Elsewhere, your instructor will provide local resources.\n\nAsking for help early is the norm, not the exception.',
  4
);
