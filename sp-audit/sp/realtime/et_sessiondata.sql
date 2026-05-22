CREATE OR REPLACE FUNCTION realtime.et_sessiondata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;cSessionUnicId text;nUserid UUID;nCaseid UUID;

totalissues int;cDefHIuuses jsonb;nLID uuid;cColor char(6);
nDefaultid int;isTrans boolean default false;nLSesid uuid;cDefIssues jsonb;nLIid uuid;cAColor text;

BEGIN
-- select * From realtime.et_sessiondata('{"nSesid":"518f6223-fe7a-436d-bb9c-613eb0bffc7e","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f"}','r'); fetch all in "r"
cSessionUnicId := parameter ->>'cSessionUnicId';
nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
--nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from realtime.et_sessiondata ('{"nSesid":"8c81dca8-2e94-4f10-98a9-c5ab748964b3","nUserid":"4337e269-a052-4e83-9a09-8d889e9c97df","nCaseid":"9374711e-b923-45dd-8eb9-21cae1eb2c2b"}','r1');fetch all in "r1";

 select * from realtime.et_sessiondata ('{"nSesid":"7441545a-7d3d-4fb7-9f4c-32a02f572a36"}','r1');fetch all in "r1";

*/

if(nCaseid IS NULL)then
	select "nCaseid" into nCaseid From "RSessionMaster" Where "nSesid" = nSesid;
end if;

-- 
-- select * from "Casem"
select count(*) into totalissues From "RIssueMaster" Where ("nUserid" = nUserid) and "nCaseid" = nCaseid ;
-- select * from "RIssueDetail" where "nSessionid" = 0
-- select * from "RIssueMaster" where "nCaseid" = 22

select jsonb_agg(distinct i.*),lid."nIid",lid."cColor" into  cDefHIuuses ,nLID ,cColor
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

if(coalesce(cDefHIuuses,'[]'::jsonb) = '[]'::jsonb )then
select ('[{"nIid": "' || "nIid" || '"}]')::jsonb,"cColor","nIid" into cDefHIuuses,cColor,nLID 
	From "RIssueMaster" 
	where "nCaseid" = nCaseid and "nUserid" IS NULL limit 1;
end if;

nLSesid := get_livesession(nUserid);
open ref for 

select c."nCaseid",r."nSesid",r."nRTSid",coalesce(r."cName",'') as "cName",r."dStartDt",r."nDays",coalesce(r."nLines",25) as "nLines",
	 coalesce(r."nPageno",1) as "nPageno",r."cUnicuserid" ,case when (nLSesid IS NOT NULL and r."nSesid" = nLSesid) then 'R' else  r."cStatus" end as "cStatus",
	 r."cNotifytype",r."dCreatedt",c."cCaseno",
rs."cUrl",rs."nPort",c."cCasename" ,coalesce(totalissues,0) "totaIssues",coalesce(cDefHIuuses,'[]'::jsonb) as "cDefHIuuses", nLID as "nLID" ,cColor as "cColor"
,coalesce(cDefIssues,'[]'::jsonb) as "cDefIssues", nLIid as "nLIid" ,cAColor as "cAColor"
,isTrans as "isTrans",1 as "nDemoid",coalesce(r."cProtocol",'C') as "cProtocol"
	from "CaseMaster" c
	left join "RSessionMaster" r on r."nCaseid" = c."nCaseid" and r."nSesid" = nSesid  and r."dDelDt" is null 
	left join "RealtimeServers" rs on rs."nRTSid" = r."nRTSid"
	where c."nCaseid" = nCaseid 
  order by r."nSesid" desc ;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
