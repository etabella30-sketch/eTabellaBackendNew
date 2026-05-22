CREATE OR REPLACE FUNCTION public.et_realtime_sessions_bycaseid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid uuid; dStartDt timestamp; dEndDt timestamp;
BEGIN
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
    dStartDt := parameter ->> 'dStartDt';
    dEndDt := parameter ->> 'dEndDt';

/*
select * from et_realtime_sessions_bycaseid ('{""nCaseid"":2739,""dStartDt"":""2024-10-14"",""dEndDt"":""2024-10-15T23:59:00""}','r1');fetch all in ""r1"";
select * from ""RTLogs""
select * from ""RSessionMaster""
*/

    OPEN ref FOR
        select "nSesid", "cName", "cStatus", "dCreatedt", "dStartDt"
        from "RSessionMaster" r    
        where r."dDelDt" is null and "dStartDt" between dStartDt and dEndDt and "nCaseid" = nCaseid and r."cSType" != 'D' 
        order by r."dStartDt" desc
        ;

    RETURN ref;
END;
$function$
