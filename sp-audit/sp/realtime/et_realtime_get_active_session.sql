CREATE OR REPLACE FUNCTION realtime.et_realtime_get_active_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid; nSesid uuid;

BEGIN

nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;

--select * from et_realtime_combo_sessionlist('{"nCaseid":"7f890b75-ffe5-4537-9967-c3c02b407500","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r');fetch all in "r"
-- select * from "RSessionMaster"
 
	select "nSesid" into nSesid from "RSessionMaster"  r
	where "nCaseid" =  nCaseid and r."dDelDt" is null and "cStatus" = 'R' 
	order by r."dStartDt" desc limit 1;
	
	if(nSesid is null)then
		select "nSesid" into nSesid from "RSessionMaster"  r
		where "nCaseid" =  nCaseid and r."dDelDt" is null and "cStatus" = 'C' 
		order by r."dStartDt" desc limit 1;

 	end if;

open ref for 
		SELECT 1 as msg, nSesid AS "nSesid";
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
