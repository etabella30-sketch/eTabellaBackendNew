CREATE OR REPLACE FUNCTION public.et_realtime_issuedetail_by_issueid(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIid := NULLIF(parameter ->>'nIid','')::uuid;

	
/*

 select * from et_realtime_issuedetail_by_issueid('{""nCaseid"":22,""nUserid"":2,""nIid"":31,""nSessionid"":58}','r1','r2');FETCH All in ""r1""; 
 FETCH All in ""r2"";

select * From "RHighlights"

 
select * From "RIssueDetail"  rd where "nIDid" = 'a7cad305-8d60-40be-b93e-a6819f1d255d'
coalesce("cTLineno","cLineno") 
*/

		
    OPEN ref1 FOR 
	
select rd."nIDid", rd."cNote",  coalesce(rd."cTPageno",rd."cPageno") as "cPageno",  rd."cONote",rl."cCodename" as "cRelevance",
imp."cCodename" as "cImpact",rm."nRelid",rm."nImpactid", coalesce(rd."jTCordinates",rd."jCordinates") as "jCordinates"
From "RIssueDetail" rd 
join "RIssueMapid" rm on rm."nIDid" = rd."nIDid"
left join "Codemaster"  rl on rl."nCodeid" = rm."nRelid"
left join "Codemaster"  imp on imp."nCodeid" = rm."nImpactid"
	
where "nCaseid" = nCaseid and "nSessionid" = nSessionid and rd."nUserid" = nUserid
and "nIid" = nIid;
		
    RETURN NEXT ref1;
    
	
	
	
	
    OPEN ref2 FOR 

-- select * From "RHighlightMapid"

		with tbl as (
		select *, grp, DENSE_RANK() OVER (ORDER BY i,(coalesce("cTPageno","cPageno")),grp) AS unique_no From (
		SELECT (coalesce("cTLineno","cLineno") )::bigint - ROW_NUMBER() OVER (PARTITION BY (coalesce("cTPageno","cPageno"))::int ORDER BY (coalesce("cTLineno","cLineno") )::int) AS grp,  coalesce("cTPageno","cPageno") as "cPageno","cTPageno",coalesce("cTLineno","cLineno")  "cLineno","cTLineno",m."nHid",string_agg(m."nIid"::text,',') i
		      FROM "RHighlights" h 
		JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
			where  h."nSessionId" = nSessionid and h."nUserid" = nUserid and m."nIid" = nIid
			
		group by "cTPageno","cPageno","cTLineno","cLineno",m."nHid"
			order by m."nHid"
		) dt order by coalesce("cTPageno","cPageno") ,"cLineno","nHid",i
		)
		select t."unique_no" as "nGroupid",t.i as "issueids" ,jsonb_agg(rh) as "highlights"
		from tbl t
		join(
		select "nHid","cNote",coalesce("cTPageno","cPageno") as "cPageno",coalesce("cTLineno","cLineno") "cLineno" From "RHighlights"
		) rh on rh."nHid" = t."nHid"
		group by t."unique_no",t.i 
		
		order by "unique_no";

/*

		with tbl as (
		select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
		SELECT  "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int ORDER BY "cLineno"::int) AS grp,  "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
		      FROM "RHighlights" h 
		JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
			where  h."nSessionId" = nSessionid and h."nUserid" = nUserid and m."nIid" = nIid
			
		group by "cPageno","cLineno",m."nHid"
			order by m."nHid"
		) dt order by "cPageno","cLineno","nHid",i
		)
		select t."unique_no" as "nGroupid",t.i as "issueids" ,jsonb_agg(rh) as "highlights"
		from tbl t
		join(
		select "nHid","cNote","cPageno","cLineno" From "RHighlights"
		) rh on rh."nHid" = t."nHid"
		group by t."unique_no",t.i 
		
		order by "unique_no";

*/

	
 	RETURN NEXT ref2;
	
	
	
	 
END;
$function$
