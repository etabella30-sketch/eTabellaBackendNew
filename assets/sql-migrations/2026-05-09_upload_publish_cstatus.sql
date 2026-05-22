-- 2026-05-09 — fix transcript-publish data inconsistencies:
--   1. et_realtime_transcript_upload_status SP missing cStatus='P' on
--      the upload-publish branch.
--   2. realtime.et_realtime_sessiondata SP returning isTrans=false for
--      every session (the local var defaults to false and is never
--      flipped).
--   3. Backfill RSessionMaster rows already left half-published by (1).
--
-- Context:
--
--   There are two transcript-publish paths in the app:
--     A. RT publish (live session → publish button) → calls
--        transcript.et_transcript_publish, which correctly sets
--        RSessionMaster.cStatus='P' AND isTranscript=true AND
--        isUploaded=true together.
--     B. Direct transcript-file upload with the Publish flag
--        (cFlag='P') → calls public.et_realtime_transcript_upload_status,
--        which set isUploaded and isTranscript but FORGOT cStatus.
--
--   Frontend (feed-display.component.ts cover-fetch, transcript-session-list
--   badge, individual-doc isTrans resolution, etc.) historically gated
--   "this is a published transcript" on cStatus='P'. Path B sessions
--   therefore showed as "Draft", didn't render the cover page, and routed
--   feed-display through the draft data path even though everything else
--   on the row indicated they were published. The frontend has been
--   patched to also accept (isTranscript=true AND isUploaded=true) as a
--   publish signal, but the underlying SP bug still leaves new sessions
--   in the half-published state — fix at the source.
--
--   Separately, realtime.et_realtime_sessiondata declared
--   `isTrans boolean default false` and selected it back unchanged at
--   the bottom of the function, so EVERY session detail returned via
--   /session/activesession/detail had isTrans=false regardless of the
--   row's actual publish state. fileexplorer.previewTranscriptSession
--   and individual-doc.buildSessionDocTab both work around this by
--   normalizing the detail object client-side. Patch lets the SP
--   compute isTrans honestly so the workaround is no longer load-
--   bearing.
--
--   Reproduction was the AM1 - 9 May 2026 session in the eBundle Demo
--   Case (nSesid=d51864ab-9d9b-4640-b2f7-66f81546a470): cStatus='C',
--   isTranscript=true, isUploaded=true, transcript.Transcripts row with
--   dPublishDt set and full cover fields populated — yet no cover
--   rendered until cStatus was manually flipped to 'P'.

-- ── 1/3 ── patch upload-publish SP so future cFlag='P' sets cStatus='P' ──
CREATE OR REPLACE FUNCTION public.et_realtime_transcript_upload_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;cFlag text;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
cFlag := parameter ->>'cFlag';

if(cFlag = 'C')then
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = false where "nSesid" = nSesid;

insert into "RSessionTranscripts"("nSesid","nUserid")
values(nSesid,nUserid);

elsif(cFlag = 'P')then
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = true,"cStatus" = 'P' where "nSesid" = nSesid;
end if;

 open ref for
 select 1 as msg;

 RETURN ref;
 END;
$function$;

-- ── 2/3 ── patch sessiondata SP so isTrans is computed from row data ──
-- realtime.et_realtime_sessiondata declared `isTrans boolean default false`
-- and selected it back at the end of the function unchanged. Result: every
-- detail returned via /session/activesession/detail had isTrans=false.
-- Replace the local-variable read with a computed expression on the row
-- itself so the SP returns the truth: this transcript is published if
-- cStatus='P' OR (isTranscript=true AND isUploaded=true).
CREATE OR REPLACE FUNCTION realtime.et_realtime_sessiondata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;totalissues int;nCaseid uuid; cDefHIssues jsonb;nLID uuid;cColor char(6);
nDefaultid int;cDefIssues jsonb;nLIid uuid;cAColor text;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;

select "nCaseid" into nCaseid From "RSessionMaster" Where "nSesid" = nSesid;

select count(*) into totalissues From "RIssueMaster" Where ("nUserid" =nUserid) and "nCaseid" = nCaseid;

