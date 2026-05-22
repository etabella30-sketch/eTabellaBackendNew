CREATE OR REPLACE FUNCTION public.et_realtime_navigate_get_all_fact_list(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;

-- select * from public.et_realtime_navigate_get_all_fact_list ('{"nCaseid": "007a3614-ac77-40e4-bad1-4962b6571c58", "nUserid": "7ee7a723-d96d-4d63-81c1-4dc4a2be4699", "nSessionid": "cf41f667-d8cc-4653-8e03-b882b5949782"}','r1');fetch all in "r1";

    OPEN ref1 FOR 
		-- QM Type Highlights
		SELECT 
		  rh."nHid" AS "nId",
		  'QM' AS "cType",
		  rh."cNote",
		  rh."cNote" AS "cONote",
		  rh."dCreatedt",
		   rh."cTime",
		  coalesce(rh."cTPageno",rh."cPageno") as "cPageno",
		  '' as "cColor",
		  um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		  null as "jCordinates",
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
		  AND rh."nSessionId" = nSessionid
		  AND rh."nUserid" = nUserid
		GROUP BY rh."nHid", rh."cNote", rh."dCreatedt", um."cFname", um."cLname"
		
		UNION ALL
		
		-- QF Type Issue Details
		SELECT 
		  rd."nIDid" AS "nId",
		  'QF' AS "cType",
		  rd."cNote",
		  rd."cONote",
		  rd."dCreatedt",
		  '' as "cTime",
		  coalesce(rd."cTPageno",rd."cPageno") as "cPageno",
		  rmast."cColor",
		  um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		  rd."jCordinates",
		  JSON_AGG(JSON_BUILD_OBJECT(
		    'cIName', rmast."cIName",
		    'cColor', rmast."cColor",
		    'cRelevance', rl."cCodename",
		    'cImpact', imp."cCodename",
		   'nICid', rmast."nICid",
		   'cCategory', ic."cCategory"
		  )) AS "issues"
		FROM "RIssueDetail" rd 
		JOIN "RIssueMapid" rm ON rm."nIDid" = rd."nIDid"
		JOIN "RIssueMaster" rmast ON rmast."nIid" = rm."nIid"
		JOIN "IssueCategory" ic ON ic."nICid" = rmast."nICid"
		JOIN "UserMaster" um ON um."nUserid" = rmast."nUserid"
		LEFT JOIN "Codemaster" rl ON rl."nCodeid" = rm."nRelid"
		LEFT JOIN "Codemaster" imp ON imp."nCodeid" = rm."nImpactid"
		WHERE rd."nCaseid" = nCaseid
		  AND rd."nSessionid" = nSessionid
		  AND rd."nUserid" = nUserid
		GROUP BY rd."nIDid", rd."cNote", rd."dCreatedt", rmast."cIName", rmast."cColor", um."cFname", um."cLname"
		ORDER BY "dCreatedt" DESC;

   RETURN ref1;

END;
$function$
