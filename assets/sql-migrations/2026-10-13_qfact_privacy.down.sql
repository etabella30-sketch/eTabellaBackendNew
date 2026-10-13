-- Reverses only this migration; does not change any marks, share rows or views.
BEGIN;
DROP TRIGGER IF EXISTS qfact_conversion_private ON public."FactMaster";
DROP FUNCTION IF EXISTS public.et_qfact_conversion_private();
DROP TRIGGER IF EXISTS qfact_view_private ON public."WorkspaceView";
DROP TRIGGER IF EXISTS qfact_share_private ON public."FMShared";
DROP FUNCTION IF EXISTS public.et_qfact_view_private();
DROP FUNCTION IF EXISTS public.et_qfact_view_scope(jsonb,boolean);
DROP FUNCTION IF EXISTS public.et_qfact_share_private();
COMMIT;
