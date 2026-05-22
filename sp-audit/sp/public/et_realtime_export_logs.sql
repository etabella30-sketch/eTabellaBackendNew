CREATE OR REPLACE FUNCTION public.et_realtime_export_logs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid uuid; nUserid uuid; dStartDt timestamp; dEndDt timestamp;
BEGIN
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
    dStartDt := parameter ->> 'dStartDt';
    dEndDt := parameter ->> 'dEndDt';

/*
select * from et_realtime_export_logs ('{"nUserid":366,"nCaseid":1106}','r1');fetch all in "r1";
select * From "RSession"

select * From "RSessionMaster" where "nSesid" = 74

		select r."nRTLid" ,TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'HH24') AS hour,
			TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'MI') AS minutes,
			TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'SS') AS seconds,
			case  when r."cSource" = 'O' then 'Local RT' else 'Live RT' end as "cStatus1",
			r."dCreateDt",r."dLeaveDt"
		from "RTLogs" r
		join "UserMaster" u on r."nUserid" = u."nUserid"
		
		TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'HH24') || ' hr ' || 
		TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'MI')   || ' min ' ||   
		TO_CHAR(coalesce(r."dLeaveDt",now()::timestamp) - r."dCreateDt", 'SS') || ' sec'
	
*/

    
    OPEN ref FOR
with tbl as (
	select distinct c."cCasename",c."cCaseno" ,s."cName",to_char(s."dStartDt",'dd/mm/yy, hh12:mi AM') as "dStartDt",
		u."cFname" || ' ' || u."cLname"  as "cUsername",u."cEmail",
		to_char(l."dCreateDt",'dd/mm/yy, hh12:mi AM') as "dInDt",to_char(l."dLeaveDt",'dd/mm/yy, hh12:mi AM') as "dOutDt",
		TO_CHAR(coalesce(l."dLeaveDt",now()::timestamp) - l."dCreateDt", 'HH24') AS hour,
			TO_CHAR(coalesce(l."dLeaveDt",now()::timestamp) - l."dCreateDt", 'MI') AS minutes,
			TO_CHAR(coalesce(l."dLeaveDt",now()::timestamp) - l."dCreateDt", 'SS') AS seconds
		from "CaseMaster" c
		join "RSessionMaster" s on s."nCaseid" = c."nCaseid"
		join "RTLogs" l on l."nSesid" = s."nSesid"
		join "UserMaster" u on u."nUserid" = l."nUserid"
		where c."nCaseid" = nCaseid and s."dStartDt"::date between dStartDt::date and dEndDt::date
)select  t."cCasename" as "Case",t."cCaseno" as "Case No.",t."cName" as "Session" ,t."dStartDt" as "Session Date",
		t."cUsername"  as "User Name",t."cEmail" as "Email",
		t."dInDt" as "In Time",t."dOutDt" as "Leave Time",
		case when t.hour != '00' then (t.hour || ' hr ') else '' end || 
		case when t.minutes != '00' then (t.minutes || ' min ') else '' end || 
		case when t.seconds != '00' then (t.seconds || ' sec ') else '' end  as "Time spends in hearing"
		from tbl t
		;

    RETURN ref;
END;
$function$
