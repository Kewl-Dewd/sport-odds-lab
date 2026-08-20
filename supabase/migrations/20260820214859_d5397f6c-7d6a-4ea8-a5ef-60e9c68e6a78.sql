
-- 1. Lock privileged functions away from anonymous callers
REVOKE EXECUTE ON FUNCTION public.get_user_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_class_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_class_owner(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.join_class_by_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_classes() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_directory() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_access_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grant_user_access(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_user_access(uuid, public.app_role, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shares_class_with(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.teaches_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_join_code() FROM anon, public;

-- Trigger-only routine: no client role should call it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public;

-- Keep the routines the signed-in app and RLS policies actually need
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_access(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_access(uuid, public.app_role, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_class_with(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_user(uuid) TO authenticated;

-- 2. Stop every signed-in user from reading everyone's roles
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

CREATE POLICY "Users view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_platform_admin()
  OR public.teaches_user(user_id)
);
