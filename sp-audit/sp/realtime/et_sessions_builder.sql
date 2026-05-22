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
