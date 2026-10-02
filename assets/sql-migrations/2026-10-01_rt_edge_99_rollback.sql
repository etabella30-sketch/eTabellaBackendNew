-- 2026-10-01_rt_edge_99_rollback.sql
--
-- Rollback of the 2026-10-01_rt_edge_01..10 migrations. NOT part of the apply
-- order: run it only to remove the edge schema from a dev database that has
-- never held edge data.
--
-- File 10 (review fixes) re-creates et_rtedge_session_bind,
-- et_rtedge_orphan_insert, et_rtedge_session_rebind_direct and et_rtedge_enroll
-- (functions files 05-09 created) and adds et_rtedge_session_parser_pin. None
-- of them existed before the rt_edge migrations, so there is no earlier body
-- to restore: they are dropped below with the rest. (To undo file 10 alone and
-- keep 01-09, re-run files 05, 06, 08 and 09, which restore the original
-- bodies, and drop et_rtedge_session_parser_pin; README "Rollback".)
--
-- Once any venue box, orphan, edge-fed / cut-mode / split session exists, do
-- NOT roll back: use the feature flag EDGE_ENABLED=0 (/edge disabled, new 'E'
-- creates refused). This file refuses to run in that case (spec 4.8): signed
-- seals, orphans and part links would be lost.
--
-- Order: refuse-check, restore realtime.et_sessions_builder (only when its
-- live body is exactly file 03's; a body changed since is refused, restore it
-- by hand), drop the SPs and helpers, drop the RSessionMaster indexes /
-- columns (their constraints go with them), drop the four tables.
--
-- Dev etabella_tech_uuid only (guard below). Idempotent.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_99_rollback: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- Refuse when edge data exists
--------------------------------------------------------------------------
DO $refuse$
DECLARE
    v_has boolean;
BEGIN
    IF to_regclass('public."RtEdgeNode"') IS NOT NULL THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM public."RtEdgeNode")' INTO v_has;
        IF v_has THEN
            RAISE EXCEPTION 'rt_edge_99_rollback: venue boxes exist (enrolled keys, audit); roll back with EDGE_ENABLED=0 instead';
        END IF;
    END IF;
    IF to_regclass('public."RtEdgeOrphan"') IS NOT NULL THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM public."RtEdgeOrphan")' INTO v_has;
        IF v_has THEN
            RAISE EXCEPTION 'rt_edge_99_rollback: held-stream orphans exist; roll back with EDGE_ENABLED=0 instead';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'RSessionMaster' AND column_name = 'bEverEdge') THEN
        -- Spec 4.8 rule (bEverEdge or any sync state) plus split part links. 'D' / 'H'
        -- provenance marks alone are not edge data and may be dropped.
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM public."RSessionMaster"
                                 WHERE "bEverEdge" OR "cSyncState" IS NOT NULL OR "nPrevPartSesid" IS NOT NULL)' INTO v_has;
        IF v_has THEN
            RAISE EXCEPTION 'rt_edge_99_rollback: edge, cut-mode or split sessions exist (seals, part links); roll back with EDGE_ENABLED=0 instead';
        END IF;
    END IF;
END
$refuse$;

--------------------------------------------------------------------------
-- Restore realtime.et_sessions_builder to the sp-audit snapshot
--------------------------------------------------------------------------
DO $restore$
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
        RETURN;
    END IF;
    v_hash := md5(btrim(regexp_replace(v_src, '[[:space:]]+', ' ', 'g')));
    IF v_hash = '85be44aa656e51960e0b7722a1b13b72' THEN
        RETURN; -- file 03 was never applied
    END IF;
    IF v_hash <> 'caad0337eca99b97d958755ed4a9b587' THEN
        RAISE EXCEPTION 'rt_edge_99_rollback: realtime.et_sessions_builder changed after rt_edge_03 (normalised md5 %); remove its "cFeedSource" by hand first', v_hash;
    END IF;

    EXECUTE $def$
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
			insert into "RSessionMaster"("cName","dStartDt","nDays","nLines","nPageno","cStatus","dCreatedt","cTimezone","cProtocol","nCaseid","cSessionUnicId","bRefresh")
			values(cName,dStartDt,nDays,nLines,nPageno,'P',now(),cTimezone,cProtocol,nCaseid,cSessionUnicId,bRefresh)
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
$function$
$def$;
END
$restore$;

--------------------------------------------------------------------------
-- Stored procedures (files 05-10) and helpers (file 04)
--------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.et_rtedge_session_parser_pin(json, refcursor);

