CREATE OR REPLACE FUNCTION public.et_realtime_sessions_users_bycaseid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSesid uuid;
BEGIN
    nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;

/*
select * from et_realtime_sessions_users_bycaseid ('{""nSesid"":74}','r1');fetch all in ""r1"";
select * from ""RTLogs"" order by 1
select * from ""RSessionMaster""
select * from ""RSessionDetail""
*/

    OPEN ref FOR
        with tbl as (
            select r."nUserid",r."nSesid",r."dLeaveDt",r."dCreateDt", EXTRACT(EPOCH FROM (coalesce(r."dLeaveDt",now()) - r."dCreateDt")) as "nSeconds"
            from "RTLogs" r            
            join "RSessionMaster" rt on rt."nSesid" = r."nSesid"
            where r."cStatus" = 'J' -- and ""dLeaveDt"" is not null 
            and case when rt."cStatus" = 'C' then "dLeaveDt" is not null else true end -- add row by Roshan
            and r."nSesid" = nSesid
        ),ls as (
            select t."nUserid",t."nSesid",min(t."dCreateDt") as "dStartdt",max(t."dLeaveDt") as "dEnddt",sum(t."nSeconds") as "nSeconds"
            from tbl t
            group by t."nUserid",t."nSesid"
        )select u."nUserid",ls."dStartdt",ls."dEnddt",u."cFname",u."cLname",u."cEmail",
            TO_CHAR(make_interval(0, 0, 0, 0, 0, 0, ls."nSeconds"), 'HH24') AS hour,
            TO_CHAR(make_interval(0, 0, 0, 0, 0, 0, ls."nSeconds"), 'MI') AS minutes,
            TO_CHAR(make_interval(0, 0, 0, 0, 0, 0, ls."nSeconds"), 'SS') AS seconds        
            from ls 
            join "UserMaster" u on u."nUserid" = ls."nUserid" 
            order by ls."dStartdt"
        
-- select * From ""UserMaster""
        
        
        ;

    RETURN ref;
END;
$function$
