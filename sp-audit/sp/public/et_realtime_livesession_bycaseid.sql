CREATE OR REPLACE FUNCTION public.et_realtime_livesession_bycaseid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;

BEGIN

nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;

-- select * From "RSessionMaster" where "nCaseid" = 22
-- alter table "RSessionMaster" add column "isUploaded" boolean default false
-- select * from et_realtime_livesession_bycaseid('{""nCaseid"":22,""nUserid"":2}','r');fetch all in ""r""

 open ref for 
 
	select rs."nSesid"
	from "RSessionMaster" rs 
	join "RSessionDetail" d on  d."nSesid" = rs."nSesid"
	where d."nUserid" = nUserid and rs."nCaseid" = nCaseid and rs."cStatus" = 'R' and "dStartDt"::date= now()::date 
	 and  rs."cSType" != 'D' ;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
