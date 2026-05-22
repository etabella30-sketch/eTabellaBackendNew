CREATE OR REPLACE FUNCTION public.et_realtime_export_othercasedetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nCaseid uuid;

BEGIN
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_realtime_export_othercasedetail ('{""nCaseid"":22,""nMasterid"":2}','r1');fetch all in ""r1"";
select * from et_realtime_export_othercasedetail ('{""nCaseid"":1106,""nSesid"":0}','r1');fetch all in ""r1"";
select * From "CaseMaster"
select * From "RSessionMaster"
*/

open ref for
select coalesce(r."nSesid",'00000000-0000-0000-0000-000000000001'::uuid) as "nSesid",r."cStatus",r."cProtocol",coalesce(r."cName",'Demo session') as "cName",to_char(coalesce(r."dStartDt",now()),'Day') as "dDay",to_char(coalesce(r."dStartDt",now()),'dd Mon yyyy') as "dSessionDt",c.*
From "CaseMaster" c
left join "RSessionMaster" r  on c."nCaseid" = r."nCaseid" and r."nSesid" = nSesid
where  c."nCaseid" = nCaseid
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
