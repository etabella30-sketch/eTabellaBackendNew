-- Rollback of 2026-08-17_workspace_saved_views.up.sql.
--
-- Drops the saved-view SPs and the table. Everything a user saved goes with
-- it — take a copy of "WorkspaceView" first if the rows still matter.

BEGIN;

DO $guard$
BEGIN
    IF current_database() NOT IN ('etabella_tech_uuid', 'etabella.com.uuid') THEN
        RAISE EXCEPTION 'Wrong database: % — this rollback targets etabella_tech_uuid (dev) / etabella.com.uuid (prod)', current_database();
    END IF;
END $guard$;

DROP FUNCTION IF EXISTS public.et_workspace_view_delete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_view_save(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_view_list(json, refcursor);

-- Schema-qualified: the connecting role's search_path is `sym, public`.
DROP INDEX IF EXISTS public.ix_workspaceview_case_shared;
DROP INDEX IF EXISTS public.ix_workspaceview_case_user;
DROP TABLE IF EXISTS public."WorkspaceView";

COMMIT;
