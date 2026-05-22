CREATE OR REPLACE FUNCTION public.et_realtime_logs_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSesid uuid; nUserid uuid;
BEGIN
    nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;

/*
select * from et_realtime_logs_list ('{""nUserid"":366,""nSesid"":51}','r1');fetch all in ""r1"";
select * from ""RTLogs"" order by 1
select * from ""RSessionMaster""
select * from ""UserMaster""

select  TO_CHAR(""dLeaveDt"" - ""dCreateDt"", 'HH24') AS hour,
TO_CHAR(""dLeaveDt"" - ""dCreateDt"", 'MI') AS minutes,
TO_CHAR(""dLeaveDt"" - ""dCreateDt"", 'SS') AS seconds,* From ""RTLogs""

*/

    
    OPEN ref FOR

        select r."nRTLid", TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'HH24') AS hour,
            TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'MI') AS minutes,
            TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'SS') AS seconds,
            case when r."cSource" = 'O' then 'Local RT' else 'Live RT' end as "cStatus1",
            r."dCreateDt", r."dLeaveDt"
        from "RTLogs" r
        join "UserMaster" u on r."nUserid" = u."nUserid"
        join "RSessionMaster" rt on rt."nSesid" = r."nSesid"
        where r."nUserid" = nUserid and r."nSesid" = nSesid        
            and case when rt."cStatus" = 'C' then r."dLeaveDt" is not null else true end  -- add row by Roshan
    order by r."dCreateDt"
        
        /*select r.""nRTLid"",r.""nUserid"",r.""nSesid"",r.""cStatus"",r.""dCreateDt"",r.""cSource"",s.""cName"",u.""cFname"",u.""cLname"",u.""cEmail"",
        case r.""cStatus"" when 'J' then 'User join session' when 'L' then 'User leave session' when 'LG' then 'User login' end ||
        case  when r.""cSource"" = 'O' then ' on local RT' else ' on live RT' end as ""cStatus1""
        from ""RTLogs"" r
        left join ""RSessionMaster"" s on s.""nSesid"" = r.""nSesid"" 
        join ""UserMaster"" u on r.""nUserid"" = u.""nUserid""
        where ( coalesce(r.""nSesid"",0) = 0 or s.""nCaseid"" = nCaseid) and r.""dCreateDt"" between dStartDt and dEndDt
        order by r.""dCreateDt"" desc*/
        ;

    RETURN ref;
END;
$function$
