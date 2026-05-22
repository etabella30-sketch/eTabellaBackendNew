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

-- if there are no default issue then create 1 with unsign category and then append to cDefHIsuses 

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
$function$
