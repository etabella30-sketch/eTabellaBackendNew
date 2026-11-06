DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- Drift guard (2026-10-28): checked against etabella_tech_uuid's live body (pg_get_functiondef). The function is
-- replaced only when it is still that body or already carries this change.
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef('realtime.et_factsheet_unshare_withme(json,refcursor)'::regprocedure) INTO def;
  IF md5(regexp_replace(def, '\s+', '', 'g')) <> '4aff832097e410b25f88a536099e25b3' AND position('nRemoved' in def) = 0 THEN
    RAISE EXCEPTION 'realtime.et_factsheet_unshare_withme(json,refcursor) differs from the body this change was built on (2026-10-28): rebase on pg_get_functiondef before applying';
  END IF;
END $$;

-- R4-007 (RT QA 2026-10-28, Phase B item B5): factsheet/unshare honesty.
--
-- realtime.et_factsheet_unshare_withme deleted the caller's FMShared row and always answered
-- `1, 'Unshared'`, so the fact's creator, or someone it was never shared with, was told "Unshared"
-- when nothing happened. The SP now also answers the rows it deleted as "nRemoved" (GET DIAGNOSTICS
-- ROW_COUNT); FactsheetService.unshare (libs/rt-features/src/factsheet/factsheet.service.ts) turns
-- nRemoved 0 into `{ msg: 0, value: 'No share to remove' }`. An SP without the column (prod until
-- migrated) keeps answering msg 1 as before. The msg/value of a real unshare are unchanged.
-- Mirror: sp-audit/sp/realtime/et_factsheet_unshare_withme.sql. Dev only; prod stays pending.

BEGIN;

CREATE OR REPLACE FUNCTION realtime.et_factsheet_unshare_withme(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;n integer := 0;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_unshare_withme ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "FMShared"
*/

	delete from "FMShared" where "nFSid" = nFSid and "nUserid"  = nMasterid;
	GET DIAGNOSTICS n = ROW_COUNT;

    OPEN ref1 FOR
	select 1 as msg,'Unshared' as value, n as "nRemoved";
    RETURN NEXT ref1;


END;
$function$;

COMMIT;
