-- Undo 2026-11-04_live_qfact_single_call.up.sql. First unset LIVE_QFACT_SINGLE_CALL and restart the realtime server
-- (the step-by-step path does not use these functions).
DROP FUNCTION IF EXISTS realtime.live_qfact_capture_apply(jsonb);
DROP FUNCTION IF EXISTS realtime.live_qfact_owners(uuid, uuid, text, text[]);
