CREATE OR REPLACE FUNCTION public.et_realtime_combo_sessionlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid; cType text;

BEGIN

nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
cType := NULLIF(parameter ->> 'cType','');

--select * from et_realtime_combo_sessionlist('{"nCaseid":"7f890b75-ffe5-4537-9967-c3c02b407500","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r');fetch all in "r"
-- select * from "RSessionMaster"
 open ref for 
 
 select r."nSesid","dStartDt",r."cName",r."cStatus",r."isTranscript",
     r."isUploaded",coalesce(r."cProtocol",'C') as "cProtocol"
 From "RSessionMaster" r 
 left join "RSessionDetail" rd on rd."nSesid" = r."nSesid"
 and case when nUserid IS NOT NULL then "nUserid" = nUserid else true end
 where case when nCaseid IS NOT NULL then "nCaseid" = nCaseid else true end and r."dDelDt" is null
 and  case when cType IS NOT NULL then "isTranscript" else true end 
 and r."cSType" != 'D' 
 group by  r."nSesid","dStartDt",r."cName",r."cStatus",r."isTranscript",r."isUploaded",r."cProtocol" 
 order by r."dStartDt" desc;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
