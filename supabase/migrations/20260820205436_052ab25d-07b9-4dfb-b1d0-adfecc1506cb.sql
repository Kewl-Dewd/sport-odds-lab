
CREATE TABLE public.user_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'free',
  source text NOT NULL DEFAULT 'none',
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_session_id text,
  last_payment_at timestamptz,
  amount_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_access TO authenticated;
GRANT ALL ON public.user_access TO service_role;
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access"
  ON public.user_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin() OR public.teaches_user(user_id));

CREATE POLICY "Platform admins manage access"
  ON public.user_access FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TRIGGER user_access_set_updated_at
  BEFORE UPDATE ON public.user_access
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seats_total integer,
  seats_used integer NOT NULL DEFAULT 0,
  grant_days integer NOT NULL DEFAULT 365,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access codes"
  ON public.access_codes FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY "Owners can view their access codes"
  ON public.access_codes FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR owner_id = auth.uid() OR created_by = auth.uid());

CREATE TRIGGER access_codes_set_updated_at
  BEFORE UPDATE ON public.access_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

GRANT SELECT ON public.code_redemptions TO authenticated;
GRANT ALL ON public.code_redemptions TO service_role;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redemptions visible to self, code owner, admin"
  ON public.code_redemptions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.access_codes ac WHERE ac.id = code_id AND (ac.owner_id = auth.uid() OR ac.created_by = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ac public.access_codes;
  new_until timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT * INTO ac FROM public.access_codes
  WHERE upper(code) = upper(trim(_code)) AND is_active
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or inactive code');
  END IF;

  IF ac.expires_at IS NOT NULL AND ac.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This code has expired');
  END IF;

  IF EXISTS (SELECT 1 FROM public.code_redemptions r WHERE r.code_id = ac.id AND r.user_id = auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You already redeemed this code');
  END IF;

  IF ac.seats_total IS NOT NULL AND ac.seats_used >= ac.seats_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No seats left on this code');
  END IF;

  new_until := now() + (ac.grant_days || ' days')::interval;

  INSERT INTO public.code_redemptions (code_id, user_id, granted_until)
  VALUES (ac.id, auth.uid(), new_until);

  UPDATE public.access_codes SET seats_used = seats_used + 1 WHERE id = ac.id;

  INSERT INTO public.user_access (user_id, status, source, expires_at)
  VALUES (auth.uid(), 'active', 'code', new_until)
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        source = 'code',
        expires_at = GREATEST(COALESCE(public.user_access.expires_at, now()), EXCLUDED.expires_at),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'expires_at', new_until, 'label', ac.label);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_user_access(_user_id uuid, _days integer DEFAULT 365, _source text DEFAULT 'comp')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_until timestamptz;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Platform administrator access required');
  END IF;

  IF _days <= 0 THEN
    UPDATE public.user_access SET status = 'free', source = 'none', expires_at = NULL, updated_at = now()
    WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'revoked', true);
  END IF;

  new_until := now() + (_days || ' days')::interval;

  INSERT INTO public.user_access (user_id, status, source, expires_at)
  VALUES (_user_id, 'active', _source, new_until)
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active', source = _source,
        expires_at = GREATEST(COALESCE(public.user_access.expires_at, now()), EXCLUDED.expires_at),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'expires_at', new_until);
END;
$$;