DROP FUNCTION IF EXISTS public.et_rtedge_create(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_enroll_code(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_enroll(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_confirm_key(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_get(json, refcursor, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_revoke(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_quarantine(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_heartbeat(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_case_set(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_assignments(json, refcursor, refcursor, refcursor, refcursor, refcursor);

DROP FUNCTION IF EXISTS public.et_rtedge_session_bind(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_session_direct(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_session_end(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_session_split(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_applied(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_anchor_ids(json, refcursor);

DROP FUNCTION IF EXISTS public.et_rtedge_session_seal(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_warn_ack(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_session_forceseal(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rt_transcript_completeness(json, refcursor, refcursor);

DROP FUNCTION IF EXISTS public.et_rtedge_session_rebind_direct(json, refcursor);

DROP FUNCTION IF EXISTS public.et_rtedge_event_insert(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_orphan_insert(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rtedge_orphan_resolve(json, refcursor);

DROP FUNCTION IF EXISTS public.rtedge_event(uuid, uuid, text, jsonb, uuid);
DROP FUNCTION IF EXISTS public.rtedge_orphan_interval(timestamptz, timestamptz, bigint, bigint, text);
DROP FUNCTION IF EXISTS public.rtedge_gate_reason(boolean, text, timestamptz, integer);
DROP FUNCTION IF EXISTS public.rtedge_incident_warnings(jsonb);
DROP FUNCTION IF EXISTS public.rtedge_successor(uuid);
DROP FUNCTION IF EXISTS public.rtedge_local_now(text);
DROP FUNCTION IF EXISTS public.rtedge_is_case_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.rtedge_case_admin_role();
DROP FUNCTION IF EXISTS public.rtedge_is_admin(uuid);
DROP FUNCTION IF EXISTS public.rtedge_p256_spki(text);
DROP FUNCTION IF EXISTS public.rtedge_hash_ok(text);
DROP FUNCTION IF EXISTS public.rtedge_timestamp(text);
DROP FUNCTION IF EXISTS public.rtedge_inet(text);
DROP FUNCTION IF EXISTS public.rtedge_jsonb(text);
DROP FUNCTION IF EXISTS public.rtedge_bool(text);
DROP FUNCTION IF EXISTS public.rtedge_bigint(text);
DROP FUNCTION IF EXISTS public.rtedge_int(text);
DROP FUNCTION IF EXISTS public.rtedge_uuid(text);
DROP FUNCTION IF EXISTS public.rtedge_text(text);

--------------------------------------------------------------------------
-- RSessionMaster (file 02): indexes, then columns (their constraints and
-- the nEdgeid foreign key go with them)
--------------------------------------------------------------------------
DROP INDEX IF EXISTS public."ix_rsessionmaster_unsealed";
DROP INDEX IF EXISTS public."ux_rsessionmaster_nprevpartsesid";
DROP INDEX IF EXISTS public."ix_rsessionmaster_nedgeid";

ALTER TABLE public."RSessionMaster"
    DROP CONSTRAINT IF EXISTS "RSessionMaster_cFeedSource_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_cApply_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_cSyncState_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_nIngestEpoch_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_edge_bound_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_nPartNo_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_nPrevPartSesid_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_seal_seq_check",
    DROP CONSTRAINT IF EXISTS "RSessionMaster_nFinalLines_check";

ALTER TABLE public."RSessionMaster"
    DROP COLUMN IF EXISTS "cFeedSource",
    DROP COLUMN IF EXISTS "bEverEdge",
    DROP COLUMN IF EXISTS "cApply",
    DROP COLUMN IF EXISTS "nEdgeid",
    DROP COLUMN IF EXISTS "nIngestEpoch",
    DROP COLUMN IF EXISTS "nRebaseSeq",
    DROP COLUMN IF EXISTS "nAppliedRawSeq",
    DROP COLUMN IF EXISTS "cAppliedRawHash",
    DROP COLUMN IF EXISTS "nHearingOpid",
    DROP COLUMN IF EXISTS "cSyncState",
    DROP COLUMN IF EXISTS "jIncidents",
    DROP COLUMN IF EXISTS "dWarnAckAt",
    DROP COLUMN IF EXISTS "nWarnAckBy",
    DROP COLUMN IF EXISTS "cFinalDigest",
    DROP COLUMN IF EXISTS "nFinalLines",
    DROP COLUMN IF EXISTS "nRawFinalSeq",
    DROP COLUMN IF EXISTS "cRawFinalHash",
    DROP COLUMN IF EXISTS "dSealedAt",
    DROP COLUMN IF EXISTS "cParserVer",
    DROP COLUMN IF EXISTS "cSealNote",
    DROP COLUMN IF EXISTS "nPrevPartSesid",
    DROP COLUMN IF EXISTS "nPartNo";

--------------------------------------------------------------------------
-- Tables (file 01)
--------------------------------------------------------------------------
DROP TABLE IF EXISTS public."RtEdgeOrphan";
DROP TABLE IF EXISTS public."RtEdgeEvent";
DROP TABLE IF EXISTS public."RtEdgeCase";
DROP TABLE IF EXISTS public."RtEdgeNode";

COMMIT;
