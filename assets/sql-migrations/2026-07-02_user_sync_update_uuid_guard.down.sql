-- Down: restore the original naked-cast body of public.et_user_sync_update.
-- (Reverts the uuid-shape guard; a non-uuid nMasterid will again raise
-- invalid_text_representation on connect.)

BEGIN;

CREATE OR REPLACE FUNCTION public.et_user_sync_update(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

    update "UserMaster" set "dSyncdt" = now()
    where "nUserid" = nMasterid;

OPEN ref1 FOR
select 1 as msg;

    RETURN NEXT ref1;

END;
$function$
;

COMMIT;