select jsonb_agg(distinct i.*),lid."nIid",lid."cColor" into  cDefHIssues ,nLID ,cColor
from "RSessionDetail" sd
left join "RIssueMaster" lid on lid."nIid" = sd."nLID"
,jsonb_to_recordset("cDefHIssues") as i("nIid" uuid,serialno int)
join "RIssueMaster" r on r."nIid" = i."nIid"
	where sd."nUserid" =nUserid and sd."nSesid" =nSesid
group by lid."nIid";

select jsonb_agg(distinct i.*),lid."nIid",lid."cColor" into  cDefIssues ,nLIid ,cAColor
from "RSessionDetail" sd
left join "RIssueMaster" lid on lid."nIid" = sd."nLIid"
,jsonb_to_recordset("cDefIssues") as i("nIid" uuid,"nRelid" int,"nImpactid" int,serialno int)
join "RIssueMaster" r on r."nIid" = i."nIid"
	where sd."nUserid" =nUserid and sd."nSesid" =nSesid
group by lid."nIid";

if(coalesce(cDefHIssues,'[]'::jsonb) = '[]'::jsonb )then
select ('[{"nIid": "' || "nIid" || '"}]')::jsonb,"cColor","nIid" into cDefHIssues,cColor,nLID
	From "RIssueMaster"
	where "nCaseid" = nCaseid and "nUserid" IS NULL limit 1;
end if;

open ref for

select c."nCaseid",r."nSesid",r."nRTSid",coalesce(r."cName",'') as "cName",r."dStartDt",r."nDays",coalesce(r."nLines",25) as "nLines",
	 coalesce(r."nPageno",1) as "nPageno",r."cUnicuserid" ,r."cStatus",
	 r."cNotifytype",r."dCreatedt",c."cCaseno",
rs."cUrl",rs."nPort",c."cCasename" ,coalesce(totalissues,0) "totaIssues",coalesce(cDefHIssues,'[]'::jsonb) as "cDefHIssues", nLID as "nLID" ,cColor as "cColor"
,coalesce(cDefIssues,'[]'::jsonb) as "cDefIssues", nLIid as "nLIid" ,cAColor as "cAColor"
,COALESCE(r."cStatus" = 'P' OR (r."isTranscript" AND r."isUploaded"), false) as "isTrans",1 as "nDemoid",coalesce(r."cProtocol",'C') as "cProtocol"
	from "CaseMaster" c
	left join "RSessionMaster" r on r."nCaseid" = c."nCaseid" and r."nSesid" = nSesid  and r."dDelDt" is null
	left join "RealtimeServers" rs on rs."nRTSid" = r."nRTSid"
	where c."nCaseid" = nCaseid
  order by r."nSesid" desc ;

 RETURN ref;
    END;
$function$;

-- ── 3/3 ── backfill RSessionMaster rows already left half-published ──
-- Predicate matches the diagnostic SELECT used to surface the bug:
-- transcript-uploaded sessions whose cStatus is NULL or anything other
-- than 'P'. Idempotent: re-running this block once cStatus is 'P' on all
-- matching rows is a no-op.
UPDATE "RSessionMaster"
   SET "cStatus" = 'P'
 WHERE "isTranscript" = true
   AND "isUploaded"   = true
   AND ("cStatus" IS NULL OR "cStatus" <> 'P')
   AND "dDelDt" IS NULL;

-- Rollback (manual):
--   1. Restore the previous SP bodies from sp-audit history. For the
--      upload-publish SP the only line to revert is removing
--      `,"cStatus" = 'P'` from the cFlag='P' branch. For the sessiondata
--      SP, restore the local `isTrans boolean default false` declaration
--      and revert the SELECT from the computed expression back to
--      `isTrans as "isTrans"`.
--   2. The data backfill is not auto-reversible — but rolling cStatus
--      back to NULL/'C' on rows where isTranscript+isUploaded are both
--      true would re-introduce the original "Draft" rendering bug, so
--      no rollback is recommended for the data half of this migration.
