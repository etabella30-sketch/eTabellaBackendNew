-- 2026-10-01_rt_edge_03_sessions_builder_h.sql
--
-- RT venue edge box: the legacy venue lane marks its sessions 'H' (spec rev 3,
-- sections 4.1, 4.8, 4.9). realtime.et_sessions_builder's 'N' INSERT gains
-- "cFeedSource" = 'H'; nothing else in the function changes. File 02 back-fills
-- the existing legacy rows.
--
-- The spec requires this re-creation to start from the LIVE body, not the
-- 2026-05-03 sp-audit snapshot (sp-audit/sp/realtime/et_sessions_builder.sql).
-- This migration cannot read the live body, so it guards instead: it compares
-- a whitespace-normalised md5 of the live body,
--     md5(btrim(regexp_replace(prosrc, '[[:space:]]+', ' ', 'g')))
-- with the snapshot's and with this file's (a re-run). Any other body means
-- the live function drifted: the file refuses, and the body below must be
-- re-based on pg_get_functiondef('realtime.et_sessions_builder(json, refcursor)'::regprocedure)
-- with both hashes recomputed (README, "Re-basing file 03").
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 02.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_03_sessions_builder_h: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

DO $drift$
DECLARE
    v_src  text;
    v_hash text;
BEGIN
    SELECT p.prosrc INTO v_src
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'realtime'
       AND p.proname = 'et_sessions_builder'
       AND pg_get_function_identity_arguments(p.oid) = 'parameter json, ref1 refcursor';
    IF v_src IS NULL THEN
        RAISE EXCEPTION 'rt_edge_03: realtime.et_sessions_builder(parameter json, ref1 refcursor) does not exist on %', current_database();
    END IF;
    v_hash := md5(btrim(regexp_replace(v_src, '[[:space:]]+', ' ', 'g')));
    -- 85be44aa... = the 2026-05-03 sp-audit snapshot; caad0337... = the body below (already applied).
    IF v_hash NOT IN ('85be44aa656e51960e0b7722a1b13b72', 'caad0337eca99b97d958755ed4a9b587') THEN
        RAISE EXCEPTION 'rt_edge_03: live realtime.et_sessions_builder differs from the sp-audit snapshot (normalised md5 %). Re-base this file on the live body first.', v_hash;
    END IF;
END
$drift$;

CREATE OR REPLACE FUNCTION realtime.et_sessions_builder(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;cSessionUnicId text;bRefresh boolean;cCaseno text;cName text;cProtocol text;
dStartDt timestamp;nDays int;nLines int;nPageno int;nSesid uuid;permission text;cTimezone text;
nCaseid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
cSessionUnicId := parameter ->>'cSessionUnicId';

bRefresh := nullif(parameter ->>'bRefresh','');
cCaseno := parameter ->>'cCaseno';
cName := parameter ->>'cName';
cProtocol := parameter ->>'cProtocol';
dStartDt := parameter ->>'dStartDt';
nDays := parameter ->>'nDays';
nLines := parameter ->>'nLines';
nPageno := parameter ->>'nPageno';
nSesid := parameter ->>'nSesid';
cTimezone := parameter ->>'cTimezone';
permission := parameter ->>'permission';

/*

 select * from realtime.et_sessions ('{"sessionUserId":"0a95010bbe6a","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

select * from "CaseMaster"
select * from "RSessionMaster"

alter table "RSessionMaster" add column "bRefresh" boolean

select * from "RealtimeServers"
*/

if permission = 'N' then

	if not exists (select * from "RSessionMaster" where "cSessionUnicId" = cSessionUnicId and "dStartDt" = dStartDt and "dDelDt" is null  )then
		nCaseid := (select "nCaseid" from "CaseMaster" where trim(lower("cCaseno")) = trim(lower(cCaseno)) limit 1);
		if (nCaseid is not null) then
			insert into "RSessionMaster"("cName","dStartDt","nDays","nLines","nPageno","cStatus","dCreatedt","cTimezone","cProtocol","nCaseid","cSessionUnicId","bRefresh","cFeedSource")
			values(cName,dStartDt,nDays,nLines,nPageno,'P',now(),cTimezone,cProtocol,nCaseid,cSessionUnicId,bRefresh,'H')
			returning "nSesid" into nSesid;
			open ref1 for select 1 as msg,nSesid as "nSesid" ,'Session Created' as value;
		else
			open ref1 for select -1 as msg,'Invalid case no' value;
		end if;
	else
		open ref1 for select -1 as msg,'Session already exists' as value;
	end if;



elsif permission = 'E' then

	if not exists (select * from "RSessionMaster" where "cSessionUnicId" = cSessionUnicId and "dStartDt" = dStartDt and "dDelDt" is null  and "nSesid" != nSesid )then
		nCaseid := (select "nCaseid" from "CaseMaster" where trim(lower("cCaseno")) = trim(lower(cCaseno)) limit 1);
		if (nCaseid is not null) then
			update "RSessionMaster" set "cName" =  cName,"nDays" = nDays,"nLines" = nLines,
			"nPageno" = nPageno,"bRefresh" = bRefresh,"dStartDt" = dStartDt where "nSesid" = nSesid;
			open ref1 for select 1 as msg,nSesid as "nSesid" ,'Session Updated' as value;
		else
			open ref1 for select -1 as msg,'Invalid case no' value;
		end if;
	else
		open ref1 for select -1 as msg,'Session already exists' as value;
	end if;

elsif permission = 'D' then

	update "RSessionMaster" set "dDelDt" = now() where "nSesid" = nSesid;
	open ref1 for select 1 as msg,'Session Deleted' as value;

end if;



    RETURN NEXT ref1;




END;
$function$;

COMMIT;
