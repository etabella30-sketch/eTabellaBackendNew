CREATE OR REPLACE FUNCTION public.et_realtime_sessiondata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;nSesid uuid;nUserid uuid;totalissues int;nCaseid uuid; cDefHIuuses jsonb;nLID uuid;cColor char(6);
nDefaultid int;isTrans boolean default false;nLSesid uuid;cDefIssues jsonb;nLIid uuid;cAColor text;

BEGIN

-- select * From et_realtime_sessiondata('{"nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b"}','r'); fetch all in "r"

cUnicuserid := parameter ->> 'cUnicuserid';
nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

--nSesid := case when nSesid IS NULL then '00000000-0000-0000-0000-000000000001'::uuid else nSesid end;
/*


select get_livesession_bycase('e0cd23d4-12fa-4b80-bdc0-88ec4287957b');

if(nSesid IS NULL)then
select get_livesession_bycase('81765ff6-8040-4081-af51-be37c588727d');
	nSesid := (select max("nSesid") from "RSessionMaster" r where r."cStatus" != 'P' and "dDelDt" is null 
	and  
	case when nCaseid IS NULL then true else  r."nCaseid" = nCaseid end 
	and "isTranscript" = true and  
	exists (select * from "RSessionDetail" d where d."nSesid" = r."nSesid" and d."nUserid" =nUserid )  limit 1 );
	if(nSesid IS NOT NULL)then
	isTrans = true;
	end if;
end if;

if(nSesid IS NULL)then
nSesid := (select max("nSesid") from "RSessionMaster" r where r."cStatus" != 'P' and "dDelDt" is null and  
	case when nCaseid IS NULL then true else  r."nCaseid" = nCaseid end 
	and  exists (select * from "RSessionDetail" d where d."nSesid" = r."nSesid" and d."nUserid" =nUserid )  limit 1 );
end if;*/

if(nCaseid IS NULL)then

select "nCaseid" into nCaseid From "RSessionMaster" Where "nSesid" = nSesid;
end if;

-- 
-- select * from "Casem"
select count(*) into totalissues From "RIssueMaster" Where ("nUserid" =nUserid) and "nCaseid" = nCaseid ;
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

nLSesid := get_livesession_bycase(nCaseid);
-- select * From "RSessionMaster" order by "dCreatedt" desc
if(nLSesid is null and nSesid is null)then
	select "nSesid" into nSesid from "RSessionMaster" where "nCaseid" = nCaseid and "dDelDt" is null and "isTranscript" = true order by "dStartDt" desc limit 1;
	
	if(nSesid is null) then
		select "nSesid" into nSesid from  "RSessionMaster" where "nCaseid" = nCaseid and "dDelDt" is null and "isTranscript" = false order by "dStartDt" desc limit 1;
	else
		isTrans = true;
	end if;

end if;

	if(nSesid is null and nLSesid is not null)then
	nSesid = nLSesid;
	end if;


	
open ref for 
-- select * From et_realtime_sessiondata('{"nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b"}','r'); fetch all in "r"
-- select * From "CaseMaster" where "nCaseid" = 'e0cd23d4-12fa-4b80-bdc0-88ec4287957b'
-- select * From "RSessionMaster" where "nSesid" = '75ca116b-5d6b-49a0-9ccc-4d7de141aa07'

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
