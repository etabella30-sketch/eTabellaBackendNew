CREATE OR REPLACE FUNCTION public.et_realtime_todays_sessions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare dDate date;cUnicuserid text;nUserid uuid;
BEGIN
dDate := parameter ->>'dDate';
cUnicuserid := parameter ->>'cUnicuserid';
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;

 open ref for 
select r."nSesid",r."nCaseid",r."dStartDt",r."cUnicuserid",r."nLines",r."nPageno"
From "RSessionMaster" r
join "CaseMaster" c on c."nCaseid" = r."nCaseid" 
 where "dStartDt"::date = dDate::date and r."cUnicuserid" = cUnicuserid and r."dDelDt" is null order by r."nSesid";

 RETURN ref;
 END;
$function$
