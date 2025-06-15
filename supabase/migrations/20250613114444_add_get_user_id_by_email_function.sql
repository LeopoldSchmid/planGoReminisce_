-- supabase/migrations/20250613114444_add_get_user_id_by_email_function.sql

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_id_result UUID;
BEGIN
  SELECT id INTO user_id_result FROM auth.users WHERE email = user_email;
  RETURN user_id_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;