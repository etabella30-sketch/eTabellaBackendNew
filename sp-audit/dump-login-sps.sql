-- Dump login-path SPs from Vultr dev DB
-- Used to repair a local DB that's missing et_signin etc.
\pset format unaligned
\pset tuples_only on
\pset footer off

SELECT
  pg_get_functiondef(p.oid) || E';\n'
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN (
  'et_signin', 'et_signin_responce', 'et_signout',
  'et_validate', 'et_user_info', 'et_forgotpassword',
  'et_log_insert', 'et_users_jwt'
)
  AND n.nspname = 'public'
ORDER BY p.proname;
