-- Down: remove the restored SP (prior state on 3.0.etabella.com.uuid was: function absent).
-- et_share_get_bundles_backupnow is left untouched.
BEGIN;
DROP FUNCTION IF EXISTS public.et_share_get_bundles(json, refcursor);
COMMIT;
