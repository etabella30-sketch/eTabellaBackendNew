CREATE OR REPLACE FUNCTION public.et_realtime_sessionlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;pageNumber  int;offsetCount  int;perPage int default 20;dDate timestamp;

BEGIN

cUnicuserid := parameter ->>'cUnicuserid';
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;
dDate := coalesce( (parameter ->>'dDate')::timestamp,now());
/*
select * From "RSessionMaster" order by 1 desc
select * From "RSessionDetail" order by 1 desc

alter table "RSessionDetail" add column "cNotifytype" character varying(2)

alter table "RSessionDetail" drop column "cUsertype"

select * From "CaseMaster" order by 1 desc

select * from et_realtime_sessionlist ('{"pageNumber":1,"cUnicuserid":"mfnzhythmc"}','r1');fetch all in "r1";

select * From "RSessionMaster"  order by 1 desc
select * From "RealtimeServers"
*/

 open ref for 
select r."nSesid",r."nRTSid",r."cName",r."dStartDt"::text,r."nDays",r."nLines",r."nPageno",r."nCaseid",r."cUnicuserid" ,r."cNotifytype",r."dCreatedt",c."cCaseno",
rs."cUrl",rs."nPort",

CASE
        WHEN dDate >= r."dStartDt" and r."cStatus" !='C' AND (dDate < COALESCE(LEAD(r."dStartDt") OVER (PARTITION BY r."nCaseid" ORDER BY r."dStartDt"), 'infinity'))  AND dDate::date = r."dStartDt"::date and r."cStatus" !='C' THEN 'R' 
        WHEN (dDate < r."dStartDt" AND dDate::date = r."dStartDt"::date) or (r."dStartDt"::date > dDate::date) THEN 'P'
        ELSE 'C'
    END AS "cStatus"
    
From "RSessionMaster" r
join "CaseMaster" c on c."nCaseid" = r."nCaseid"
left join "RealtimeServers" rs on rs."nRTSid" = r."nRTSid"
where r."cUnicuserid" = cUnicuserid and r."dDelDt" is null 
order by 
--case when r."cUnicuserid" = cUnicuserid then 0 else 1 end ,r."nDays",r."cName"
r."nDays" asc,r."nSesid" desc
LIMIT perPage
OFFSET offsetCount;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
