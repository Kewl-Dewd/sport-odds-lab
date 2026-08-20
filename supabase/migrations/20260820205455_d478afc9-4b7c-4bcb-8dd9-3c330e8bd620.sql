
REVOKE EXECUTE ON FUNCTION public.redeem_access_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_user_access(uuid, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_access(uuid, integer, text) TO authenticated;
