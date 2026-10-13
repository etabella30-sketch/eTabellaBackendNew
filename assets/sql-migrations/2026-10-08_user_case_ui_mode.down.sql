-- Roll back the matching services/FE first. Keep per-case preferences for a future re-release.
-- No account preferences, ownership, sharing or case records are rewritten.
BEGIN;
DROP FUNCTION IF EXISTS public.et_user_case_uimode_get(json, refcursor);
DROP FUNCTION IF EXISTS public.et_user_case_uimode_set(json, refcursor);
-- UserCaseUiMode is intentionally retained; dropping it would destroy saved per-case choices.
COMMIT;
