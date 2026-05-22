CREATE OR REPLACE FUNCTION public.et_realtime_navigate_get_qmarks_list(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;

    OPEN ref1 FOR 
		-- 		with tbl as (
		-- select *, grp, DENSE_RANK() OVER (ORDER BY i,(coalesce("cTPageno","cPageno")),grp) AS unique_no From (
		-- SELECT (coalesce("cTLineno","cLineno") )::bigint - ROW_NUMBER() OVER (PARTITION BY (coalesce("cTPageno","cPageno"))::int ORDER BY (coalesce("cTLineno","cLineno") )::int) AS grp,  coalesce("cTPageno","cPageno") as "cPageno","cTPageno",coalesce("cTLineno","cLineno")  "cLineno","cTLineno",m."nHid",string_agg(m."nIid"::text,',') i
		--       FROM "RHighlights" h 
		-- JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
		-- 	where  h."nSessionId" = nSessionid and h."nUserid" = nUserid
			
		-- group by "cTPageno","cPageno","cTLineno","cLineno",m."nHid"
		-- 	order by m."nHid"
		-- ) dt order by coalesce("cTPageno","cPageno") ,"cLineno","nHid",i
		-- )
		-- select t."unique_no" as "nGroupid",t.i as "issueids" ,jsonb_agg(rh) as "highlights"
		-- from tbl t
		-- join(
		-- select "nHid","cNote",coalesce("cTPageno","cPageno") as "cPageno",coalesce("cTLineno","cLineno") "cLineno" From "RHighlights"
		-- ) rh on rh."nHid" = t."nHid"
		-- group by t."unique_no",t.i 
		
		-- order by "unique_no";

				
		SELECT 
		  rh."nHid" AS "nId",
		  'QM' AS "cType",
		  	rh."cNote",
			rh."cNote" as "cONote",
			rh."dCreatedt",
			coalesce(rh."cTPageno",rh."cPageno") as "cPageno",
			rh."cTime",
			um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
			   JSON_AGG(JSON_BUILD_OBJECT(
		    'cIName', rmast."cIName",
		    'cColor', rmast."cColor",
			'cRelevance', null,
			'cImpact', null
		  )) AS "issues"
		FROM "RHighlights" rh 
		JOIN "RHighlightMapid" h ON rh."nHid" = h."nHid"
		JOIN "RIssueMaster" rmast ON rmast."nIid" = h."nIid"
		JOIN "UserMaster" um ON um."nUserid" = rh."nUserid"
		WHERE rh."nCaseid" = nCaseid
		  AND rh."nSessionId" =nSessionid
		  AND rh."nUserid" = nUserid
		GROUP BY rh."nHid", rh."cNote", rh."dCreatedt", um."cFname", um."cLname"
		order by rh."dCreatedt" desc;
   RETURN ref1;

END;
$function$
