BEGIN;

-- 14a. upload-publish SP: set cStatus='P' on cFlag='P' branch
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

-- 14b. sessiondata SP: isTrans computed from row data
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

-- 14c. backfill RSessionMaster rows already left half-published
UPDATE "RSessionMaster"
   SET "cStatus" = 'P'
 WHERE "isTranscript" = true
   AND "isUploaded"   = true
   AND ("cStatus" IS NULL OR "cStatus" <> 'P')
   AND "dDelDt" IS NULL;

-- Verification queries
SELECT (POSITION('"cStatus" = ''P''' IN pg_get_functiondef(oid)) > 0)
       AS upload_publish_sets_cstatus
  FROM pg_proc WHERE proname = 'et_realtime_transcript_upload_status';

SELECT (POSITION('isTranscript" AND r."isUploaded' IN pg_get_functiondef(p.oid)) > 0)
       AS sessiondata_computes_istrans
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.proname = 'et_realtime_sessiondata' AND n.nspname = 'realtime';

SELECT COUNT(*) AS half_published_remaining
  FROM "RSessionMaster"
 WHERE "isTranscript" = true
   AND "isUploaded"   = true
   AND ("cStatus" IS NULL OR "cStatus" <> 'P')
   AND "dDelDt" IS NULL;

COMMIT;
