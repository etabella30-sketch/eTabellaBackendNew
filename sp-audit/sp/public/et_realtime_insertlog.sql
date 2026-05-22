CREATE OR REPLACE FUNCTION public.et_realtime_insertlog(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

	declare nSesid uuid;nUserid uuid;cStatus text;cSource text;nRTLid uuid;
	
BEGIN

	nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
	nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
	cSource := parameter ->>'cSource';
	cStatus := coalesce((parameter ->>'cStatus')::text,'J');

	
	
/*
select * From "RTLogs" order by 1 desc

select * from public.et_realtime_insertlog ('{"nSesid":"0503702948147250248","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","cStatus":"J","cSource":"L"}','r1');fetch all in "r1";

alter table "RTLogs" add column "cSource" char(1)
select * from et_realtime_insertlog ('{"nUserid":2,"nSesid":1}','r1');fetch all in "r1";

truncate table "RTLogs" restart identity

select * From "RSessionMaster" order by 1 desc

select * from et_realtime_insertlog ('{"nSesid":110,"nUserid":366,"cStatus":"J","cSource":"L"}','r1');fetch all in "r1";

*/

if(cStatus = 'L')then

nRTLid := (select "nRTLid" from "RTLogs" 
			where "nSesid" = nSesid and "nUserid" = nUserid 
			and "cStatus" = 'J' and "dLeaveDt" is null 
			order by "nRTLid" desc limit 1); 

end if;

if(nRTLid IS NOT NULL)then
	update "RTLogs" set "dLeaveDt" = now() where "nRTLid" = nRTLid;
else
	if(cStatus = 'J')then

	-- select * from "RTLogs"
	
		 update "RTLogs" set "dLeaveDt" = now() where "nSesid" = nSesid and "nUserid" = nUserid and "dLeaveDt" is null;
	
		nRTLid = (select "nRTLid" from "RTLogs" 
			where "nSesid" = nSesid and "nUserid" = nUserid 
			and "cStatus" = 'J' and "dLeaveDt" is not null and  6 > EXTRACT(EPOCH FROM (now() - "dLeaveDt"))
			order by "nRTLid" desc limit 1);

		if(nRTLid IS NOT NULL)then
			update "RTLogs" set "dLeaveDt" = null where "nRTLid" = nRTLid;
		else
			insert into "RTLogs"("nUserid","nSesid","cStatus","cSource")
			values(nUserid,nSesid,cStatus,cSource);
		end if;

	end if;
end if;

 open ref for
	select 1 as msg;
 

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
