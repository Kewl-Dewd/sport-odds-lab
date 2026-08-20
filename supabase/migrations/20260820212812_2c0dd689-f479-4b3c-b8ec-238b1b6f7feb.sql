CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
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
    requested_role := lower(NEW.raw_user_meta_data->>'role');
    IF requested_role IN ('instructor', 'student') THEN
      assigned_role := requested_role::public.app_role;
    ELSE
      assigned_role := 'student';
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;