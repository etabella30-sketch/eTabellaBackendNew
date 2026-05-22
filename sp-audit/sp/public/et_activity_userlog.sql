CREATE OR REPLACE FUNCTION public.et_activity_userlog(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nUserid uuid;cType text;
startDt date;endDt date;
pageNumber int;offsetCount int;perPage int default 30;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
nUserid := NULLIF(parameter ->>'nUserid', '')::uuid;
cType := parameter ->>'cType';
startDt:= parameter ->>'startDt';
endDt:= parameter ->>'endDt';
-- select * from et_activity_userLog
startDt := case when startDt is null then now()::date else startDt end;
endDt := case when endDt is null then now()::date else endDt end;

pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;
-- select * from public.et_activity_userLog ('{""nCaseid"":1122,""nUserid"":367,""cType"":""L"",""nMasterid"":367}','r1');fetch all in ""r1"";
-- select * from ""Userlog""
	if(cType = 'L') then
Raise notice '%',startDt;
	
	    OPEN ref1 FOR 
			WITH time_grouped AS (
			    SELECT 
			        lc."nLCatid",
			        "cCategory",
			        ul."dCreateDt",
			        ul."cRemark",
					ul."jOther",
			        date_trunc('second', ul."dCreateDt") as truncated_time
			    FROM "LogCategory" lc
			    JOIN "UserLog" ul ON ul."nLCatid" = lc."nLCatid"
			    where ul."nUserid" = nUserid and lc."nLCatid" in (1,2,3,4,5)
			 and "dCreateDt"::date between startDt and endDt 
			),
			paired_logins AS (
			    SELECT *,
			        EXISTS (
			            SELECT 1 
			            FROM time_grouped t2 
			            WHERE t2.truncated_time = t1.truncated_time 
			            AND t2."nLCatid" != t1."nLCatid"
			        ) as has_pair
			    FROM time_grouped t1
			)
			SELECT startDt,endDt,
			    "nLCatid",
			    "cCategory" || case when "nLCatid" = 1 then ' (' || (case when ("jOther"->>'KML')::boolean = false then 'Not ' else '' end) || 'Keep Me Signed in)' else '' end as "cCategory",
			    "dCreateDt",
			   "cRemark" 
			FROM paired_logins
			WHERE ("nLCatid" = 1 AND has_pair = true) = false
			ORDER BY "dCreateDt" DESC
			  LIMIT perPage
        OFFSET offsetCount;
	end if;

	if(cType = 'A') then
	  OPEN ref1 FOR 
			select lc."nLCatid","cCategory",ul."dCreateDt",ul."cRemark" from "LogCategory" lc
			join "UserLog" ul on ul."nLCatid" = lc."nLCatid"
			where ul."nUserid" = nUserid and lc."nLCatid" in (15,51)
			and "dCreateDt"::date between startDt and endDt 
			order by ul."dCreateDt" desc
			  LIMIT perPage
        OFFSET offsetCount;

			end if;
		
    RETURN NEXT ref1;
    -- select * from ""LogCategory"" order by 1 ;
    -- select * from ""UserLog"" order by 1 desc
	
END;
$function$
