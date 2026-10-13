-- Downgrade frontend/realtime-server first. Preserve historical identities, event and notification records.
BEGIN;
DROP TRIGGER IF EXISTS rt_entry_session_before ON public."RSessionMaster";
DROP TRIGGER IF EXISTS rt_entry_session_after ON public."RSessionMaster";
DROP TRIGGER IF EXISTS rt_entry_assignment_after ON public."RSessionDetail";
DROP TRIGGER IF EXISTS rt_entry_team_after ON public."TeamRelation";
DROP TRIGGER IF EXISTS rt_entry_admin_after ON public."UserMaster";
DROP FUNCTION IF EXISTS public.rt_entry_session_before();
DROP FUNCTION IF EXISTS public.rt_entry_session_after();
DROP FUNCTION IF EXISTS public.rt_entry_membership_after();
DROP FUNCTION IF EXISTS public.rt_entry_notify(uuid);
DROP FUNCTION IF EXISTS public.rt_entry_eligible(uuid,uuid);
DROP INDEX IF EXISTS public."RSessionMaster_one_live_per_case";
COMMIT;
